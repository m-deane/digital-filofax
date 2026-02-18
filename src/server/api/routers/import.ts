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
