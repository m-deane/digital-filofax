import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const categoriesRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            tasks: true,
            habits: true,
            ideas: true,
          },
        },
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.category.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          _count: {
            select: {
              tasks: true,
              habits: true,
              ideas: true,
            },
          },
        },
      });

      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      return category;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.category.findFirst({
        where: {
          userId: ctx.session.user.id,
          name: { equals: input.name, mode: "insensitive" },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A category with this name already exists",
        });
      }

      const maxOrder = await ctx.db.category.aggregate({
        where: { userId: ctx.session.user.id },
        _max: { order: true },
      });

      return ctx.db.category.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          order: (maxOrder._max.order ?? 0) + 1,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icon: z.string().nullable().optional(),
        order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.category.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      if (updateData.name) {
        const duplicate = await ctx.db.category.findFirst({
          where: {
            userId: ctx.session.user.id,
            name: { equals: updateData.name, mode: "insensitive" },
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A category with this name already exists",
          });
        }
      }

      return ctx.db.category.update({
        where: { id },
        data: updateData,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.category.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      await ctx.db.category.delete({ where: { id: input.id } });

      return { success: true };
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        categories: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.categories.map((category) =>
          ctx.db.category.updateMany({
            where: { id: category.id, userId: ctx.session.user.id },
            data: { order: category.order },
          })
        )
      );

      return { success: true };
    }),
});
