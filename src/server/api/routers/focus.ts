import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

const focusSessionTypeSchema = z.enum(["WORK", "SHORT_BREAK", "LONG_BREAK"]);

export const focusRouter = createTRPCRouter({
  // Start a new focus session
  startSession: protectedProcedure
    .input(
      z.object({
        type: focusSessionTypeSchema,
        duration: z.number().min(1).max(120),
        taskId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.focusSession.create({
        data: {
          startTime: new Date(),
          duration: input.duration,
          type: input.type,
          taskId: input.taskId,
          userId: ctx.session.user.id,
        },
        include: {
          task: {
            select: { id: true, title: true },
          },
        },
      });
    }),

  // Complete a focus session
  completeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.focusSession.update({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
        data: {
          endTime: new Date(),
        },
      });
    }),

  // Cancel/delete a session (if user quits early)
  cancelSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.focusSession.delete({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Get today's focus stats
  getTodayStats: protectedProcedure.query(async ({ ctx }) => {
    const dayStart = startOfDay(new Date());
    const dayEnd = endOfDay(new Date());

    const sessions = await ctx.db.focusSession.findMany({
      where: {
        userId: ctx.session.user.id,
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
        endTime: { not: null }, // Only completed sessions
      },
    });

    const workSessions = sessions.filter((s) => s.type === "WORK");
    const totalWorkMinutes = workSessions.reduce((acc, s) => acc + s.duration, 0);
    const totalSessions = workSessions.length;

    return {
      totalWorkMinutes,
      totalSessions,
      sessions,
    };
  }),

  // Get weekly focus stats
  getWeeklyStats: protectedProcedure.query(async ({ ctx }) => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const sessions = await ctx.db.focusSession.findMany({
      where: {
        userId: ctx.session.user.id,
        startTime: {
          gte: weekStart,
          lte: weekEnd,
        },
        endTime: { not: null },
        type: "WORK",
      },
      orderBy: { startTime: "asc" },
    });

    const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);

    // Group by day
    const byDay: Record<string, number> = {};
    sessions.forEach((s) => {
      const day = s.startTime.toISOString().split("T")[0];
      byDay[day] = (byDay[day] || 0) + s.duration;
    });

    return {
      totalMinutes,
      totalSessions: sessions.length,
      byDay,
    };
  }),

  // Get recent sessions
  getRecentSessions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.focusSession.findMany({
        where: {
          userId: ctx.session.user.id,
          endTime: { not: null },
        },
        include: {
          task: {
            select: { id: true, title: true },
          },
        },
        orderBy: { startTime: "desc" },
        take: input.limit,
      });
    }),

  // Get user's pomodoro settings
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await ctx.db.userPreferences.findUnique({
      where: { userId: ctx.session.user.id },
    });

    return {
      workMinutes: prefs?.pomodoroWorkMinutes ?? 25,
      shortBreakMinutes: prefs?.pomodoroShortBreakMinutes ?? 5,
      longBreakMinutes: prefs?.pomodoroLongBreakMinutes ?? 15,
      sessionsUntilLong: prefs?.pomodoroSessionsUntilLong ?? 4,
    };
  }),
});
