import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { AISuggestionService } from "@/lib/ai-suggestions";
import { generateAISuggestions } from "@/lib/ai-client";
import type { PlannerContext } from "@/lib/ai-client";
import type { PrismaClient } from "@prisma/client";

export const suggestionsRouter = createTRPCRouter({
  /**
   * Get all active suggestions for the current user
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          includeAccepted: z.boolean().default(false),
          includeDismissed: z.boolean().default(false),
          type: z
            .enum([
              "TASK_SUGGESTION",
              "PRIORITY_CHANGE",
              "DUE_DATE",
              "CONTEXT",
              "BREAKDOWN",
              "RECURRING",
              "RESCHEDULE",
              "CATEGORY_BALANCE",
            ])
            .optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const suggestions = await ctx.db.aISuggestion.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.type && { type: input.type }),
          ...(!input?.includeAccepted && { accepted: false }),
          ...(!input?.includeDismissed && { dismissed: false }),
        },
        include: {
          task: {
            include: {
              category: true,
              context: true,
              subtasks: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 50,
      });

      return suggestions;
    }),

  /**
   * Get suggestion count for badge display
   */
  getCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.aISuggestion.count({
      where: {
        userId: ctx.session.user.id,
        accepted: false,
        dismissed: false,
      },
    });

    return count;
  }),

  /**
   * Generate new suggestions based on current user data
   */
  regenerate: protectedProcedure.mutation(async ({ ctx }) => {
    // Fetch all necessary data for analysis
    const [tasks, habits, goals, categories, contexts] = await Promise.all([
      ctx.db.task.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          category: true,
          context: true,
          subtasks: { orderBy: { order: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 200, // Analyze recent tasks
      }),
      ctx.db.habit.findMany({
        where: { userId: ctx.session.user.id, isArchived: false },
      }),
      ctx.db.goal.findMany({
        where: { userId: ctx.session.user.id },
      }),
      ctx.db.category.findMany({
        where: { userId: ctx.session.user.id },
      }),
      ctx.db.context.findMany({
        where: { userId: ctx.session.user.id },
      }),
    ]);

    // Generate suggestions using AI service
    const newSuggestions = AISuggestionService.generateSuggestions({
      tasks,
      habits,
      goals,
      categories,
      contexts,
    });

    // Delete old undismissed, unaccepted suggestions to avoid duplicates
    await ctx.db.aISuggestion.deleteMany({
      where: {
        userId: ctx.session.user.id,
        accepted: false,
        dismissed: false,
      },
    });

    // Create new suggestions in database
    const created = await ctx.db.aISuggestion.createMany({
      data: newSuggestions.map((s) => ({
        userId: ctx.session.user.id,
        type: s.type,
        content: s.content,
        reasoning: s.reasoning,
        taskId: s.taskId,
        metadata: s.metadata ? (s.metadata as object) : undefined,
      })),
    });

    return {
      count: created.count,
      message: `Generated ${created.count} new suggestions`,
    };
  }),

  /**
   * Get AI-powered suggestions using the Anthropic API
   */
  getAISuggestions: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Check rate limit
    const prefs = await ctx.db.userPreferences.findUnique({
      where: { userId },
    });

    if (prefs?.lastAICallAt) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (prefs.lastAICallAt > oneHourAgo) {
        return { rateLimited: true, suggestions: [] };
      }
    }

    // Assemble planner context from DB
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const [overdueTasks, dueTodayTasks, dueSoonTasks, habits, lastReflection, inboxCount] =
      await Promise.all([
        ctx.db.task.count({
          where: {
            userId,
            status: { not: "DONE" },
            dueDate: { lt: startOfToday },
          },
        }),
        ctx.db.task.count({
          where: {
            userId,
            status: { not: "DONE" },
            dueDate: { gte: startOfToday, lt: endOfToday },
          },
        }),
        ctx.db.task.findMany({
          where: {
            userId,
            status: { not: "DONE" },
            dueDate: { gte: startOfToday, lte: threeDaysFromNow },
          },
          select: { title: true, dueDate: true },
          orderBy: { dueDate: "asc" },
          take: 10,
        }),
        ctx.db.habit.findMany({
          where: {
            userId,
            isArchived: false,
          },
          select: {
            name: true,
            logs: {
              orderBy: { date: "desc" },
              take: 7,
              select: { date: true },
            },
          },
        }),
        ctx.db.dailyReflection.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
        ctx.db.inboxItem.count({
          where: {
            userId,
            processed: false,
          },
        }),
      ]);

    const plannerContext: PlannerContext = {
      overdueCount: overdueTasks,
      dueTodayCount: dueTodayTasks,
      dueSoonTasks: dueSoonTasks
        .filter((t): t is typeof t & { dueDate: Date } => t.dueDate !== null)
        .map((t) => ({ title: t.title, dueDate: t.dueDate })),
      lowStreakHabits: habits
        .map((h) => {
          // Calculate streak from recent logs
          let streak = 0;
          const today = new Date();
          for (let i = 0; i < h.logs.length; i++) {
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);
            const logDate = h.logs[i]?.date;
            if (
              logDate &&
              logDate.getFullYear() === expectedDate.getFullYear() &&
              logDate.getMonth() === expectedDate.getMonth() &&
              logDate.getDate() === expectedDate.getDate()
            ) {
              streak++;
            } else {
              break;
            }
          }
          return { name: h.name, streak };
        })
        .filter((h) => h.streak <= 2)
        .slice(0, 5),
      lastReflectionDate: lastReflection?.createdAt ?? null,
      unprocessedInboxCount: inboxCount,
    };

    // Set API key from user preferences if available
    const originalKey = process.env.ANTHROPIC_API_KEY;
    if (prefs?.aiApiKey) {
      process.env.ANTHROPIC_API_KEY = prefs.aiApiKey;
    }

    const suggestions = await generateAISuggestions(plannerContext);

    // Restore original API key
    if (prefs?.aiApiKey) {
      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      } else {
        delete process.env.ANTHROPIC_API_KEY;
      }
    }

    // Update last call timestamp
    await ctx.db.userPreferences.upsert({
      where: { userId },
      update: { lastAICallAt: new Date() },
      create: { userId, lastAICallAt: new Date() },
    });

    return { rateLimited: false, suggestions };
  }),

  /**
   * Accept a suggestion and apply the changes
   */
  accept: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const suggestion = await ctx.db.aISuggestion.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          task: true,
        },
      });

      if (!suggestion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Suggestion not found",
        });
      }

      if (suggestion.accepted || suggestion.dismissed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Suggestion has already been processed",
        });
      }

      // Apply the suggestion based on type
      await applySuggestion(ctx, suggestion);

      // Mark as accepted
      await ctx.db.aISuggestion.update({
        where: { id: suggestion.id },
        data: { accepted: true },
      });

      return { success: true, message: "Suggestion applied successfully" };
    }),

  /**
   * Dismiss a suggestion
   */
  dismiss: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const suggestion = await ctx.db.aISuggestion.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!suggestion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Suggestion not found",
        });
      }

      await ctx.db.aISuggestion.update({
        where: { id: suggestion.id },
        data: { dismissed: true },
      });

      return { success: true, message: "Suggestion dismissed" };
    }),

  /**
   * Dismiss all suggestions
   */
  dismissAll: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.db.aISuggestion.updateMany({
      where: {
        userId: ctx.session.user.id,
        accepted: false,
        dismissed: false,
      },
      data: { dismissed: true },
    });

    return {
      success: true,
      count: result.count,
      message: `Dismissed ${result.count} suggestions`,
    };
  }),
});

