import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval, subDays, isSameDay } from "date-fns";

export const habitsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        includeArchived: z.boolean().default(false),
        habitType: z.array(z.enum(["BOOLEAN", "NUMERIC", "DURATION"])).optional(),
        frequency: z.array(z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"])).optional(),
        categoryId: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.habit.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(!input?.includeArchived && { isArchived: false }),
          ...(input?.habitType && { habitType: { in: input.habitType } }),
          ...(input?.frequency && { frequency: { in: input.frequency } }),
          ...(input?.categoryId && { categoryId: input.categoryId }),
        },
        include: {
          category: true,
          logs: {
            where: {
              date: {
                gte: subDays(new Date(), 90), // Last 90 days for heatmap
              },
            },
            orderBy: { date: "desc" },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const habit = await ctx.db.habit.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          category: true,
          logs: {
            orderBy: { date: "desc" },
            take: 365, // Last year of logs
          },
        },
      });

      if (!habit) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Habit not found" });
      }

      return habit;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        habitType: z.enum(["BOOLEAN", "NUMERIC", "DURATION"]).default("BOOLEAN"),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]).default("DAILY"),
        targetValue: z.number().positive().optional(),
        unit: z.string().max(50).optional(),
        icon: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#10b981"),
        categoryId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.habit.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
        include: {
          category: true,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().nullable().optional(),
        habitType: z.enum(["BOOLEAN", "NUMERIC", "DURATION"]).optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]).optional(),
        targetValue: z.number().positive().nullable().optional(),
        unit: z.string().max(50).nullable().optional(),
        icon: z.string().nullable().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        categoryId: z.string().nullable().optional(),
        isArchived: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.habit.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Habit not found" });
      }

      return ctx.db.habit.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.habit.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Habit not found" });
      }

      await ctx.db.habit.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // Habit logging
  logCompletion: protectedProcedure
    .input(
      z.object({
        habitId: z.string(),
        date: z.date(),
        value: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const habit = await ctx.db.habit.findFirst({
        where: { id: input.habitId, userId: ctx.session.user.id },
      });

      if (!habit) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Habit not found" });
      }

      const dateOnly = startOfDay(input.date);

      return ctx.db.habitLog.upsert({
        where: {
          habitId_date: {
            habitId: input.habitId,
            date: dateOnly,
          },
        },
        update: {
          value: input.value,
          notes: input.notes,
        },
        create: {
          habitId: input.habitId,
          userId: ctx.session.user.id,
          date: dateOnly,
          value: input.value,
          notes: input.notes,
        },
      });
    }),

  removeLog: protectedProcedure
    .input(
      z.object({
        habitId: z.string(),
        date: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dateOnly = startOfDay(input.date);

      const log = await ctx.db.habitLog.findFirst({
        where: {
          habitId: input.habitId,
          date: dateOnly,
          userId: ctx.session.user.id,
        },
      });

      if (!log) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Log not found" });
      }

      await ctx.db.habitLog.delete({ where: { id: log.id } });

      return { success: true };
    }),

  // Get logs for date range
  getLogs: protectedProcedure
    .input(
      z.object({
        habitId: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.habitLog.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.habitId && { habitId: input.habitId }),
          date: {
            gte: startOfDay(input.startDate),
            lte: endOfDay(input.endDate),
          },
        },
        include: {
          habit: true,
        },
        orderBy: { date: "asc" },
      });
    }),

  // Get today's habits with completion status
  getTodayStatus: protectedProcedure.query(async ({ ctx }) => {
    const today = startOfDay(new Date());

    const habits = await ctx.db.habit.findMany({
      where: {
        userId: ctx.session.user.id,
        isArchived: false,
      },
      include: {
        category: true,
        logs: {
          where: { date: today },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return habits.map((habit) => ({
      ...habit,
      completedToday: habit.logs.length > 0,
      todayLog: habit.logs[0] ?? null,
    }));
  }),

  // Get streak information for a habit
  getStreakInfo: protectedProcedure
    .input(z.object({ habitId: z.string() }))
    .query(async ({ ctx, input }) => {
      const habit = await ctx.db.habit.findFirst({
        where: { id: input.habitId, userId: ctx.session.user.id },
        include: {
          logs: {
            orderBy: { date: "desc" },
            take: 365,
          },
        },
      });

      if (!habit) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Habit not found" });
      }

      const logDates = habit.logs.map((log) => log.date);
      const today = startOfDay(new Date());

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = today;

      // Check if completed today or yesterday to start streak
      const todayCompleted = logDates.some((d) => isSameDay(d, today));
      const yesterdayCompleted = logDates.some((d) => isSameDay(d, subDays(today, 1)));

      if (todayCompleted) {
        currentStreak = 1;
        checkDate = subDays(today, 1);
      } else if (yesterdayCompleted) {
        currentStreak = 1;
        checkDate = subDays(today, 2);
      }

      if (currentStreak > 0) {
        while (logDates.some((d) => isSameDay(d, checkDate))) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      const sortedDates = [...logDates].sort((a, b) => a.getTime() - b.getTime());

      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const diff = Math.round(
            (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diff === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

      // Calculate completion rate for last 30 days
      const thirtyDaysAgo = subDays(today, 30);
      const last30DaysLogs = logDates.filter((d) => d >= thirtyDaysAgo);
      const completionRate = Math.round((last30DaysLogs.length / 30) * 100);

      return {
        currentStreak,
        longestStreak,
        completionRate,
        totalCompletions: logDates.length,
        lastCompleted: logDates[0] ?? null,
      };
    }),
});
