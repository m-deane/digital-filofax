import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const tagsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.tag.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        _count: {
          select: {
            tasks: true,
            memos: true,
            ideas: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tag = await ctx.db.tag.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          _count: {
            select: {
              tasks: true,
              memos: true,
              ideas: true,
            },
          },
        },
      });

      if (!tag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
      }

      return tag;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#8b5cf6"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.tag.findFirst({
        where: {
          userId: ctx.session.user.id,
          name: { equals: input.name, mode: "insensitive" },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A tag with this name already exists",
        });
      }

      return ctx.db.tag.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(50).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.tag.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
      }

      if (updateData.name) {
        const duplicate = await ctx.db.tag.findFirst({
          where: {
            userId: ctx.session.user.id,
            name: { equals: updateData.name, mode: "insensitive" },
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A tag with this name already exists",
          });
        }
      }

      return ctx.db.tag.update({
        where: { id },
        data: updateData,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.tag.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
      }

      await ctx.db.tag.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // Get or create tag (useful for quick tagging)
  getOrCreate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#8b5cf6"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.tag.findFirst({
        where: {
          userId: ctx.session.user.id,
          name: { equals: input.name, mode: "insensitive" },
        },
      });

      if (existing) {
        return existing;
      }

      return ctx.db.tag.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Search tags by name
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tag.findMany({
        where: {
          userId: ctx.session.user.id,
          name: { contains: input.query, mode: "insensitive" },
        },
        take: 10,
        orderBy: { name: "asc" },
      });
    }),

  // Get popular tags (most used)
  getPopular: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      const tags = await ctx.db.tag.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          _count: {
            select: {
              tasks: true,
              memos: true,
              ideas: true,
            },
          },
        },
      });

      // Sort by total usage count
      return tags
        .map((tag) => ({
          ...tag,
          totalCount: tag._count.tasks + tag._count.memos + tag._count.ideas,
        }))
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, input.limit);
    }),
});
