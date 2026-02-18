import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { startOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";

export const reflectionsRouter = createTRPCRouter({
  // ============================================================================
  // DAILY REFLECTIONS
  // ============================================================================

  getDailyByDate: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ ctx, input }) => {
      const dateOnly = startOfDay(input.date);

      return ctx.db.dailyReflection.findFirst({
        where: {
          userId: ctx.session.user.id,
          date: dateOnly,
        },
      });
    }),

  getDailyRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.dailyReflection.findMany({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: startOfDay(input.startDate),
            lte: startOfDay(input.endDate),
          },
        },
        orderBy: { date: "desc" },
      });
    }),

  createOrUpdateDaily: protectedProcedure
    .input(
      z.object({
        date: z.date(),
        morningIntention: z.string().optional().nullable(),
        eveningReflection: z.string().optional().nullable(),
        wins: z.array(z.string()).optional(),
        improvements: z.array(z.string()).optional(),
        tomorrowFocus: z.string().optional().nullable(),
        energyLevel: z.number().min(1).max(5).optional().nullable(),
        productivityRating: z.number().min(1).max(5).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { date, ...data } = input;
      const dateOnly = startOfDay(date);

      return ctx.db.dailyReflection.upsert({
        where: {
          userId_date: {
            userId: ctx.session.user.id,
            date: dateOnly,
          },
        },
        update: data,
        create: {
          ...data,
          date: dateOnly,
          userId: ctx.session.user.id,
        },
      });
    }),

  deleteDaily: protectedProcedure
    .input(z.object({ date: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const dateOnly = startOfDay(input.date);

      const existing = await ctx.db.dailyReflection.findFirst({
        where: {
          userId: ctx.session.user.id,
          date: dateOnly,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reflection not found" });
      }

      await ctx.db.dailyReflection.delete({ where: { id: existing.id } });

      return { success: true };
    }),

  // ============================================================================
  // MONTHLY REFLECTIONS
  // ============================================================================

  getMonthlyByMonth: protectedProcedure
    .input(z.object({ monthOf: z.date() }))
    .query(async ({ ctx, input }) => {
      const monthStart = startOfMonth(input.monthOf);

      return ctx.db.monthlyReflection.findFirst({
        where: {
          userId: ctx.session.user.id,
          monthOf: monthStart,
        },
      });
    }),

  getAllMonthly: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(12),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.monthlyReflection.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        orderBy: { monthOf: "desc" },
        take: input?.limit ?? 12,
      });
    }),

  createOrUpdateMonthly: protectedProcedure
    .input(
      z.object({
        monthOf: z.date(),
        highlights: z.array(z.string()).optional(),
        challenges: z.array(z.string()).optional(),
        lessonsLearned: z.array(z.string()).optional(),
        nextMonthGoals: z.array(z.string()).optional(),
        rating: z.number().min(1).max(5).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { monthOf, ...data } = input;
      const monthStart = startOfMonth(monthOf);

      return ctx.db.monthlyReflection.upsert({
        where: {
          userId_monthOf: {
            userId: ctx.session.user.id,
            monthOf: monthStart,
          },
        },
        update: data,
        create: {
          ...data,
          monthOf: monthStart,
          userId: ctx.session.user.id,
        },
      });
    }),

  deleteMonthly: protectedProcedure
    .input(z.object({ monthOf: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const monthStart = startOfMonth(input.monthOf);

      const existing = await ctx.db.monthlyReflection.findFirst({
        where: {
          userId: ctx.session.user.id,
          monthOf: monthStart,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reflection not found" });
      }

      await ctx.db.monthlyReflection.delete({ where: { id: existing.id } });

      return { success: true };
    }),

  // ============================================================================
  // STREAK TRACKING
  // ============================================================================

  getReflectionStreaks: protectedProcedure.query(async ({ ctx }) => {
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 30);

    const recentReflections = await ctx.db.dailyReflection.findMany({
      where: {
        userId: ctx.session.user.id,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    const reflectionDates = recentReflections.map((r) => startOfDay(new Date(r.date)));

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = today;

    while (reflectionDates.some((d) => d.getTime() === checkDate.getTime())) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }

    // Calculate completion rate for last 30 days
    const completionRate = Math.round((recentReflections.length / 30) * 100);

    // Get total reflections
    const totalCount = await ctx.db.dailyReflection.count({
      where: {
        userId: ctx.session.user.id,
      },
    });

    return {
      currentStreak,
      completionRate,
      totalReflections: totalCount,
      last30Days: recentReflections.length,
    };
  }),

  // ============================================================================
  // REFLECTION PROMPTS
  // ============================================================================

  getRandomPrompts: protectedProcedure
    .input(
      z.object({
        type: z.enum(["morning", "evening", "gratitude", "growth"]),
        count: z.number().min(1).max(5).default(1),
      })
    )
    .query(({ input }) => {
      const prompts = {
        morning: [
          "What is the one thing that, if accomplished today, would make you feel successful?",
          "What energy do you want to bring to your day?",
          "What are you looking forward to today?",
          "How can you show up as your best self today?",
          "What intention will guide your actions today?",
          "What would make today meaningful?",
          "What small win can you achieve today?",
        ],
        evening: [
          "What went well today?",
          "What did you learn about yourself today?",
          "What are you grateful for from today?",
          "What challenged you today, and how did you respond?",
          "What would you do differently if you could replay today?",
          "What moment today are you most proud of?",
          "How did you grow today?",
        ],
        gratitude: [
          "What made you smile today?",
          "Who supported you today?",
          "What opportunity are you grateful for?",
          "What challenge taught you something valuable?",
          "What simple pleasure did you enjoy today?",
        ],
        growth: [
          "What skill did you practice today?",
          "What feedback did you receive?",
          "What assumption did you challenge?",
          "What new perspective did you gain?",
          "What would your future self thank you for doing today?",
        ],
      };

      const categoryPrompts = prompts[input.type];
      const shuffled = [...categoryPrompts].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, input.count);
    }),
});
