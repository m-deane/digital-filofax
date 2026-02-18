import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  differenceInDays,
} from "date-fns";

const dateRangeSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  preset: z.enum(["today", "week", "month", "last30", "last90", "custom"]).optional(),
});

function getDateRange(preset?: string, startDate?: Date, endDate?: Date) {
  const now = new Date();

  if (preset === "today") {
    return { start: startOfDay(now), end: endOfDay(now) };
  } else if (preset === "week") {
    return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  } else if (preset === "month") {
    return { start: startOfMonth(now), end: endOfMonth(now) };
  } else if (preset === "last30") {
    return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
  } else if (preset === "last90") {
    return { start: startOfDay(subDays(now, 90)), end: endOfDay(now) };
  } else if (preset === "custom" && startDate && endDate) {
    return { start: startOfDay(startDate), end: endOfDay(endDate) };
  }

  // Default to last 30 days
  return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
}

export const analyticsRouter = createTRPCRouter({
  // Task completion statistics by day/week/month
  getTaskStats: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input.preset, input.startDate, input.endDate);

      // Get all tasks in date range
      const tasks = await ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          category: true,
        },
      });

      const completedTasks = tasks.filter((t) => t.status === "DONE");
      const overdueTasks = tasks.filter(
        (t) => t.status !== "DONE" && t.dueDate && t.dueDate < new Date()
      );

      // Group by day
      const days = eachDayOfInterval({ start, end });
      const tasksByDay = days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const completed = completedTasks.filter(
          (t) => t.completedAt && t.completedAt >= dayStart && t.completedAt <= dayEnd
        ).length;

        const created = tasks.filter(
          (t) => t.createdAt >= dayStart && t.createdAt <= dayEnd
        ).length;

        return {
          date: format(day, "yyyy-MM-dd"),
          completed,
          created,
        };
      });

      // Group by category
      const byCategory: Record<string, number> = {};
      completedTasks.forEach((task) => {
        const catName = task.category?.name ?? "Uncategorized";
        byCategory[catName] = (byCategory[catName] || 0) + 1;
      });

      // Group by priority
      const byPriority: Record<string, number> = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        URGENT: 0,
      };
      completedTasks.forEach((task) => {
        byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
      });

      const completionRate =
        tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

      return {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        completionRate: Math.round(completionRate * 10) / 10,
        tasksByDay,
        byCategory: Object.entries(byCategory).map(([name, count]) => ({
          name,
          count,
        })),
        byPriority: Object.entries(byPriority).map(([priority, count]) => ({
          priority,
          count,
        })),
      };
    }),

  // Habit completion rates and streaks
  getHabitStats: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input.preset, input.startDate, input.endDate);

      const habits = await ctx.db.habit.findMany({
        where: {
          userId: ctx.session.user.id,
          isArchived: false,
        },
        include: {
          logs: {
            where: {
              date: {
                gte: start,
                lte: end,
              },
            },
            orderBy: { date: "asc" },
          },
        },
      });

      const habitStats = habits.map((habit) => {
        const totalDays = differenceInDays(end, start) + 1;
        const completedDays = habit.logs.length;
        const completionRate = (completedDays / totalDays) * 100;

        // Calculate current streak
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        const days = eachDayOfInterval({ start, end });
        const logDates = new Set(habit.logs.map((log) => format(log.date, "yyyy-MM-dd")));

        for (let i = days.length - 1; i >= 0; i--) {
          const dayStr = format(days[i]!, "yyyy-MM-dd");
          if (logDates.has(dayStr)) {
            currentStreak++;
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            if (currentStreak === 0) {
              // Haven't started counting yet, continue
              continue;
            } else {
              // Streak broken
              break;
            }
          }
        }

        return {
          habitId: habit.id,
          habitName: habit.name,
          completedDays,
          totalDays,
          completionRate: Math.round(completionRate * 10) / 10,
          currentStreak,
          longestStreak,
        };
      });

      // Overall completion rate
      const totalPossibleLogs = habits.length * (differenceInDays(end, start) + 1);
      const totalLogs = habits.reduce((acc, h) => acc + h.logs.length, 0);
      const overallCompletionRate =
        totalPossibleLogs > 0 ? (totalLogs / totalPossibleLogs) * 100 : 0;

      // Daily completion data
      const days = eachDayOfInterval({ start, end });
      const completionByDay = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const completed = habits.filter((h) =>
          h.logs.some((log) => format(log.date, "yyyy-MM-dd") === dayStr)
        ).length;

        return {
          date: dayStr,
          completed,
          total: habits.length,
          rate: habits.length > 0 ? (completed / habits.length) * 100 : 0,
        };
      });

      return {
        habitStats,
        overallCompletionRate: Math.round(overallCompletionRate * 10) / 10,
        completionByDay,
        totalHabits: habits.length,
      };
    }),

  // Productivity score calculation
  getProductivityScore: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input.preset, input.startDate, input.endDate);

      // Get tasks
      const tasks = await ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          createdAt: { gte: start, lte: end },
        },
      });

      // Get habits
      const habitLogs = await ctx.db.habitLog.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: start, lte: end },
        },
      });

      // Get focus sessions
      const focusSessions = await ctx.db.focusSession.findMany({
        where: {
          userId: ctx.session.user.id,
          startTime: { gte: start, lte: end },
          endTime: { not: null },
          type: "WORK",
        },
      });

      const days = eachDayOfInterval({ start, end });
      const scoreByDay = days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        const dayStr = format(day, "yyyy-MM-dd");

        // Tasks completed (weight: 40%)
        const tasksCompleted = tasks.filter(
          (t) =>
            t.status === "DONE" &&
            t.completedAt &&
            t.completedAt >= dayStart &&
            t.completedAt <= dayEnd
        ).length;
        const taskScore = Math.min(tasksCompleted * 10, 40);

        // Habits completed (weight: 30%)
        const habitsCompleted = habitLogs.filter(
          (log) => format(log.date, "yyyy-MM-dd") === dayStr
        ).length;
        const habitScore = Math.min(habitsCompleted * 10, 30);

        // Focus time (weight: 30%)
        const focusMinutes = focusSessions
          .filter((s) => s.startTime >= dayStart && s.startTime <= dayEnd)
          .reduce((acc, s) => acc + s.duration, 0);
        const focusScore = Math.min((focusMinutes / 120) * 30, 30); // Max at 2 hours

        const totalScore = Math.round(taskScore + habitScore + focusScore);

        return {
          date: dayStr,
          score: totalScore,
          tasksCompleted,
          habitsCompleted,
          focusMinutes,
        };
      });

      const averageScore = scoreByDay.length > 0
        ? scoreByDay.reduce((acc, d) => acc + d.score, 0) / scoreByDay.length
        : 0;

      return {
        scoreByDay,
        averageScore: Math.round(averageScore * 10) / 10,
      };
    }),

  // Time distribution by category/context
  getTimeDistribution: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input.preset, input.startDate, input.endDate);

      // Get focus sessions with tasks
      const focusSessions = await ctx.db.focusSession.findMany({
        where: {
          userId: ctx.session.user.id,
          startTime: { gte: start, lte: end },
          endTime: { not: null },
          type: "WORK",
        },
        include: {
          task: {
            include: {
              category: true,
              context: true,
            },
          },
        },
      });

      // Group by category
      const byCategory: Record<string, number> = {};
      focusSessions.forEach((session) => {
        const catName = session.task?.category?.name ?? "Uncategorized";
        byCategory[catName] = (byCategory[catName] || 0) + session.duration;
      });

      // Group by context
      const byContext: Record<string, number> = {};
      focusSessions.forEach((session) => {
        const contextName = session.task?.context?.name ?? "No Context";
        byContext[contextName] = (byContext[contextName] || 0) + session.duration;
      });

      return {
        byCategory: Object.entries(byCategory).map(([name, minutes]) => ({
          name,
          minutes,
          hours: Math.round((minutes / 60) * 10) / 10,
        })),
        byContext: Object.entries(byContext).map(([name, minutes]) => ({
          name,
          minutes,
          hours: Math.round((minutes / 60) * 10) / 10,
        })),
        totalMinutes: focusSessions.reduce((acc, s) => acc + s.duration, 0),
      };
    }),

  // Focus session statistics
  getFocusStats: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input.preset, input.startDate, input.endDate);

      const sessions = await ctx.db.focusSession.findMany({
        where: {
          userId: ctx.session.user.id,
          startTime: { gte: start, lte: end },
          endTime: { not: null },
        },
        orderBy: { startTime: "asc" },
      });

      const workSessions = sessions.filter((s) => s.type === "WORK");
      const totalMinutes = workSessions.reduce((acc, s) => acc + s.duration, 0);

      // Group by day
      const days = eachDayOfInterval({ start, end });
      const sessionsByDay = days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const daySessions = workSessions.filter(
          (s) => s.startTime >= dayStart && s.startTime <= dayEnd
        );

        const minutes = daySessions.reduce((acc, s) => acc + s.duration, 0);

        return {
          date: format(day, "yyyy-MM-dd"),
          sessions: daySessions.length,
          minutes,
          hours: Math.round((minutes / 60) * 10) / 10,
        };
      });

      return {
        totalSessions: workSessions.length,
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        averageSessionLength: workSessions.length > 0
          ? Math.round(totalMinutes / workSessions.length)
          : 0,
        sessionsByDay,
      };
    }),

  // Weekly trends (week-over-week comparison)
  getWeeklyTrends: protectedProcedure
    .input(z.object({ weeks: z.number().min(1).max(12).default(4) }))
    .query(async ({ ctx, input }) => {
      const now = new Date();

      // Calculate the full date range spanning all requested weeks
      const oldestWeekStart = startOfWeek(subDays(now, (input.weeks - 1) * 7), { weekStartsOn: 1 });
      const newestWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

      // Fetch all data in 3 parallel queries instead of 3 * N sequential queries
      const [allTasks, allHabitLogs, allFocusSessions] = await Promise.all([
        ctx.db.task.findMany({
          where: {
            userId: ctx.session.user.id,
            completedAt: { gte: oldestWeekStart, lte: newestWeekEnd },
            status: "DONE",
          },
          select: { completedAt: true },
        }),
        ctx.db.habitLog.findMany({
          where: {
            userId: ctx.session.user.id,
            date: { gte: oldestWeekStart, lte: newestWeekEnd },
          },
          select: { date: true },
        }),
        ctx.db.focusSession.findMany({
          where: {
            userId: ctx.session.user.id,
            startTime: { gte: oldestWeekStart, lte: newestWeekEnd },
            endTime: { not: null },
            type: "WORK",
          },
          select: { startTime: true, duration: true },
        }),
      ]);

      // Bucket data into weeks client-side
      const weeks = [];
      for (let i = 0; i < input.weeks; i++) {
        const weekStart = startOfWeek(subDays(now, i * 7), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subDays(now, i * 7), { weekStartsOn: 1 });

        const tasksCompleted = allTasks.filter(
          (t) => t.completedAt && t.completedAt >= weekStart && t.completedAt <= weekEnd
        ).length;

        const habitsCompleted = allHabitLogs.filter(
          (l) => l.date >= weekStart && l.date <= weekEnd
        ).length;

        const focusMinutes = allFocusSessions
          .filter((s) => s.startTime >= weekStart && s.startTime <= weekEnd)
          .reduce((acc, s) => acc + s.duration, 0);

        weeks.push({
          weekStart: format(weekStart, "yyyy-MM-dd"),
          weekEnd: format(weekEnd, "yyyy-MM-dd"),
          tasksCompleted,
          habitsCompleted,
          focusHours: Math.round((focusMinutes / 60) * 10) / 10,
          focusMinutes,
        });
      }

      return {
        weeks: weeks.reverse(), // Oldest to newest
      };
    }),

  // Summary stats for overview cards
  getSummaryStats: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input.preset, input.startDate, input.endDate);

      // Tasks
      const tasks = await ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          completedAt: {
            gte: start,
            lte: end,
          },
          status: "DONE",
        },
      });

      // Habits
      const habitLogs = await ctx.db.habitLog.findMany({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: start,
            lte: end,
          },
        },
      });

      const habits = await ctx.db.habit.findMany({
        where: {
          userId: ctx.session.user.id,
          isArchived: false,
        },
      });

      const totalDays = differenceInDays(end, start) + 1;
      const habitCompletionRate =
        habits.length > 0 ? (habitLogs.length / (habits.length * totalDays)) * 100 : 0;

      // Calculate current habit streak (longest consecutive days with at least one habit)
      let currentStreak = 0;
      const days = eachDayOfInterval({ start, end });
      const logDates = new Set(habitLogs.map((log) => format(log.date, "yyyy-MM-dd")));

      for (let i = days.length - 1; i >= 0; i--) {
        const dayStr = format(days[i]!, "yyyy-MM-dd");
        if (logDates.has(dayStr)) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Focus time
      const focusSessions = await ctx.db.focusSession.findMany({
        where: {
          userId: ctx.session.user.id,
          startTime: {
            gte: start,
            lte: end,
          },
          endTime: { not: null },
          type: "WORK",
        },
      });

      const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + s.duration, 0);

      return {
        totalTasks: tasks.length,
        habitCompletionRate: Math.round(habitCompletionRate * 10) / 10,
        currentStreak,
        focusHours: Math.round((totalFocusMinutes / 60) * 10) / 10,
        focusMinutes: totalFocusMinutes,
      };
    }),
});
