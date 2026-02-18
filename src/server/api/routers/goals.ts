import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const goalStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
  "ABANDONED",
]);

export const goalsRouter = createTRPCRouter({
  // Get all goals for user
  getAll: protectedProcedure
    .input(
      z
        .object({
          status: goalStatusSchema.optional(),
          categoryId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.goal.findMany({
        where: {
          userId: ctx.session.user.id,
          parentGoalId: null, // Top-level goals only
          ...(input?.status && { status: input.status }),
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
            },
          },
          _count: {
            select: {
              tasks: true,
              milestones: true,
            },
          },
        },
        orderBy: [{ status: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
      });
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
        title: z.string().min(1),
        description: z.string().optional(),
        deadline: z.date().optional(),
        color: z.string().optional(),
        categoryId: z.string().optional(),
        parentGoalId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goal.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
        include: {
          category: true,
          milestones: true,
        },
      });
    }),

  // Update a goal
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: goalStatusSchema.optional(),
        deadline: z.date().nullable().optional(),
        progress: z.number().min(0).max(100).optional(),
        color: z.string().optional(),
        categoryId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.goal.update({
        where: {
          id,
          userId: ctx.session.user.id,
        },
        data,
        include: {
          category: true,
          milestones: true,
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
        title: z.string().min(1),
        date: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify goal belongs to user
      const goal = await ctx.db.goal.findUnique({
        where: { id: input.goalId, userId: ctx.session.user.id },
      });
      if (!goal) throw new Error("Goal not found");

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
        title: z.string().min(1).optional(),
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
        throw new Error("Milestone not found");
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
        throw new Error("Milestone not found");
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
        throw new Error("Task or Goal not found");
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
      upcomingMilestones,
    };
  }),
});
