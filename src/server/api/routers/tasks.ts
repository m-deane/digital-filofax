import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { parseRecurrenceRule, getNextDueDate } from "@/lib/recurrence";

export const tasksRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.array(z.enum(["TODO", "IN_PROGRESS", "DONE"])).optional(),
        priority: z.array(z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"])).optional(),
        categoryId: z.string().optional(),
        contextId: z.string().optional(),
        tagIds: z.array(z.string()).max(50).optional(),
        search: z.string().max(500).optional(),
        weekOf: z.date().optional(),
        monthOf: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const tasks = await ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.status && { status: { in: input.status } }),
          ...(input?.priority && { priority: { in: input.priority } }),
          ...(input?.categoryId && { categoryId: input.categoryId }),
          ...(input?.contextId && { contextId: input.contextId }),
          ...(input?.tagIds && {
            tags: { some: { id: { in: input.tagIds } } },
          }),
          ...(input?.search && {
            OR: [
              { title: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
            ],
          }),
          ...(input?.weekOf && { weekOf: input.weekOf }),
          ...(input?.monthOf && { monthOf: input.monthOf }),
        },
        include: {
          category: true,
          context: true,
          tags: true,
          subtasks: { orderBy: { order: "asc" } },
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        take: input?.limit ?? 50,
        ...(input?.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      return {
        tasks,
        nextCursor: tasks.length === (input?.limit ?? 50) ? tasks[tasks.length - 1]?.id : undefined,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          category: true,
          context: true,
          tags: true,
          subtasks: { orderBy: { order: "asc" } },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      return task;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(10000).optional(),
        status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
        dueDate: z.date().optional(),
        categoryId: z.string().optional(),
        contextId: z.string().optional(),
        tagIds: z.array(z.string()).max(50).optional(),
        weekOf: z.date().optional(),
        monthOf: z.date().optional(),
        recurrenceRule: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tagIds, ...taskData } = input;

      const maxOrder = await ctx.db.task.aggregate({
        where: { userId: ctx.session.user.id, status: input.status },
        _max: { order: true },
      });

      const task = await ctx.db.task.create({
        data: {
          ...taskData,
          userId: ctx.session.user.id,
          order: (maxOrder._max.order ?? 0) + 1,
          ...(tagIds && {
            tags: { connect: tagIds.map((id) => ({ id })) },
          }),
        },
        include: {
          category: true,
          tags: true,
          subtasks: true,
        },
      });

      return task;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(10000).optional(),
        status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        dueDate: z.date().nullable().optional(),
        categoryId: z.string().nullable().optional(),
        contextId: z.string().nullable().optional(),
        tagIds: z.array(z.string()).max(50).optional(),
        weekOf: z.date().nullable().optional(),
        monthOf: z.date().nullable().optional(),
        order: z.number().optional(),
        completedAt: z.date().nullable().optional(),
        recurrenceRule: z.string().max(500).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, tagIds, ...updateData } = input;

      const existing = await ctx.db.task.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      // Auto-set completedAt when status changes to DONE
      if (updateData.status === "DONE" && existing.status !== "DONE") {
        updateData.completedAt = new Date();
      } else if (updateData.status && updateData.status !== "DONE") {
        updateData.completedAt = null;
      }

      const task = await ctx.db.task.update({
        where: { id },
        data: {
          ...updateData,
          ...(tagIds && {
            tags: { set: tagIds.map((id) => ({ id })) },
          }),
        },
        include: {
          category: true,
          tags: true,
          subtasks: { orderBy: { order: "asc" } },
        },
      });

      // Spawn next occurrence when a recurring task is marked DONE
      const isMarkingDone = updateData.status === "DONE" && existing.status !== "DONE";
      if (isMarkingDone && existing.recurrenceRule) {
        const rule = parseRecurrenceRule(existing.recurrenceRule);
        const base = existing.dueDate ?? (updateData.dueDate instanceof Date ? updateData.dueDate : null);
        if (rule && base) {
          const nextDue = getNextDueDate(base, rule);
          const maxOrder = await ctx.db.task.aggregate({
            where: { userId: ctx.session.user.id, status: "TODO" },
            _max: { order: true },
          });
          await ctx.db.task.create({
            data: {
              title: existing.title,
              description: existing.description,
              priority: existing.priority,
              categoryId: existing.categoryId,
              contextId: existing.contextId,
              goalId: existing.goalId,
              recurrenceRule: existing.recurrenceRule,
              parentTaskId: existing.id,
              dueDate: nextDue,
              status: "TODO",
              userId: ctx.session.user.id,
              order: (maxOrder._max.order ?? 0) + 1,
            },
          });
        }
      }

      return task;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.task.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      await ctx.db.task.delete({ where: { id: input.id } });

      return { success: true };
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        tasks: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
            status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
          })
        ).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.tasks.map((task) =>
          ctx.db.task.updateMany({
            where: { id: task.id, userId: ctx.session.user.id },
            data: { order: task.order, ...(task.status && { status: task.status }) },
          })
        )
      );

      return { success: true };
    }),

  // Subtask operations
  addSubtask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        title: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      const maxOrder = await ctx.db.subtask.aggregate({
        where: { taskId: input.taskId },
        _max: { order: true },
      });

      const subtask = await ctx.db.subtask.create({
        data: {
          title: input.title,
          taskId: input.taskId,
          order: (maxOrder._max.order ?? 0) + 1,
        },
      });

      return subtask;
    }),

  updateSubtask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        completed: z.boolean().optional(),
        order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const subtask = await ctx.db.subtask.findFirst({
        where: { id },
        include: { task: true },
      });

      if (!subtask || subtask.task.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subtask not found" });
      }

      return ctx.db.subtask.update({
        where: { id },
        data: updateData,
      });
    }),

  deleteSubtask: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const subtask = await ctx.db.subtask.findFirst({
        where: { id: input.id },
        include: { task: true },
      });

      if (!subtask || subtask.task.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subtask not found" });
      }

      await ctx.db.subtask.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // Get tasks for specific time periods
  getWeeklyTasks: protectedProcedure
    .input(z.object({ weekOf: z.date() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          weekOf: input.weekOf,
        },
        include: {
          category: true,
          tags: true,
          subtasks: { orderBy: { order: "asc" } },
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });
    }),

  getMonthlyTasks: protectedProcedure
    .input(z.object({ monthOf: z.date() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          monthOf: input.monthOf,
        },
        include: {
          category: true,
          tags: true,
          subtasks: { orderBy: { order: "asc" } },
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });
    }),

  getDueSoon: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(7) }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const endDate = new Date(now.getTime() + input.days * 24 * 60 * 60 * 1000);

      return ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          status: { not: "DONE" },
          dueDate: {
            gte: now,
            lte: endDate,
          },
        },
        include: {
          category: true,
          tags: true,
        },
        orderBy: { dueDate: "asc" },
      });
    }),

  getUrgentCount: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // Get overdue tasks (critical)
    const overdueCount = await ctx.db.task.count({
      where: {
        userId: ctx.session.user.id,
        status: { not: "DONE" },
        dueDate: {
          lt: startOfToday,
        },
      },
    });

    // Get due today tasks (high)
    const dueTodayCount = await ctx.db.task.count({
      where: {
        userId: ctx.session.user.id,
        status: { not: "DONE" },
        dueDate: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
    });

    // Get urgent priority tasks (not already counted)
    const urgentPriorityCount = await ctx.db.task.count({
      where: {
        userId: ctx.session.user.id,
        status: { not: "DONE" },
        priority: "URGENT",
        OR: [
          { dueDate: null },
          { dueDate: { gte: endOfToday } },
        ],
      },
    });

    const total = overdueCount + dueTodayCount + urgentPriorityCount;

    return {
      overdue: overdueCount,
      dueToday: dueTodayCount,
      urgent: urgentPriorityCount,
      total,
    };
  }),

  getUrgent: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // Get overdue and urgent tasks with their details
    const urgentTasks = await ctx.db.task.findMany({
      where: {
        userId: ctx.session.user.id,
        status: { not: "DONE" },
        OR: [
          { dueDate: { lt: startOfToday } }, // Overdue
          { dueDate: { gte: startOfToday, lt: endOfToday } }, // Due today
          { priority: "URGENT" }, // Urgent priority
        ],
      },
      include: {
        category: true,
        tags: true,
      },
      orderBy: [
        { dueDate: "asc" },
        { priority: "desc" },
      ],
      take: 20,
    });

    // Add urgency level to each task
    const tasksWithUrgency = urgentTasks.map((task) => {
      let urgencyLevel: "critical" | "high" | "medium" | "low" = "low";
      if (task.dueDate && task.dueDate < startOfToday) {
        urgencyLevel = "critical";
      } else if (task.dueDate && task.dueDate < endOfToday) {
        urgencyLevel = "high";
      } else if (task.priority === "URGENT") {
        urgencyLevel = "high";
      } else if (task.priority === "HIGH") {
        urgencyLevel = "medium";
      }
      return { ...task, urgencyLevel };
    });

    return { urgent: tasksWithUrgency };
  }),

  // Bulk operations
  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.string()).min(1).max(200),
        status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns all tasks
      const tasks = await ctx.db.task.findMany({
        where: { id: { in: input.taskIds }, userId: ctx.session.user.id },
        select: { id: true, status: true },
      });

      if (tasks.length !== input.taskIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own tasks",
        });
      }

      // Auto-set completedAt for tasks being marked as DONE
      const now = new Date();
      await ctx.db.task.updateMany({
        where: {
          id: { in: input.taskIds },
          userId: ctx.session.user.id,
        },
        data: {
          status: input.status,
          completedAt: input.status === "DONE" ? now : null,
        },
      });

      return { success: true, count: tasks.length };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ taskIds: z.array(z.string()).min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns all tasks
      const tasks = await ctx.db.task.findMany({
        where: { id: { in: input.taskIds }, userId: ctx.session.user.id },
        select: { id: true },
      });

      if (tasks.length !== input.taskIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own tasks",
        });
      }

      await ctx.db.task.deleteMany({
        where: {
          id: { in: input.taskIds },
          userId: ctx.session.user.id,
        },
      });

      return { success: true, count: tasks.length };
    }),

  bulkAssignCategory: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.string()).min(1).max(200),
        categoryId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns all tasks
      const tasks = await ctx.db.task.findMany({
        where: { id: { in: input.taskIds }, userId: ctx.session.user.id },
        select: { id: true },
      });

      if (tasks.length !== input.taskIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own tasks",
        });
      }

      // If categoryId is provided, verify user owns the category
      if (input.categoryId) {
        const category = await ctx.db.category.findFirst({
          where: { id: input.categoryId, userId: ctx.session.user.id },
        });

        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }
      }

      await ctx.db.task.updateMany({
        where: {
          id: { in: input.taskIds },
          userId: ctx.session.user.id,
        },
        data: {
          categoryId: input.categoryId,
        },
      });

      return { success: true, count: tasks.length };
    }),

  bulkAssignPriority: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.string()).min(1).max(200),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns all tasks
      const tasks = await ctx.db.task.findMany({
        where: { id: { in: input.taskIds }, userId: ctx.session.user.id },
        select: { id: true },
      });

      if (tasks.length !== input.taskIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own tasks",
        });
      }

      await ctx.db.task.updateMany({
        where: {
          id: { in: input.taskIds },
          userId: ctx.session.user.id,
        },
        data: {
          priority: input.priority,
        },
      });

      return { success: true, count: tasks.length };
    }),

  // Drag-and-drop mutations for weekly planner
  moveToDate: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        scheduledStart: z.date(),
        scheduledEnd: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      return ctx.db.task.update({
        where: { id: input.taskId },
        data: {
          scheduledStart: input.scheduledStart,
          scheduledEnd: input.scheduledEnd,
        },
        include: {
          category: true,
          context: true,
          tags: true,
          subtasks: { orderBy: { order: "asc" } },
        },
      });
    }),

  updateSchedule: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        scheduledStart: z.date().nullable(),
        scheduledEnd: z.date().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      return ctx.db.task.update({
        where: { id: input.taskId },
        data: {
          scheduledStart: input.scheduledStart,
          scheduledEnd: input.scheduledEnd,
        },
        include: {
          category: true,
          context: true,
          tags: true,
          subtasks: { orderBy: { order: "asc" } },
        },
      });
    }),

  getScheduledTasks: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          scheduledStart: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        include: {
          category: true,
          context: true,
          tags: true,
          subtasks: { orderBy: { order: "asc" } },
        },
        orderBy: { scheduledStart: "asc" },
      });
    }),

  getYesterdaysUnfinished: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    return ctx.db.task.findMany({
      where: {
        userId: ctx.session.user.id,
        status: { not: "DONE" },
        dueDate: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        dueDate: true,
        category: { select: { name: true, color: true } },
      },
      orderBy: { priority: "desc" },
      take: 20,
    });
  }),
});
