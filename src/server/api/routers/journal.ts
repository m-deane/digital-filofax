import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { startOfDay, subDays, format } from "date-fns";

const MoodLevelEnum = z.enum(["GREAT", "GOOD", "OKAY", "LOW", "BAD"]);

export const journalRouter = createTRPCRouter({
  // =============================================================================
  // GRATITUDE OPERATIONS
  // =============================================================================

  getTodayGratitude: protectedProcedure.query(async ({ ctx }) => {
    const today = startOfDay(new Date());

    return ctx.db.gratitudeEntry.findUnique({
      where: {
        userId_date: {
          userId: ctx.session.user.id,
          date: today,
        },
      },
    });
  }),

  getGratitudeByDate: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ ctx, input }) => {
      const targetDate = startOfDay(input.date);

      return ctx.db.gratitudeEntry.findUnique({
        where: {
          userId_date: {
            userId: ctx.session.user.id,
            date: targetDate,
          },
        },
      });
    }),

  getGratitudeRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.gratitudeEntry.findMany({
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

  createOrUpdateGratitude: protectedProcedure
    .input(
      z.object({
        date: z.date().optional(),
        entries: z.array(z.string().min(1).max(500)).length(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetDate = startOfDay(input.date ?? new Date());

      return ctx.db.gratitudeEntry.upsert({
        where: {
          userId_date: {
            userId: ctx.session.user.id,
            date: targetDate,
          },
        },
        create: {
          userId: ctx.session.user.id,
          date: targetDate,
          entries: input.entries,
        },
        update: {
          entries: input.entries,
        },
      });
    }),

  // =============================================================================
  // MOOD OPERATIONS
  // =============================================================================

  getTodayMood: protectedProcedure.query(async ({ ctx }) => {
    const today = startOfDay(new Date());

    return ctx.db.moodEntry.findUnique({
      where: {
        userId_date: {
          userId: ctx.session.user.id,
          date: today,
        },
      },
    });
  }),

  getMoodByDate: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ ctx, input }) => {
      const targetDate = startOfDay(input.date);

      return ctx.db.moodEntry.findUnique({
        where: {
          userId_date: {
            userId: ctx.session.user.id,
            date: targetDate,
          },
        },
      });
    }),

  getMoodRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.moodEntry.findMany({
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

  createOrUpdateMood: protectedProcedure
    .input(
      z.object({
        date: z.date().optional(),
        mood: MoodLevelEnum,
        energyLevel: z.number().min(1).max(5),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetDate = startOfDay(input.date ?? new Date());

      return ctx.db.moodEntry.upsert({
        where: {
          userId_date: {
            userId: ctx.session.user.id,
            date: targetDate,
          },
        },
        create: {
          userId: ctx.session.user.id,
          date: targetDate,
          mood: input.mood,
          energyLevel: input.energyLevel,
          notes: input.notes,
        },
        update: {
          mood: input.mood,
          energyLevel: input.energyLevel,
          notes: input.notes,
        },
      });
    }),

  // =============================================================================
  // COMBINED & STATS
  // =============================================================================

  getTodayJournal: protectedProcedure.query(async ({ ctx }) => {
    const today = startOfDay(new Date());

    const [gratitude, mood] = await Promise.all([
      ctx.db.gratitudeEntry.findUnique({
        where: {
          userId_date: {
            userId: ctx.session.user.id,
            date: today,
          },
        },
      }),
      ctx.db.moodEntry.findUnique({
        where: {
          userId_date: {
            userId: ctx.session.user.id,
            date: today,
          },
        },
      }),
    ]);

    return { gratitude, mood, date: today };
  }),

  getStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const endDate = startOfDay(new Date());
      const startDate = startOfDay(subDays(endDate, input.days));

      const moodEntries = await ctx.db.moodEntry.findMany({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "asc" },
      });

      const gratitudeEntries = await ctx.db.gratitudeEntry.findMany({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "asc" },
      });

      // Calculate mood stats
      const moodCounts = {
        GREAT: 0,
        GOOD: 0,
        OKAY: 0,
        LOW: 0,
        BAD: 0,
      };

      let totalEnergy = 0;
      moodEntries.forEach((entry) => {
        moodCounts[entry.mood]++;
        totalEnergy += entry.energyLevel;
      });

      const avgEnergy =
        moodEntries.length > 0 ? totalEnergy / moodEntries.length : 0;

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = endDate;
      const gratitudeDates = new Set(
        gratitudeEntries.map((e) => format(e.date, "yyyy-MM-dd"))
      );

      while (gratitudeDates.has(format(checkDate, "yyyy-MM-dd"))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }

      return {
        gratitudeCount: gratitudeEntries.length,
        gratitudeStreak: currentStreak,
        moodCount: moodEntries.length,
        moodDistribution: moodCounts,
        averageEnergy: Math.round(avgEnergy * 10) / 10,
      };
    }),
});
