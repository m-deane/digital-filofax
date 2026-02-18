import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const contextsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.context.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const context = await ctx.db.context.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          tasks: {
            where: { status: { not: "DONE" } },
            include: {
              category: true,
              tags: true,
              subtasks: true,
            },
            orderBy: [{ order: "asc" }, { createdAt: "desc" }],
          },
        },
      });

      if (!context) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Context not found" });
      }

      return context;
    }),

  getTasksByContext: protectedProcedure
    .input(z.object({ contextId: z.string() }))
    .query(async ({ ctx, input }) => {
      const context = await ctx.db.context.findFirst({
        where: { id: input.contextId, userId: ctx.session.user.id },
      });

      if (!context) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Context not found" });
      }

      return ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          contextId: input.contextId,
          status: { not: "DONE" },
        },
        include: {
          category: true,
          tags: true,
          subtasks: { orderBy: { order: "asc" } },
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        icon: z.string().max(50).optional(),
        color: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate name
      const existing = await ctx.db.context.findFirst({
        where: { userId: ctx.session.user.id, name: input.name },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A context with this name already exists",
        });
      }

      return ctx.db.context.create({
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
        name: z.string().min(1).max(100).optional(),
        icon: z.string().max(50).optional(),
        color: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.context.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Context not found" });
      }

      // Check for duplicate name if name is being updated
      if (updateData.name && updateData.name !== existing.name) {
        const duplicate = await ctx.db.context.findFirst({
          where: {
            userId: ctx.session.user.id,
            name: updateData.name,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A context with this name already exists",
          });
        }
      }

      return ctx.db.context.update({
        where: { id },
        data: updateData,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.context.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Context not found" });
      }

      // Set contextId to null for all tasks with this context
      await ctx.db.task.updateMany({
        where: { contextId: input.id, userId: ctx.session.user.id },
        data: { contextId: null },
      });

      await ctx.db.context.delete({ where: { id: input.id } });

      return { success: true };
    }),

  getWithTaskCounts: protectedProcedure.query(async ({ ctx }) => {
    const contexts = await ctx.db.context.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            tasks: {
              where: { status: { not: "DONE" } },
            },
          },
        },
      },
    });

    return contexts.map((context) => ({
      ...context,
      activeTaskCount: context._count.tasks,
    }));
  }),
});
