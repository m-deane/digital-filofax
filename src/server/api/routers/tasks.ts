import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const tasksRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.array(z.enum(["TODO", "IN_PROGRESS", "DONE"])).optional(),
        priority: z.array(z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"])).optional(),
        categoryId: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
        search: z.string().optional(),
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
        description: z.string().optional(),
        status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
        dueDate: z.date().optional(),
        categoryId: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
        weekOf: z.date().optional(),
        monthOf: z.date().optional(),
        recurrenceRule: z.string().optional(),
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
        description: z.string().optional(),
        status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        dueDate: z.date().nullable().optional(),
        categoryId: z.string().nullable().optional(),
        tagIds: z.array(z.string()).optional(),
        weekOf: z.date().nullable().optional(),
        monthOf: z.date().nullable().optional(),
        order: z.number().optional(),
        completedAt: z.date().nullable().optional(),
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
        ),
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
    .input(z.object({ days: z.number().default(7) }))
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
});
