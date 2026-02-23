import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

const projectStatusSchema = z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]);
const projectTypeSchema = z.enum(["KANBAN", "CHECKLIST"]);

export const projectsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        status: projectStatusSchema.optional(),
        projectType: projectTypeSchema.optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.project.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.status && { status: input.status }),
          ...(input?.projectType && { projectType: input.projectType }),
        },
        include: {
          _count: { select: { tasks: true } },
          tasks: {
            select: { id: true, status: true },
          },
          goal: { select: { id: true, title: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          tasks: {
            include: {
              category: true,
              tags: true,
              subtasks: { orderBy: { order: "asc" } },
            },
            orderBy: [{ status: "asc" }, { order: "asc" }],
          },
          goal: { select: { id: true, title: true } },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      return project;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(5000).optional(),
        status: projectStatusSchema.default("ACTIVE"),
        projectType: projectTypeSchema.default("KANBAN"),
        color: z.string().max(7).optional(),
        icon: z.string().max(50).optional(),
        dueDate: z.date().optional(),
        goalId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { id: true, status: true } },
          goal: { select: { id: true, title: true } },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(5000).nullable().optional(),
        status: projectStatusSchema.optional(),
        color: z.string().max(7).nullable().optional(),
        icon: z.string().max(50).nullable().optional(),
        dueDate: z.date().nullable().optional(),
        goalId: z.string().nullable().optional(),
        projectType: projectTypeSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.db.project.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      return ctx.db.project.update({
        where: { id },
        data,
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { id: true, status: true } },
          goal: { select: { id: true, title: true } },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.project.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      await ctx.db.project.delete({ where: { id: input.id } });

      return { success: true };
    }),

  updateProgress: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { tasks: { select: { status: true } } },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const total = project.tasks.length;
      const done = project.tasks.filter((t) => t.status === "DONE").length;
      const progress = total === 0 ? 0 : Math.round((done / total) * 100);

      return ctx.db.project.update({
        where: { id: input.id },
        data: { progress },
      });
    }),
});
