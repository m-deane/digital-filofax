import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { startOfWeek, endOfWeek, subWeeks, startOfDay } from "date-fns";

export const reviewRouter = createTRPCRouter({
  getByWeek: protectedProcedure
    .input(z.object({ weekOf: z.date() }))
    .query(async ({ ctx, input }) => {
      const weekStart = startOfWeek(input.weekOf, { weekStartsOn: 1 }); // Monday

      const review = await ctx.db.weeklyReview.findUnique({
        where: {
          userId_weekOf: {
            userId: ctx.session.user.id,
            weekOf: weekStart,
          },
        },
      });

      return review;
    }),

  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(52).default(10) }))
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.db.weeklyReview.findMany({
        where: {
          userId: ctx.session.user.id,
          isDraft: false,
        },
        orderBy: { weekOf: "desc" },
        take: input.limit,
      });

      return reviews;
    }),

  create: protectedProcedure
    .input(
      z.object({
        weekOf: z.date(),
        wins: z.array(z.string().max(1000)).max(50).default([]),
        challenges: z.array(z.string().max(1000)).max(50).default([]),
        lessonsLearned: z.array(z.string().max(1000)).max(50).default([]),
        nextWeekFocus: z.array(z.string().max(1000)).max(50).default([]),
        gratitudes: z.array(z.string().max(1000)).max(50).default([]),
        rating: z.number().min(1).max(5),
        notes: z.string().max(5000).optional(),
        isDraft: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const weekStart = startOfWeek(input.weekOf, { weekStartsOn: 1 });

      const existing = await ctx.db.weeklyReview.findUnique({
        where: {
          userId_weekOf: {
            userId: ctx.session.user.id,
            weekOf: weekStart,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A review for this week already exists",
        });
      }

      const review = await ctx.db.weeklyReview.create({
        data: {
          ...input,
          weekOf: weekStart,
          userId: ctx.session.user.id,
          completedAt: !input.isDraft ? new Date() : null,
        },
      });

      return review;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        wins: z.array(z.string().max(1000)).max(50).optional(),
        challenges: z.array(z.string().max(1000)).max(50).optional(),
        lessonsLearned: z.array(z.string().max(1000)).max(50).optional(),
        nextWeekFocus: z.array(z.string().max(1000)).max(50).optional(),
        gratitudes: z.array(z.string().max(1000)).max(50).optional(),
        rating: z.number().min(1).max(5).optional(),
        notes: z.string().max(5000).nullable().optional(),
        isDraft: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.weeklyReview.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // If changing from draft to completed, set completedAt
      let completedAt = existing.completedAt;
      if (updateData.isDraft === false && existing.isDraft) {
        completedAt = new Date();
      } else if (updateData.isDraft === true) {
        completedAt = null;
      }

      const review = await ctx.db.weeklyReview.update({
        where: { id },
        data: {
          ...updateData,
          completedAt,
        },
      });

      return review;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.weeklyReview.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      await ctx.db.weeklyReview.delete({ where: { id: input.id } });

      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const reviews = await ctx.db.weeklyReview.findMany({
      where: {
        userId: ctx.session.user.id,
        isDraft: false,
      },
      orderBy: { weekOf: "desc" },
      take: 52, // Last year
    });

    const totalReviews = reviews.length;
    const completedReviews = reviews.filter((r) => r.completedAt).length;
    const completionRate = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Get ratings trend (last 12 weeks)
    const last12Weeks = reviews.slice(0, 12);
    const ratingsTrend = last12Weeks.map((r) => ({
      weekOf: r.weekOf,
      rating: r.rating,
    }));

    // Calculate consecutive weeks with reviews
    let currentStreak = 0;
    const sortedByWeek = [...reviews].sort(
      (a, b) => b.weekOf.getTime() - a.weekOf.getTime()
    );

    for (let i = 0; i < sortedByWeek.length; i++) {
      const expectedWeek = subWeeks(new Date(), i);
      const expectedWeekStart = startOfWeek(expectedWeek, { weekStartsOn: 1 });

      if (
        sortedByWeek[i] &&
        startOfDay(sortedByWeek[i].weekOf).getTime() ===
          startOfDay(expectedWeekStart).getTime()
      ) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalReviews,
      completedReviews,
      completionRate,
      avgRating: Math.round(avgRating * 10) / 10,
      ratingsTrend,
      currentStreak,
    };
  }),

  getWeeklySummary: protectedProcedure
    .input(z.object({ weekOf: z.date() }))
    .query(async ({ ctx, input }) => {
      const weekStart = startOfWeek(input.weekOf, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(input.weekOf, { weekStartsOn: 1 });

      // Get completed tasks for the week
      const completedTasks = await ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          status: "DONE",
          completedAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        include: {
          category: true,
          tags: true,
        },
        orderBy: { completedAt: "desc" },
      });

      // Get habit completion rate for the week
      const habits = await ctx.db.habit.findMany({
        where: {
          userId: ctx.session.user.id,
          isArchived: false,
        },
        include: {
          logs: {
            where: {
              date: {
                gte: weekStart,
                lte: weekEnd,
              },
            },
          },
        },
      });

      const habitStats = habits.map((habit) => ({
        id: habit.id,
        name: habit.name,
        completedDays: habit.logs.length,
        targetDays: 7, // Assuming daily habits for now
        completionRate: Math.round((habit.logs.length / 7) * 100),
      }));

      const avgHabitCompletion =
        habitStats.length > 0
          ? Math.round(
              habitStats.reduce((sum, h) => sum + h.completionRate, 0) /
                habitStats.length
            )
          : 0;

      return {
        completedTasks,
        habitStats,
        avgHabitCompletion,
        weekStart,
        weekEnd,
      };
    }),

  // GTD-specific queries
  getInboxCount: protectedProcedure.query(async ({ ctx }) => {
    // Count tasks without categories or contexts (inbox items)
    const inboxTasks = await ctx.db.task.count({
      where: {
        userId: ctx.session.user.id,
        status: { not: "DONE" },
        categoryId: null,
        contextId: null,
      },
    });

    return { count: inboxTasks };
  }),

  getStaleTasksCount: protectedProcedure.query(async ({ ctx }) => {
    // Count tasks that are overdue or haven't been updated in a while
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);

    const staleTasks = await ctx.db.task.count({
      where: {
        userId: ctx.session.user.id,
        status: { in: ["TODO", "IN_PROGRESS"] },
        OR: [
          {
            dueDate: {
              lt: now,
            },
          },
          {
            updatedAt: {
              lt: oneWeekAgo,
            },
          },
        ],
      },
    });

    return { count: staleTasks };
  }),

  needsReview: protectedProcedure.query(async ({ ctx }) => {
    // Check if user needs to do a weekly review
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);

    // Check for review in the past 7 days
    const recentReview = await ctx.db.weeklyReview.findFirst({
      where: {
        userId: ctx.session.user.id,
        weekOf: {
          gte: lastWeekStart,
        },
        isDraft: false,
      },
      orderBy: { weekOf: "desc" },
    });

    return {
      needsReview: !recentReview,
      lastReviewDate: recentReview?.weekOf ?? null,
      lastReviewCompleted: recentReview?.completedAt ?? null,
    };
  }),
});
