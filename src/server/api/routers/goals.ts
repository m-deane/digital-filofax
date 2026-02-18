import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const goalTypeSchema = z.enum([
  "LIFETIME",
  "THREE_YEAR",
  "ANNUAL",
  "QUARTERLY",
  "MONTHLY",
]);

const goalStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
  "ABANDONED",
]);

export const goalsRouter = createTRPCRouter({
  // Get all goals for user (with hierarchy)
  getAll: protectedProcedure
    .input(
      z
        .object({
          status: goalStatusSchema.optional(),
          type: goalTypeSchema.optional(),
          categoryId: z.string().optional(),
          includeChildren: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.goal.findMany({
        where: {
          userId: ctx.session.user.id,
          parentGoalId: input?.includeChildren ? undefined : null, // Top-level only by default
          ...(input?.status && { status: input.status }),
          ...(input?.type && { type: input.type }),
          ...(input?.categoryId && { categoryId: input.categoryId }),
        },
        include: {
          category: true,
          milestones: {
            orderBy: { date: "asc" },
          },
          tasks: {
            where: { status: { not: "DONE" } },
            take: 5,
            orderBy: { priority: "desc" },
          },
          childGoals: {
            include: {
              milestones: true,
              childGoals: {
                include: {
                  milestones: true,
                },
              },
              _count: {
                select: {
                  tasks: true,
                  milestones: true,
                },
              },
            },
            orderBy: [{ type: "desc" }, { createdAt: "desc" }],
          },
          parentGoal: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              milestones: true,
              childGoals: true,
            },
          },
        },
        orderBy: [
          { type: "asc" }, // Lifetime first, then annual, quarterly, monthly
          { status: "asc" },
          { targetDate: "asc" },
          { createdAt: "desc" },
        ],
      });
    }),

  // Get goal hierarchy (tree structure)
  getHierarchy: protectedProcedure
    .input(
      z
        .object({
          rootType: goalTypeSchema.optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      // Get all root goals (no parent)
      const rootGoals = await ctx.db.goal.findMany({
        where: {
          userId: ctx.session.user.id,
          parentGoalId: null,
          ...(input?.rootType && { type: input.rootType }),
        },
        include: {
          category: true,
          milestones: {
            orderBy: { date: "asc" },
          },
          childGoals: {
            include: {
              category: true,
              milestones: true,
              childGoals: {
                include: {
                  category: true,
                  milestones: true,
                  childGoals: {
                    include: {
                      category: true,
                      milestones: true,
                    },
                  },
                },
              },
            },
            orderBy: [{ type: "desc" }, { createdAt: "desc" }],
          },
          _count: {
            select: {
              tasks: true,
              milestones: true,
              childGoals: true,
            },
          },
        },
        orderBy: [{ type: "asc" }, { createdAt: "desc" }],
      });

      return rootGoals;
    }),

  // Get a single goal with all details
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.goal.findUnique({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          category: true,
          milestones: {
            orderBy: { date: "asc" },
          },
          tasks: {
            include: {
              category: true,
              subtasks: true,
            },
            orderBy: [{ status: "asc" }, { priority: "desc" }],
          },
          childGoals: {
            include: {
              milestones: true,
              _count: {
                select: { tasks: true },
              },
            },
          },
          parentGoal: true,
        },
      });
    }),

  // Create a new goal
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional(),
        type: goalTypeSchema.optional(),
        targetDate: z.date().optional(),
        deadline: z.date().optional(),
        color: z.string().max(50).optional(),
        categoryId: z.string().optional(),
        parentGoalId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify parent goal belongs to user if provided
      if (input.parentGoalId) {
        const parentGoal = await ctx.db.goal.findUnique({
          where: { id: input.parentGoalId, userId: ctx.session.user.id },
        });
        if (!parentGoal) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Parent goal not found" });
        }
      }

      return ctx.db.goal.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
        include: {
          category: true,
          milestones: true,
          parentGoal: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      });
    }),

  // Update a goal
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(5000).optional(),
        type: goalTypeSchema.optional(),
        status: goalStatusSchema.optional(),
        targetDate: z.date().nullable().optional(),
        deadline: z.date().nullable().optional(),
        progress: z.number().min(0).max(100).optional(),
        color: z.string().max(50).optional(),
        categoryId: z.string().nullable().optional(),
        parentGoalId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, ...data } = input;

      // Verify parent goal if changing
      if (data.parentGoalId !== undefined && data.parentGoalId !== null) {
        const parentGoal = await ctx.db.goal.findUnique({
          where: { id: data.parentGoalId, userId: ctx.session.user.id },
        });
        if (!parentGoal) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Parent goal not found" });
        }
      }

      return ctx.db.goal.update({
        where: {
          id,
          userId: ctx.session.user.id,
        },
        data: {
          ...data,
          ...(status && {
            status,
            completedAt: status === "COMPLETED" ? new Date() : null,
          }),
        },
        include: {
          category: true,
          milestones: true,
          parentGoal: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      });
    }),

  // Update progress (automatically calculates from milestones and child goals)
  updateProgress: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        progress: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goal.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          progress: input.progress,
        },
      });
    }),

  // Delete a goal
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goal.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Add a milestone to a goal
  addMilestone: protectedProcedure
    .input(
      z.object({
        goalId: z.string(),
        title: z.string().min(1).max(500),
        date: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify goal belongs to user
      const goal = await ctx.db.goal.findUnique({
        where: { id: input.goalId, userId: ctx.session.user.id },
      });
      if (!goal) throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found" });

      return ctx.db.milestone.create({
        data: {
          title: input.title,
          date: input.date,
          goalId: input.goalId,
        },
      });
    }),

  // Update a milestone
  updateMilestone: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        date: z.date().optional(),
        completed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, completed, ...data } = input;

      // Verify milestone belongs to user's goal
      const milestone = await ctx.db.milestone.findUnique({
        where: { id },
        include: { goal: true },
      });
      if (!milestone || milestone.goal.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Milestone not found" });
      }

      return ctx.db.milestone.update({
        where: { id },
        data: {
          ...data,
          ...(completed !== undefined && {
            completed,
            completedAt: completed ? new Date() : null,
          }),
        },
      });
    }),

  // Delete a milestone
  deleteMilestone: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const milestone = await ctx.db.milestone.findUnique({
        where: { id: input.id },
        include: { goal: true },
      });
      if (!milestone || milestone.goal.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Milestone not found" });
      }

      return ctx.db.milestone.delete({
        where: { id: input.id },
      });
    }),

  // Link a task to a goal
  linkTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        goalId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify both task and goal belong to user
      const [task, goal] = await Promise.all([
        ctx.db.task.findUnique({
          where: { id: input.taskId, userId: ctx.session.user.id },
        }),
        ctx.db.goal.findUnique({
          where: { id: input.goalId, userId: ctx.session.user.id },
        }),
      ]);

      if (!task || !goal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task or Goal not found" });
      }

      return ctx.db.task.update({
        where: { id: input.taskId },
        data: { goalId: input.goalId },
      });
    }),

  // Unlink a task from a goal
  unlinkTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.task.update({
        where: {
          id: input.taskId,
          userId: ctx.session.user.id,
        },
        data: { goalId: null },
      });
    }),

  // Get goal statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const goals = await ctx.db.goal.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        milestones: true,
        _count: { select: { tasks: true } },
      },
    });

    const total = goals.length;
    const completed = goals.filter((g) => g.status === "COMPLETED").length;
    const inProgress = goals.filter((g) => g.status === "IN_PROGRESS").length;
    const notStarted = goals.filter((g) => g.status === "NOT_STARTED").length;

    // Get goals by type
    const lifetimeGoals = goals.filter((g) => g.type === "LIFETIME").length;
    const threeYearGoals = goals.filter((g) => g.type === "THREE_YEAR").length;
    const annualGoals = goals.filter((g) => g.type === "ANNUAL").length;
    const quarterlyGoals = goals.filter((g) => g.type === "QUARTERLY").length;
    const monthlyGoals = goals.filter((g) => g.type === "MONTHLY").length;

    const upcomingMilestones = goals
      .flatMap((g) => g.milestones)
      .filter((m) => !m.completed && new Date(m.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    return {
      total,
      completed,
      inProgress,
      notStarted,
      byType: {
        lifetime: lifetimeGoals,
        threeYear: threeYearGoals,
        annual: annualGoals,
        quarterly: quarterlyGoals,
        monthly: monthlyGoals,
      },
      upcomingMilestones,
    };
  }),
});
