import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  parseCSV,
  parseTodoistJSON,
  parseAppleReminders,
  parseInternalJSON,
  validateImportData,
  type ImportTaskData,
} from "@/lib/import";
import { parseMarkdownTodo } from "@/lib/import-markdown";
import type { ImportSource } from "@prisma/client";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const MAX_IMPORT_SIZE = 5_000_000; // 5MB max import file size

const ImportFromCSVInput = z.object({
  csvContent: z.string().min(1, "CSV content is required").max(MAX_IMPORT_SIZE, "File too large (max 5MB)"),
  filename: z.string().min(1, "Filename is required").max(255),
});

const ImportFromTodoistInput = z.object({
  jsonContent: z.string().min(1, "JSON content is required").max(MAX_IMPORT_SIZE, "File too large (max 5MB)"),
  filename: z.string().min(1, "Filename is required").max(255),
});

const ImportFromAppleRemindersInput = z.object({
  jsonContent: z.string().min(1, "JSON content is required").max(MAX_IMPORT_SIZE, "File too large (max 5MB)"),
  filename: z.string().min(1, "Filename is required").max(255),
});

const ImportFromJSONInput = z.object({
  jsonContent: z.string().min(1, "JSON content is required").max(MAX_IMPORT_SIZE, "File too large (max 5MB)"),
  filename: z.string().min(1, "Filename is required").max(255),
});

// ============================================================================
// ROUTER
// ============================================================================

