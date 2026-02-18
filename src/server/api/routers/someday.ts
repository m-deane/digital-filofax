import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { SomedayItemType, Prisma } from "@prisma/client";

const somedayItemTypeSchema = z.enum(["TASK", "PROJECT", "IDEA"]);

export const somedayRouter = createTRPCRouter({
  // Get all someday items
  getAll: protectedProcedure
    .input(
      z
        .object({
          type: somedayItemTypeSchema.optional(),
          category: z.string().max(100).optional(),
          search: z.string().max(500).optional(),
          reviewDue: z.boolean().optional(), // Filter items due for review
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.SomedayItemWhereInput = {
        userId: ctx.session.user.id,
      };

      if (input?.type) {
        where.type = input.type as SomedayItemType;
      }

      if (input?.category) {
        where.category = input.category;
      }

      if (input?.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }

      if (input?.reviewDue) {
        const today = new Date();
        where.reviewDate = {
          lte: today,
        };
      }

      return ctx.db.somedayItem.findMany({
        where,
        orderBy: [{ reviewDate: "asc" }, { createdAt: "desc" }],
      });
    }),

  // Get items due for review
  getReviewDue: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();

    return ctx.db.somedayItem.findMany({
      where: {
        userId: ctx.session.user.id,
        reviewDate: {
          lte: today,
        },
      },
      orderBy: { reviewDate: "asc" },
    });
  }),

  // Get single item by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.somedayItem.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      return item;
    }),

  // Create new someday item
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional(),
        type: somedayItemTypeSchema.default("IDEA"),
        category: z.string().max(200).optional(),
        reviewDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.somedayItem.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Update someday item
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(5000).optional(),
        type: somedayItemTypeSchema.optional(),
        category: z.string().max(200).nullable().optional(),
        reviewDate: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.db.somedayItem.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      return ctx.db.somedayItem.update({
        where: { id },
        data,
      });
    }),

  // Delete someday item
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.somedayItem.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      await ctx.db.somedayItem.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // Promote someday item to active task
  promoteToTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        dueDate: z.date().optional(),
        categoryId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...taskData } = input;

      const somedayItem = await ctx.db.somedayItem.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!somedayItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Someday item not found",
        });
      }

      // Create task from someday item
      const task = await ctx.db.task.create({
        data: {
          title: somedayItem.title,
          description: somedayItem.description,
          priority: taskData.priority ?? "MEDIUM",
          status: "TODO",
          userId: ctx.session.user.id,
          categoryId: taskData.categoryId,
          dueDate: taskData.dueDate,
        },
        include: {
          category: true,
          tags: true,
          subtasks: true,
        },
      });

      // Delete the someday item
      await ctx.db.somedayItem.delete({ where: { id } });

      return task;
    }),

  // Promote someday item to goal
  promoteToGoal: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        deadline: z.date().optional(),
        categoryId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...goalData } = input;

      const somedayItem = await ctx.db.somedayItem.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!somedayItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Someday item not found",
        });
      }

      // Create goal from someday item
      const goal = await ctx.db.goal.create({
        data: {
          title: somedayItem.title,
          description: somedayItem.description,
          status: "NOT_STARTED",
          userId: ctx.session.user.id,
          categoryId: goalData.categoryId,
          deadline: goalData.deadline,
        },
        include: {
          category: true,
          milestones: true,
        },
      });

      // Delete the someday item
      await ctx.db.somedayItem.delete({ where: { id } });

      return goal;
    }),

  // Get statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const items = await ctx.db.somedayItem.findMany({
      where: { userId: ctx.session.user.id },
    });

    const today = new Date();
    const reviewDue = items.filter(
      (item) => item.reviewDate && item.reviewDate <= today
    ).length;

    const byType = {
      task: items.filter((i) => i.type === "TASK").length,
      project: items.filter((i) => i.type === "PROJECT").length,
      idea: items.filter((i) => i.type === "IDEA").length,
    };

    return {
      total: items.length,
      reviewDue,
      byType,
    };
  }),
});
