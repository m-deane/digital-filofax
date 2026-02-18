import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { TemplateType, Prisma } from "@prisma/client";

const templateTypeEnum = z.nativeEnum(TemplateType);

export const templatesRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        type: templateTypeEnum.optional(),
        search: z.string().max(500).optional(),
        includePublic: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where = {
        AND: [
          {
            OR: [
              { userId: ctx.session.user.id },
              ...(input?.includePublic ? [{ isPublic: true }] : []),
            ],
          },
          ...(input?.type ? [{ type: input.type }] : []),
          ...(input?.search
            ? [
                {
                  OR: [
                    { name: { contains: input.search, mode: "insensitive" as const } },
                    { description: { contains: input.search, mode: "insensitive" as const } },
                  ],
                },
              ]
            : []),
        ],
      };

      return ctx.db.template.findMany({
        where,
        orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.template.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.session.user.id },
            { isPublic: true },
          ],
        },
      });

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      return template;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        type: templateTypeEnum,
        content: z.unknown().default({}), // JSON content structure
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.template.create({
        data: {
          name: input.name,
          description: input.description,
          type: input.type,
          content: input.content as Prisma.InputJsonValue,
          isPublic: input.isPublic,
          userId: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().nullable().optional(),
        type: templateTypeEnum.optional(),
        content: z.any().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.template.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      return ctx.db.template.update({
        where: { id },
        data: updateData,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.template.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      await ctx.db.template.delete({ where: { id: input.id } });

      return { success: true };
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().max(200).optional() }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.db.template.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.session.user.id },
            { isPublic: true },
          ],
        },
      });

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      return ctx.db.template.create({
        data: {
          name: input.name || `${template.name} (Copy)`,
          description: template.description,
          type: template.type,
          content: template.content as Prisma.InputJsonValue,
          isPublic: false,
          userId: ctx.session.user.id,
        },
      });
    }),

  applyTemplate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        weekOf: z.date().optional(),
        monthOf: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.db.template.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.session.user.id },
            { isPublic: true },
          ],
        },
      });

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      // Increment usage count
      await ctx.db.template.update({
        where: { id: template.id },
        data: { usageCount: { increment: 1 } },
      });

      // Parse content and create items based on template type
      const content = template.content as Record<string, unknown>;
      const createdItems: Record<string, string[]> = {};

      switch (template.type) {
        case "TASK_LIST":
        case "CHECKLIST": {
          const tasks = (content.tasks as Array<{ title: string; priority?: string; description?: string }>) || [];
          const createdTaskIds: string[] = [];

          for (let i = 0; i < tasks.length; i++) {
            const taskData = tasks[i];
            if (!taskData) continue;

            const task = await ctx.db.task.create({
              data: {
                title: taskData.title,
                description: taskData.description || null,
                priority: (taskData.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") || "MEDIUM",
                status: "TODO",
                userId: ctx.session.user.id,
                weekOf: input.weekOf,
                monthOf: input.monthOf,
                order: i,
              },
            });
            createdTaskIds.push(task.id);
          }

          createdItems.tasks = createdTaskIds;
          break;
        }

        case "PROJECT": {
          const projectData = content as { title: string; description?: string; milestones?: Array<{ title: string; tasks?: Array<{ title: string; priority?: string }> }> };
          const createdTaskIds: string[] = [];

          if (projectData.milestones) {
            for (const milestone of projectData.milestones) {
              if (milestone.tasks) {
                for (let i = 0; i < milestone.tasks.length; i++) {
                  const taskData = milestone.tasks[i];
                  if (!taskData) continue;

                  const task = await ctx.db.task.create({
                    data: {
                      title: `[${milestone.title}] ${taskData.title}`,
                      priority: (taskData.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") || "MEDIUM",
                      status: "TODO",
                      userId: ctx.session.user.id,
                      weekOf: input.weekOf,
                      monthOf: input.monthOf,
                      order: i,
                    },
                  });
                  createdTaskIds.push(task.id);
                }
              }
            }
          }

          createdItems.tasks = createdTaskIds;
          break;
        }

        case "DAILY_ROUTINE":
        case "WEEKLY_PLAN": {
          const routineData = content as { tasks: Array<{ title: string; priority?: string; description?: string }> };
          const tasks = routineData.tasks || [];
          const createdTaskIds: string[] = [];

          for (let i = 0; i < tasks.length; i++) {
            const taskData = tasks[i];
            if (!taskData) continue;

            const task = await ctx.db.task.create({
              data: {
                title: taskData.title,
                description: taskData.description || null,
                priority: (taskData.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") || "MEDIUM",
                status: "TODO",
                userId: ctx.session.user.id,
                weekOf: input.weekOf,
                monthOf: input.monthOf,
                order: i,
              },
            });
            createdTaskIds.push(task.id);
          }

          createdItems.tasks = createdTaskIds;
          break;
        }

        case "MEETING_NOTES": {
          const meetingData = content as { title: string; sections: Array<{ heading: string; content: string }> };
          let memoContent = `# ${meetingData.title}\n\n`;

          if (meetingData.sections) {
            for (const section of meetingData.sections) {
              memoContent += `## ${section.heading}\n${section.content}\n\n`;
            }
          }

          const memo = await ctx.db.memo.create({
            data: {
              title: meetingData.title,
              content: memoContent,
              memoType: "MEETING",
              userId: ctx.session.user.id,
            },
          });

          createdItems.memos = [memo.id];
          break;
        }
      }

      return {
        success: true,
        created: createdItems,
      };
    }),

  getPublicTemplates: protectedProcedure
    .input(
      z.object({
        type: templateTypeEnum.optional(),
        limit: z.number().min(1).max(50).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.template.findMany({
        where: {
          isPublic: true,
          ...(input?.type && { type: input.type }),
        },
        orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
        take: input?.limit ?? 20,
      });
    }),
});
