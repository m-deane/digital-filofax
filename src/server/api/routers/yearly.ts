import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const yearlyGoalStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "DEFERRED",
]);

const quarterSchema = z.enum(["Q1", "Q2", "Q3", "Q4"]);

export const yearlyRouter = createTRPCRouter({
  // ============================================================================
  // YEARLY GOALS
  // ============================================================================

  // Get all goals for a specific year
  goals: createTRPCRouter({
    getByYear: protectedProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ ctx, input }) => {
        return ctx.db.yearlyGoal.findMany({
          where: {
            userId: ctx.session.user.id,
            year: input.year,
          },
          orderBy: [{ quarter: "asc" }, { createdAt: "asc" }],
        });
      }),

    create: protectedProcedure
      .input(
        z.object({
          year: z.number(),
          title: z.string().min(1).max(200),
          description: z.string().max(5000).optional(),
          category: z.string().max(100).optional(),
          status: yearlyGoalStatusSchema.optional(),
          quarter: quarterSchema.optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.db.yearlyGoal.create({
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
          title: z.string().min(1).max(200).optional(),
          description: z.string().max(5000).optional(),
          category: z.string().max(100).nullable().optional(),
          status: yearlyGoalStatusSchema.optional(),
          quarter: quarterSchema.nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return ctx.db.yearlyGoal.update({
          where: {
            id,
            userId: ctx.session.user.id,
          },
          data,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return ctx.db.yearlyGoal.delete({
          where: {
            id: input.id,
            userId: ctx.session.user.id,
          },
        });
      }),
  }),

  // ============================================================================
  // YEARLY REFLECTION
  // ============================================================================

  reflection: createTRPCRouter({
    getByYear: protectedProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ ctx, input }) => {
        return ctx.db.yearlyReflection.findUnique({
          where: {
            userId_year: {
              userId: ctx.session.user.id,
              year: input.year,
            },
          },
        });
      }),

    create: protectedProcedure
      .input(
        z.object({
          year: z.number(),
          accomplishments: z.array(z.string().max(1000)).max(50).optional(),
          challenges: z.array(z.string().max(1000)).max(50).optional(),
          lessonsLearned: z.array(z.string().max(1000)).max(50).optional(),
          gratitudes: z.array(z.string().max(1000)).max(50).optional(),
          rating: z.number().min(1).max(10).optional(),
          nextYearIntentions: z.array(z.string().max(1000)).max(50).optional(),
          visionStatement: z.string().max(5000).optional(),
          themeWord: z.string().max(100).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.db.yearlyReflection.create({
          data: {
            ...input,
            userId: ctx.session.user.id,
          },
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          year: z.number(),
          accomplishments: z.array(z.string().max(1000)).max(50).optional(),
          challenges: z.array(z.string().max(1000)).max(50).optional(),
          lessonsLearned: z.array(z.string().max(1000)).max(50).optional(),
          gratitudes: z.array(z.string().max(1000)).max(50).optional(),
          rating: z.number().min(1).max(10).nullable().optional(),
          nextYearIntentions: z.array(z.string().max(1000)).max(50).optional(),
          visionStatement: z.string().max(5000).nullable().optional(),
          themeWord: z.string().max(100).nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { year, ...data } = input;
        return ctx.db.yearlyReflection.upsert({
          where: {
            userId_year: {
              userId: ctx.session.user.id,
              year,
            },
          },
          create: {
            year,
            userId: ctx.session.user.id,
            ...data,
          },
          update: data,
        });
      }),
  }),

  // ============================================================================
  // YEAR STATISTICS
  // ============================================================================

  getYearStats: protectedProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ ctx, input }) => {
      const { year } = input;
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);

      // Run all queries in parallel
      const [tasksCompleted, tasksCreated, habitLogs, activeHabits, yearlyGoals, memosCreated, ideasCreated] = await Promise.all([
        ctx.db.task.count({
          where: {
            userId: ctx.session.user.id,
            status: "DONE",
            completedAt: { gte: startOfYear, lte: endOfYear },
          },
        }),
        ctx.db.task.count({
          where: {
            userId: ctx.session.user.id,
            createdAt: { gte: startOfYear, lte: endOfYear },
          },
        }),
        ctx.db.habitLog.count({
          where: {
            userId: ctx.session.user.id,
            date: { gte: startOfYear, lte: endOfYear },
          },
        }),
        ctx.db.habit.count({
          where: {
            userId: ctx.session.user.id,
            isArchived: false,
          },
        }),
        ctx.db.yearlyGoal.findMany({
          where: {
            userId: ctx.session.user.id,
            year,
          },
        }),
        ctx.db.memo.count({
          where: {
            userId: ctx.session.user.id,
            createdAt: { gte: startOfYear, lte: endOfYear },
          },
        }),
        ctx.db.idea.count({
          where: {
            userId: ctx.session.user.id,
            createdAt: { gte: startOfYear, lte: endOfYear },
          },
        }),
      ]);

      const goalsStats = {
        total: yearlyGoals.length,
        completed: yearlyGoals.filter((g) => g.status === "COMPLETED").length,
        inProgress: yearlyGoals.filter((g) => g.status === "IN_PROGRESS").length,
        notStarted: yearlyGoals.filter((g) => g.status === "NOT_STARTED").length,
        deferred: yearlyGoals.filter((g) => g.status === "DEFERRED").length,
      };

      return {
        year,
        tasks: {
          completed: tasksCompleted,
          created: tasksCreated,
          completionRate:
            tasksCreated > 0
              ? Math.round((tasksCompleted / tasksCreated) * 100)
              : 0,
        },
        habits: {
          logs: habitLogs,
          active: activeHabits,
        },
        goals: goalsStats,
        memos: memosCreated,
        ideas: ideasCreated,
      };
    }),

  // Get activity by month for the year
  getMonthlyActivity: protectedProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ ctx, input }) => {
      const { year } = input;
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);

      // Fetch all data for the year in 3 parallel queries instead of 36 sequential queries
      const [tasks, habitLogs, memos] = await Promise.all([
        ctx.db.task.findMany({
          where: {
            userId: ctx.session.user.id,
            status: "DONE",
            completedAt: { gte: yearStart, lte: yearEnd },
          },
          select: { completedAt: true },
        }),
        ctx.db.habitLog.findMany({
          where: {
            userId: ctx.session.user.id,
            date: { gte: yearStart, lte: yearEnd },
          },
          select: { date: true },
        }),
        ctx.db.memo.findMany({
          where: {
            userId: ctx.session.user.id,
            createdAt: { gte: yearStart, lte: yearEnd },
          },
          select: { createdAt: true },
        }),
      ]);

      // Bucket into months client-side
      const monthlyData: Array<{
        month: number;
        tasks: number;
        habitLogs: number;
        memos: number;
      }> = [];

      for (let month = 0; month < 12; month++) {
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

        monthlyData.push({
          month: month + 1,
          tasks: tasks.filter(
            (t) => t.completedAt && t.completedAt >= startOfMonth && t.completedAt <= endOfMonth
          ).length,
          habitLogs: habitLogs.filter(
            (l) => l.date >= startOfMonth && l.date <= endOfMonth
          ).length,
          memos: memos.filter(
            (m) => m.createdAt >= startOfMonth && m.createdAt <= endOfMonth
          ).length,
        });
      }

      return monthlyData;
    }),

  // Get available years (years with data)
  getAvailableYears: protectedProcedure.query(async ({ ctx }) => {
    const [tasks, habits, memos] = await Promise.all([
      ctx.db.task.findMany({
        where: { userId: ctx.session.user.id },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      }),
      ctx.db.habit.findMany({
        where: { userId: ctx.session.user.id },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      }),
      ctx.db.memo.findMany({
        where: { userId: ctx.session.user.id },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      }),
    ]);

    const dates = [
      ...tasks.map((t) => t.createdAt),
      ...habits.map((h) => h.createdAt),
      ...memos.map((m) => m.createdAt),
    ];

    if (dates.length === 0) {
      return [new Date().getFullYear()];
    }

    const earliestYear = Math.min(
      ...dates.map((d) => new Date(d).getFullYear())
    );
    const currentYear = new Date().getFullYear();

    const years: number[] = [];
    for (let y = earliestYear; y <= currentYear; y++) {
      years.push(y);
    }

    return years;
  }),
});
