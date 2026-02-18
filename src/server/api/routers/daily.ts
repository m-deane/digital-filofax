import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { startOfDay, endOfDay, format } from "date-fns";

export const dailyRouter = createTRPCRouter({
  // Get combined daily view data
  getDailyView: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ ctx, input }) => {
      const dayStart = startOfDay(input.date);
      const dayEnd = endOfDay(input.date);
      const dateOnly = format(input.date, "yyyy-MM-dd");

      // Fetch tasks for this day (scheduled or due)
      const tasks = await ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          OR: [
            // Tasks scheduled for this day
            {
              scheduledStart: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
            // Tasks due this day
            {
              dueDate: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
            // Daily priority tasks (unmarked scheduled but flagged)
            {
              isDailyPriority: true,
              status: { not: "DONE" },
            },
          ],
        },
        include: {
          category: true,
          tags: true,
          subtasks: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: [
          { isDailyPriority: "desc" },
          { scheduledStart: "asc" },
          { priority: "desc" },
        ],
      });

      // Fetch calendar events for this day
      const events = await ctx.db.calendarEvent.findMany({
        where: {
          userId: ctx.session.user.id,
          startDate: {
            lte: dayEnd,
          },
          endDate: {
            gte: dayStart,
          },
        },
        orderBy: { startDate: "asc" },
      });

      // Fetch habits (all active)
      const habits = await ctx.db.habit.findMany({
        where: {
          userId: ctx.session.user.id,
          isArchived: false,
        },
        include: {
          logs: {
            where: {
              date: new Date(dateOnly),
            },
          },
        },
        orderBy: { name: "asc" },
      });

      // Fetch recent memos for quick reference
      const recentMemos = await ctx.db.memo.findMany({
        where: {
          userId: ctx.session.user.id,
          isArchived: false,
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      });

      // Separate scheduled vs unscheduled tasks
      const scheduledTasks = tasks.filter((t) => t.scheduledStart !== null);
      const unscheduledTasks = tasks.filter((t) => t.scheduledStart === null);
      const priorityTasks = tasks.filter((t) => t.isDailyPriority);

      return {
        date: input.date,
        scheduledTasks,
        unscheduledTasks,
        priorityTasks,
        events,
        habits: habits.map((h) => ({
          ...h,
          completedToday: h.logs.length > 0,
        })),
        recentMemos,
      };
    }),

  // Set daily priorities (top 3 tasks)
  setDailyPriorities: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.string()).max(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First, clear all existing daily priorities for this user
      await ctx.db.task.updateMany({
        where: {
          userId: ctx.session.user.id,
          isDailyPriority: true,
        },
        data: {
          isDailyPriority: false,
        },
      });

      // Set new priorities
      if (input.taskIds.length > 0) {
        await ctx.db.task.updateMany({
          where: {
            id: { in: input.taskIds },
            userId: ctx.session.user.id,
          },
          data: {
            isDailyPriority: true,
          },
        });
      }

      return { success: true };
    }),

  // Schedule a task to a time slot
  scheduleTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        scheduledStart: z.date(),
        scheduledEnd: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.task.update({
        where: {
          id: input.taskId,
          userId: ctx.session.user.id,
        },
        data: {
          scheduledStart: input.scheduledStart,
          scheduledEnd: input.scheduledEnd,
        },
        include: {
          category: true,
          tags: true,
        },
      });
    }),

  // Unschedule a task (remove from time slot)
  unscheduleTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.task.update({
        where: {
          id: input.taskId,
          userId: ctx.session.user.id,
        },
        data: {
          scheduledStart: null,
          scheduledEnd: null,
        },
      });
    }),

  // Toggle daily priority for a task
  toggleDailyPriority: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: {
          id: input.taskId,
          userId: ctx.session.user.id,
        },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      // Count current priorities
      const priorityCount = await ctx.db.task.count({
        where: {
          userId: ctx.session.user.id,
          isDailyPriority: true,
        },
      });

      // If already a priority, remove it
      if (task.isDailyPriority) {
        return ctx.db.task.update({
          where: { id: input.taskId },
          data: { isDailyPriority: false },
        });
      }

      // If not a priority and we have less than 3, add it
      if (priorityCount < 3) {
        return ctx.db.task.update({
          where: { id: input.taskId },
          data: { isDailyPriority: true },
        });
      }

      throw new Error("Maximum 3 daily priorities allowed");
    }),
});