export const importRouter = createTRPCRouter({
  // Import from CSV
  importFromCSV: protectedProcedure
    .input(ImportFromCSVInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Parse CSV
      const parseResult = parseCSV(input.csvContent);

      if (!parseResult.success || !parseResult.data) {
        // Log failed import
        await ctx.db.importLog.create({
          data: {
            source: "CSV",
            filename: input.filename,
            recordsImported: 0,
            errors: parseResult.errors,
            userId,
          },
        });

        return {
          success: false,
          recordsImported: 0,
          errors: parseResult.errors,
          warnings: parseResult.warnings,
        };
      }

      // Validate data
      const { valid, invalid } = validateImportData(parseResult.data);

      const allErrors = [...parseResult.errors];
      for (const { data, error } of invalid) {
        allErrors.push(`Invalid task "${data.title}": ${error}`);
      }

      // Import tasks
      const importedTasks = await importTasks(ctx, valid, userId);

      // Log import
      await ctx.db.importLog.create({
        data: {
          source: "CSV",
          filename: input.filename,
          recordsImported: importedTasks,
          errors: allErrors,
          userId,
        },
      });

      return {
        success: importedTasks > 0,
        recordsImported: importedTasks,
        errors: allErrors,
        warnings: parseResult.warnings,
      };
    }),

  // Import from Todoist
  importFromTodoist: protectedProcedure
    .input(ImportFromTodoistInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Parse Todoist JSON
      const parseResult = parseTodoistJSON(input.jsonContent);

      if (!parseResult.success || !parseResult.data) {
        await ctx.db.importLog.create({
          data: {
            source: "TODOIST",
            filename: input.filename,
            recordsImported: 0,
            errors: parseResult.errors,
            userId,
          },
        });

        return {
          success: false,
          recordsImported: 0,
          errors: parseResult.errors,
          warnings: parseResult.warnings,
        };
      }

      // Validate data
      const { valid, invalid } = validateImportData(parseResult.data);

      const allErrors = [...parseResult.errors];
      for (const { data, error } of invalid) {
        allErrors.push(`Invalid task "${data.title}": ${error}`);
      }

      // Import tasks
      const importedTasks = await importTasks(ctx, valid, userId);

      // Log import
      await ctx.db.importLog.create({
        data: {
          source: "TODOIST",
          filename: input.filename,
          recordsImported: importedTasks,
          errors: allErrors,
          userId,
        },
      });

      return {
        success: importedTasks > 0,
        recordsImported: importedTasks,
        errors: allErrors,
        warnings: parseResult.warnings,
      };
    }),

  // Import from Apple Reminders
  importFromAppleReminders: protectedProcedure
    .input(ImportFromAppleRemindersInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Parse Apple Reminders JSON
      const parseResult = parseAppleReminders(input.jsonContent);

      if (!parseResult.success || !parseResult.data) {
        await ctx.db.importLog.create({
          data: {
            source: "APPLE_REMINDERS",
            filename: input.filename,
            recordsImported: 0,
            errors: parseResult.errors,
            userId,
          },
        });

        return {
          success: false,
          recordsImported: 0,
          errors: parseResult.errors,
          warnings: parseResult.warnings,
        };
      }

      // Validate data
      const { valid, invalid } = validateImportData(parseResult.data);

      const allErrors = [...parseResult.errors];
      for (const { data, error } of invalid) {
        allErrors.push(`Invalid task "${data.title}": ${error}`);
      }

      // Import tasks
      const importedTasks = await importTasks(ctx, valid, userId);

      // Log import
      await ctx.db.importLog.create({
        data: {
          source: "APPLE_REMINDERS",
          filename: input.filename,
          recordsImported: importedTasks,
          errors: allErrors,
          userId,
        },
      });

      return {
        success: importedTasks > 0,
        recordsImported: importedTasks,
        errors: allErrors,
        warnings: parseResult.warnings,
      };
    }),

  // Import from JSON (internal format)
  importFromJSON: protectedProcedure
    .input(ImportFromJSONInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Parse internal JSON
      const parseResult = parseInternalJSON(input.jsonContent);

      if (!parseResult.success || !parseResult.data) {
        await ctx.db.importLog.create({
          data: {
            source: "JSON",
            filename: input.filename,
            recordsImported: 0,
            errors: parseResult.errors,
            userId,
          },
        });

        return {
          success: false,
          recordsImported: 0,
          errors: parseResult.errors,
          warnings: parseResult.warnings,
        };
      }

      // Validate data
      const { valid, invalid } = validateImportData(parseResult.data);

      const allErrors = [...parseResult.errors];
      for (const { data, error } of invalid) {
        allErrors.push(`Invalid task "${data.title}": ${error}`);
      }

      // Import tasks
      const importedTasks = await importTasks(ctx, valid, userId);

      // Log import
      await ctx.db.importLog.create({
        data: {
          source: "JSON",
          filename: input.filename,
          recordsImported: importedTasks,
          errors: allErrors,
          userId,
        },
      });

      return {
        success: importedTasks > 0,
        recordsImported: importedTasks,
        errors: allErrors,
        warnings: parseResult.warnings,
      };
    }),

  // Import from Markdown TODO file
  fromMarkdown: protectedProcedure
    .input(
      z.object({
        markdownContent: z.string().min(1, "Content is required").max(5_000_000, "File too large (max 5MB)"),
        filename: z.string().min(1).max(255),
        projectId: z.string().optional(), // if provided, add tasks to existing project
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const parseResult = parseMarkdownTodo(input.markdownContent, input.filename);

      if (!parseResult.success || !parseResult.data) {
        await ctx.db.importLog.create({
          data: {
            source: "MARKDOWN",
            filename: input.filename,
            recordsImported: 0,
            errors: parseResult.errors,
            userId,
          },
        });
        return { success: false, recordsImported: 0, projectId: null, errors: parseResult.errors, warnings: parseResult.warnings };
      }

      const { name, tasks } = parseResult.data;
      const allWarnings = [...parseResult.warnings];

      // Resolve or create the project
      let project;
      if (input.projectId) {
        project = await ctx.db.project.findFirst({ where: { id: input.projectId, userId } });
        if (!project) {
          const err = ["Project not found"];
          return { success: false, recordsImported: 0, projectId: null, errors: err, warnings: allWarnings };
        }
      } else {
        // Try to find existing project by sourceFile
        project = await ctx.db.project.findFirst({
          where: { userId, sourceFile: input.filename },
        });
        if (!project) {
          project = await ctx.db.project.create({
            data: {
              name: name.slice(0, 200),
              projectType: "CHECKLIST",
              status: "ACTIVE",
              sourceFile: input.filename,
              userId,
            },
          });
        }
      }

      // Get existing tasks in project for dedup by title
      const existingTasks = await ctx.db.task.findMany({
        where: { projectId: project.id, userId },
        select: { id: true, title: true },
      });
      const existingByTitle = new Map(existingTasks.map((t) => [t.title.toLowerCase(), t.id]));

      let imported = 0;

      for (const task of tasks) {
        const titleKey = task.title.toLowerCase();
        const status = task.completed ? "DONE" : "TODO";

        if (existingByTitle.has(titleKey)) {
          // Update status on re-import
          await ctx.db.task.update({
            where: { id: existingByTitle.get(titleKey)! },
            data: { status },
          });
        } else {
          const created = await ctx.db.task.create({
            data: {
              title: task.title,
              status,
              priority: "MEDIUM",
              projectId: project.id,
              userId,
            },
          });
          imported++;

          // Create subtasks
          for (let si = 0; si < task.subtasks.length; si++) {
            const sub = task.subtasks[si]!;
            await ctx.db.subtask.create({
              data: {
                title: sub.title,
                completed: sub.completed,
                order: si,
                taskId: created.id,
              },
            });
          }
        }
      }

      // Update project progress
      const allTasks = await ctx.db.task.findMany({
        where: { projectId: project.id, userId },
        select: { status: true },
      });
      const doneCount = allTasks.filter((t) => t.status === "DONE").length;
      const progress = allTasks.length === 0 ? 0 : Math.round((doneCount / allTasks.length) * 100);
      await ctx.db.project.update({ where: { id: project.id }, data: { progress } });

      await ctx.db.importLog.create({
        data: {
          source: "MARKDOWN",
          filename: input.filename,
          recordsImported: imported,
          errors: [],
          userId,
        },
      });

      return {
        success: true,
        recordsImported: imported,
        projectId: project.id,
        errors: [] as string[],
        warnings: allWarnings,
      };
    }),

  // Get import history
  getImportHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    return ctx.db.importLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  // Get import statistics
  getImportStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const logs = await ctx.db.importLog.findMany({
      where: { userId },
      select: {
        source: true,
        recordsImported: true,
        createdAt: true,
      },
    });

    const totalImports = logs.length;
    const totalRecords = logs.reduce((sum, log) => sum + log.recordsImported, 0);

    const bySource: Record<ImportSource, number> = {
      CSV: 0,
      TODOIST: 0,
      APPLE_REMINDERS: 0,
      JSON: 0,
      MARKDOWN: 0,
    };

    for (const log of logs) {
      bySource[log.source] += log.recordsImported;
    }

    return {
      totalImports,
      totalRecords,
      bySource,
      recentImports: logs.slice(0, 5).map((log) => ({
        source: log.source,
        recordsImported: log.recordsImported,
        createdAt: log.createdAt,
      })),
    };
  }),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function importTasks(
  ctx: { db: typeof import("@/server/db").db },
  tasks: ImportTaskData[],
  userId: string
): Promise<number> {
  let imported = 0;

  // Get or create categories and tags
  const categoryMap = new Map<string, string>();
  const tagMap = new Map<string, string>();

  for (const task of tasks) {
    try {
      // Handle category
      let categoryId: string | undefined;
      if (task.category) {
        if (!categoryMap.has(task.category)) {
          // Try to find existing category
          const existing = await ctx.db.category.findFirst({
            where: {
              userId,
              name: task.category,
            },
          });

          if (existing) {
            categoryMap.set(task.category, existing.id);
            categoryId = existing.id;
          } else {
            // Create new category
            const newCategory = await ctx.db.category.create({
              data: {
                name: task.category,
                userId,
              },
            });
            categoryMap.set(task.category, newCategory.id);
            categoryId = newCategory.id;
          }
        } else {
          categoryId = categoryMap.get(task.category);
        }
      }

      // Handle tags
      const tagIds: string[] = [];
      if (task.tags) {
        for (const tagName of task.tags) {
          if (!tagMap.has(tagName)) {
            // Try to find existing tag
            const existing = await ctx.db.tag.findFirst({
              where: {
                userId,
                name: tagName,
              },
            });

            if (existing) {
              tagMap.set(tagName, existing.id);
              tagIds.push(existing.id);
            } else {
              // Create new tag
              const newTag = await ctx.db.tag.create({
                data: {
                  name: tagName,
                  userId,
                },
              });
              tagMap.set(tagName, newTag.id);
              tagIds.push(newTag.id);
            }
          } else {
            const tagId = tagMap.get(tagName);
            if (tagId) tagIds.push(tagId);
          }
        }
      }

      // Create task
      await ctx.db.task.create({
        data: {
          title: task.title,
          description: task.description,
          status: task.status ?? "TODO",
          priority: task.priority ?? "MEDIUM",
          dueDate: task.dueDate,
          categoryId,
          contextId: task.contextId,
          userId,
          tags: {
            connect: tagIds.map((id) => ({ id })),
          },
        },
      });

      imported++;
    } catch {
      continue;
    }
  }

  return imported;
}
