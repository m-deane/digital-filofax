import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const ideasRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.array(z.enum(["NEW", "EXPLORING", "IN_PROGRESS", "IMPLEMENTED", "ARCHIVED"])).optional(),
        categoryId: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
        search: z.string().max(500).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const ideas = await ctx.db.idea.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.status && { status: { in: input.status } }),
          ...(input?.categoryId && { categoryId: input.categoryId }),
          ...(input?.tagIds && {
            tags: { some: { id: { in: input.tagIds } } },
          }),
          ...(input?.search && {
            OR: [
              { title: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
            ],
          }),
        },
        include: {
          category: true,
          tags: true,
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: input?.limit ?? 50,
        ...(input?.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      return {
        ideas,
        nextCursor: ideas.length === (input?.limit ?? 50) ? ideas[ideas.length - 1]?.id : undefined,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const idea = await ctx.db.idea.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          category: true,
          tags: true,
        },
      });

      if (!idea) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Idea not found" });
      }

      return idea;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional(),
        status: z.enum(["NEW", "EXPLORING", "IN_PROGRESS", "IMPLEMENTED", "ARCHIVED"]).default("NEW"),
        priority: z.number().min(0).max(5).default(0),
        categoryId: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tagIds, ...ideaData } = input;

      return ctx.db.idea.create({
        data: {
          ...ideaData,
          userId: ctx.session.user.id,
          ...(tagIds && {
            tags: { connect: tagIds.map((id) => ({ id })) },
          }),
        },
        include: {
          category: true,
          tags: true,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(5000).nullable().optional(),
        status: z.enum(["NEW", "EXPLORING", "IN_PROGRESS", "IMPLEMENTED", "ARCHIVED"]).optional(),
        priority: z.number().min(0).max(5).optional(),
        categoryId: z.string().nullable().optional(),
        tagIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, tagIds, ...updateData } = input;

      const existing = await ctx.db.idea.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Idea not found" });
      }

      return ctx.db.idea.update({
        where: { id },
        data: {
          ...updateData,
          ...(tagIds && {
            tags: { set: tagIds.map((id) => ({ id })) },
          }),
        },
        include: {
          category: true,
          tags: true,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.idea.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Idea not found" });
      }

      await ctx.db.idea.delete({ where: { id: input.id } });

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["NEW", "EXPLORING", "IN_PROGRESS", "IMPLEMENTED", "ARCHIVED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.idea.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Idea not found" });
      }

      return ctx.db.idea.update({
        where: { id: input.id },
        data: { status: input.status },
        include: {
          category: true,
          tags: true,
        },
      });
    }),

  updatePriority: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        priority: z.number().min(0).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.idea.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Idea not found" });
      }

      return ctx.db.idea.update({
        where: { id: input.id },
        data: { priority: input.priority },
        include: {
          category: true,
          tags: true,
        },
      });
    }),

  // Get ideas grouped by status for kanban board
  getByStatus: protectedProcedure.query(async ({ ctx }) => {
    const ideas = await ctx.db.idea.findMany({
      where: {
        userId: ctx.session.user.id,
        status: { not: "ARCHIVED" },
      },
      include: {
        category: true,
        tags: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return {
      NEW: ideas.filter((i) => i.status === "NEW"),
      EXPLORING: ideas.filter((i) => i.status === "EXPLORING"),
      IN_PROGRESS: ideas.filter((i) => i.status === "IN_PROGRESS"),
      IMPLEMENTED: ideas.filter((i) => i.status === "IMPLEMENTED"),
    };
  }),

  // Get archived ideas
  getArchived: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.idea.findMany({
        where: {
          userId: ctx.session.user.id,
          status: "ARCHIVED",
        },
        include: {
          category: true,
          tags: true,
        },
        orderBy: { updatedAt: "desc" },
        take: input.limit,
      });
    }),

  // Quick capture for ideas
  quickCapture: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.idea.create({
        data: {
          title: input.title,
          description: input.description,
          status: "NEW",
          priority: 0,
          userId: ctx.session.user.id,
        },
        include: {
          category: true,
          tags: true,
        },
      });
    }),
});