/**
 * Apply a suggestion to the database
 */
async function applySuggestion(
  ctx: { db: PrismaClient; session: { user: { id: string } } },
  suggestion: {
    type: string;
    taskId: string | null;
    metadata: unknown;
  }
): Promise<void> {
  if (!suggestion.taskId) {
    // Some suggestions don't have taskId (like CATEGORY_BALANCE)
    return;
  }

  const metadata = suggestion.metadata as Record<string, unknown> | null;

  switch (suggestion.type) {
    case "PRIORITY_CHANGE":
      if (metadata?.suggestedPriority) {
        await ctx.db.task.updateMany({
          where: { id: suggestion.taskId, userId: ctx.session.user.id },
          data: { priority: metadata.suggestedPriority },
        });
      }
      break;

    case "DUE_DATE":
      if (metadata?.suggestedDate) {
        await ctx.db.task.updateMany({
          where: { id: suggestion.taskId, userId: ctx.session.user.id },
          data: { dueDate: new Date(metadata.suggestedDate as string) },
        });
      }
      break;

    case "CONTEXT":
      if (metadata?.contextId) {
        await ctx.db.task.updateMany({
          where: { id: suggestion.taskId, userId: ctx.session.user.id },
          data: { contextId: metadata.contextId as string },
        });
      }
      break;

    case "RESCHEDULE":
      if (metadata?.suggestedDate) {
        await ctx.db.task.updateMany({
          where: { id: suggestion.taskId, userId: ctx.session.user.id },
          data: { dueDate: new Date(metadata.suggestedDate as string) },
        });
      }
      break;

    case "BREAKDOWN":
      if (metadata?.suggestedSubtasks && Array.isArray(metadata.suggestedSubtasks)) {
        // Verify the user owns the task before creating subtasks
        const taskExists = await ctx.db.task.count({
          where: { id: suggestion.taskId!, userId: ctx.session.user.id },
        });
        if (taskExists > 0) {
          const subtasks = metadata.suggestedSubtasks as string[];
          await Promise.all(
            subtasks.map((title, index) =>
              ctx.db.subtask.create({
                data: {
                  taskId: suggestion.taskId!,
                  title,
                  order: index,
                  completed: false,
                },
              })
            )
          );
        }
      }
      break;

    case "RECURRING":
      if (metadata?.recurrenceRule) {
        await ctx.db.task.updateMany({
          where: { id: suggestion.taskId, userId: ctx.session.user.id },
          data: { recurrenceRule: metadata.recurrenceRule as string },
        });
      }
      break;

    case "CATEGORY_BALANCE":
    case "TASK_SUGGESTION":
    default:
      // These types don't have automatic actions
      break;
  }
}
