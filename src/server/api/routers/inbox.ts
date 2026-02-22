import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const inboxRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.inboxItem.findMany({
      where: {
        userId: ctx.session.user.id,
        processed: false,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.inboxItem.count({
      where: {
        userId: ctx.session.user.id,
        processed: false,
      },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().max(5000).optional(),
        sourceHint: z.enum(["task", "memo", "idea"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.inboxItem.create({
        data: {
          title: input.title,
          content: input.content,
          sourceHint: input.sourceHint,
          userId: ctx.session.user.id,
        },
      });
    }),

  processAsTask: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.inboxItem.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inbox item not found" });
      }

      const task = await ctx.db.task.create({
        data: {
          title: item.title,
          description: item.content,
          status: "TODO",
          priority: "MEDIUM",
          userId: ctx.session.user.id,
          order: 0,
        },
      });

      await ctx.db.inboxItem.update({
        where: { id: input.id },
        data: { processed: true },
      });

      return task;
    }),

  processAsMemo: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.inboxItem.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inbox item not found" });
      }

      const memo = await ctx.db.memo.create({
        data: {
          title: item.title,
          content: item.content ?? "",
          memoType: "NOTE",
          userId: ctx.session.user.id,
        },
      });

      await ctx.db.inboxItem.update({
        where: { id: input.id },
        data: { processed: true },
      });

      return memo;
    }),

  processAsIdea: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.inboxItem.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inbox item not found" });
      }

      const idea = await ctx.db.idea.create({
        data: {
          title: item.title,
          description: item.content,
          status: "NEW",
          priority: 0,
          userId: ctx.session.user.id,
        },
      });

      await ctx.db.inboxItem.update({
        where: { id: input.id },
        data: { processed: true },
      });

      return idea;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.inboxItem.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inbox item not found" });
      }

      await ctx.db.inboxItem.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
