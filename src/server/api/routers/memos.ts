import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const memosRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        includeArchived: z.boolean().default(false),
        memoType: z.array(z.enum(["NOTE", "ANECDOTE", "JOURNAL", "MEETING", "QUICK_THOUGHT"])).optional(),
        tagIds: z.array(z.string()).optional(),
        search: z.string().optional(),
        pinnedOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const memos = await ctx.db.memo.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(!input?.includeArchived && { isArchived: false }),
          ...(input?.memoType && { memoType: { in: input.memoType } }),
          ...(input?.tagIds && {
            tags: { some: { id: { in: input.tagIds } } },
          }),
          ...(input?.pinnedOnly && { isPinned: true }),
          ...(input?.search && {
            OR: [
              { title: { contains: input.search, mode: "insensitive" } },
              { content: { contains: input.search, mode: "insensitive" } },
            ],
          }),
        },
        include: {
          tags: true,
        },
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        take: input?.limit ?? 50,
        ...(input?.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      return {
        memos,
        nextCursor: memos.length === (input?.limit ?? 50) ? memos[memos.length - 1]?.id : undefined,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const memo = await ctx.db.memo.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          tags: true,
        },
      });

      if (!memo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Memo not found" });
      }

      return memo;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        content: z.string(),
        memoType: z.enum(["NOTE", "ANECDOTE", "JOURNAL", "MEETING", "QUICK_THOUGHT"]).default("NOTE"),
        isPinned: z.boolean().default(false),
        tagIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tagIds, ...memoData } = input;

      return ctx.db.memo.create({
        data: {
          ...memoData,
          userId: ctx.session.user.id,
          ...(tagIds && {
            tags: { connect: tagIds.map((id) => ({ id })) },
          }),
        },
        include: {
          tags: true,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        content: z.string().optional(),
        memoType: z.enum(["NOTE", "ANECDOTE", "JOURNAL", "MEETING", "QUICK_THOUGHT"]).optional(),
        isPinned: z.boolean().optional(),
        isArchived: z.boolean().optional(),
        tagIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, tagIds, ...updateData } = input;

      const existing = await ctx.db.memo.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Memo not found" });
      }

      return ctx.db.memo.update({
        where: { id },
        data: {
          ...updateData,
          ...(tagIds && {
            tags: { set: tagIds.map((id) => ({ id })) },
          }),
        },
        include: {
          tags: true,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.memo.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Memo not found" });
      }

      await ctx.db.memo.delete({ where: { id: input.id } });

      return { success: true };
    }),

  togglePin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.memo.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Memo not found" });
      }

      return ctx.db.memo.update({
        where: { id: input.id },
        data: { isPinned: !existing.isPinned },
        include: { tags: true },
      });
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.memo.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Memo not found" });
      }

      return ctx.db.memo.update({
        where: { id: input.id },
        data: { isArchived: true, isPinned: false },
        include: { tags: true },
      });
    }),

  unarchive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.memo.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Memo not found" });
      }

      return ctx.db.memo.update({
        where: { id: input.id },
        data: { isArchived: false },
        include: { tags: true },
      });
    }),

  // Quick capture - minimal input for fast note creation
  quickCapture: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        memoType: z.enum(["NOTE", "ANECDOTE", "JOURNAL", "MEETING", "QUICK_THOUGHT"]).default("QUICK_THOUGHT"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate title from first line or first 50 chars
      const firstLine = input.content.split("\n")[0] ?? input.content;
      const title = firstLine.length > 50 ? firstLine.substring(0, 50) + "..." : firstLine;

      return ctx.db.memo.create({
        data: {
          title,
          content: input.content,
          memoType: input.memoType,
          userId: ctx.session.user.id,
        },
        include: {
          tags: true,
        },
      });
    }),

  // Get recent memos for dashboard
  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.memo.findMany({
        where: {
          userId: ctx.session.user.id,
          isArchived: false,
        },
        include: {
          tags: true,
        },
        orderBy: { updatedAt: "desc" },
        take: input.limit,
      });
    }),

  // Search memos
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.memo.findMany({
        where: {
          userId: ctx.session.user.id,
          OR: [
            { title: { contains: input.query, mode: "insensitive" } },
            { content: { contains: input.query, mode: "insensitive" } },
            { tags: { some: { name: { contains: input.query, mode: "insensitive" } } } },
          ],
        },
        include: {
          tags: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      });
    }),
});
