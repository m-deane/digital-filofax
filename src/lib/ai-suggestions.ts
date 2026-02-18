import type { Task, Habit, Goal, Category, Context } from "@prisma/client";

export type SuggestionType =
  | "TASK_SUGGESTION"
  | "PRIORITY_CHANGE"
  | "DUE_DATE"
  | "CONTEXT"
  | "BREAKDOWN"
  | "RECURRING"
  | "RESCHEDULE"
  | "CATEGORY_BALANCE";

export interface AISuggestionData {
  type: SuggestionType;
  content: string;
  reasoning: string;
  taskId?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskWithRelations extends Task {
  category: Category | null;
  context: Context | null;
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
}

export interface AnalysisContext {
  tasks: TaskWithRelations[];
  habits: Habit[];
  goals: Goal[];
  categories: Category[];
  contexts: Context[];
}

/**
 * AI Suggestion Service
 * Uses pattern matching and heuristics to generate intelligent task suggestions
 * No external AI API needed - all logic is rule-based
 */
export class AISuggestionService {
  /**
   * Generate all suggestions for a user based on their current data
   */
  static generateSuggestions(context: AnalysisContext): AISuggestionData[] {
    const suggestions: AISuggestionData[] = [];

    // 1. Analyze overdue tasks
    suggestions.push(...this.analyzeOverdueTasks(context.tasks));

    // 2. Suggest priorities for tasks
    suggestions.push(...this.suggestPriorities(context.tasks));

    // 3. Suggest due dates for tasks without them
    suggestions.push(...this.suggestDueDates(context.tasks));

    // 4. Suggest breaking down large tasks
    suggestions.push(...this.suggestBreakdown(context.tasks));

    // 5. Suggest recurring tasks based on patterns
    suggestions.push(...this.suggestRecurring(context.tasks));

    // 6. Suggest contexts for tasks
    suggestions.push(...this.suggestContexts(context.tasks, context.contexts));

    // 7. Suggest category balance
    suggestions.push(...this.suggestCategoryBalance(context.tasks, context.categories));

    // Remove duplicates and limit to top suggestions
    return this.rankAndLimitSuggestions(suggestions);
  }

  /**
   * Analyze overdue tasks and suggest rescheduling or breaking down
   */
  private static analyzeOverdueTasks(tasks: TaskWithRelations[]): AISuggestionData[] {
    const suggestions: AISuggestionData[] = [];
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < now && t.status !== "DONE"
    );

    for (const task of overdueTasks) {
      const daysOverdue = Math.floor(
        (now.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOverdue > 7) {
        // Severely overdue - suggest breaking down or dismissing
        if (task.description && task.description.length > 100 && task.subtasks.length === 0) {
          suggestions.push({
            type: "BREAKDOWN",
            content: `Break down "${task.title}" into smaller tasks`,
            reasoning: `This task is ${daysOverdue} days overdue and seems complex. Breaking it down might make it more manageable.`,
            taskId: task.id,
            metadata: { daysOverdue },
          });
        } else {
          suggestions.push({
            type: "RESCHEDULE",
            content: `Reschedule "${task.title}" to this week`,
            reasoning: `This task is ${daysOverdue} days overdue. Consider rescheduling or re-evaluating its importance.`,
            taskId: task.id,
            metadata: {
              daysOverdue,
              suggestedDate: this.getNextWeekday(now),
            },
          });
        }
      } else if (daysOverdue > 0) {
        // Mildly overdue - suggest rescheduling
        suggestions.push({
          type: "RESCHEDULE",
          content: `Reschedule "${task.title}" to today or tomorrow`,
          reasoning: `This task is ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue. Reschedule it to get back on track.`,
          taskId: task.id,
          metadata: {
            daysOverdue,
            suggestedDate: this.getNextWeekday(now),
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Suggest priority changes based on due dates and context
   */
  private static suggestPriorities(tasks: TaskWithRelations[]): AISuggestionData[] {
    const suggestions: AISuggestionData[] = [];
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    for (const task of tasks) {
      if (task.status === "DONE") continue;

      // High urgency: Due soon but low/medium priority
      if (
        task.dueDate &&
        task.dueDate <= threeDaysFromNow &&
        (task.priority === "LOW" || task.priority === "MEDIUM")
      ) {
        const daysUntilDue = Math.ceil(
          (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        suggestions.push({
          type: "PRIORITY_CHANGE",
          content: `Increase priority of "${task.title}" to ${daysUntilDue <= 1 ? "URGENT" : "HIGH"}`,
          reasoning: `This task is due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""} but marked as ${task.priority} priority.`,
          taskId: task.id,
          metadata: {
            currentPriority: task.priority,
            suggestedPriority: daysUntilDue <= 1 ? "URGENT" : "HIGH",
            daysUntilDue,
          },
        });
      }

      // Low urgency: No due date and high/urgent priority
      if (!task.dueDate && (task.priority === "HIGH" || task.priority === "URGENT")) {
        suggestions.push({
          type: "DUE_DATE",
          content: `Add a due date to "${task.title}"`,
          reasoning: `This task is marked as ${task.priority} priority but has no due date. Adding a deadline can help with planning.`,
          taskId: task.id,
          metadata: {
            currentPriority: task.priority,
            suggestedDate: this.getNextWeekday(now),
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Suggest due dates for tasks without them based on priority and patterns
   */
  private static suggestDueDates(tasks: TaskWithRelations[]): AISuggestionData[] {
    const suggestions: AISuggestionData[] = [];
    const now = new Date();
    const tasksWithoutDates = tasks.filter(
      (t) => !t.dueDate && t.status !== "DONE"
    );

    for (const task of tasksWithoutDates) {
      let suggestedDate: Date;
      let reasoning: string;

      // Priority-based suggestions
      switch (task.priority) {
        case "URGENT":
          suggestedDate = new Date(now);
          suggestedDate.setDate(now.getDate() + 1);
          reasoning = "Urgent tasks should typically be completed within 1-2 days.";
          break;
        case "HIGH":
          suggestedDate = new Date(now);
          suggestedDate.setDate(now.getDate() + 3);
          reasoning = "High priority tasks are usually best completed within a week.";
          break;
        case "MEDIUM":
          suggestedDate = new Date(now);
          suggestedDate.setDate(now.getDate() + 7);
          reasoning = "Medium priority tasks can be scheduled for next week.";
          break;
        case "LOW":
          suggestedDate = new Date(now);
          suggestedDate.setDate(now.getDate() + 14);
          reasoning = "Low priority tasks can be scheduled for later planning.";
          break;
        default:
          continue;
      }

      // Only suggest for tasks created more than a day ago
      const daysSinceCreation = Math.floor(
        (now.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation >= 1) {
        suggestions.push({
          type: "DUE_DATE",
          content: `Add due date to "${task.title}"`,
          reasoning,
          taskId: task.id,
          metadata: {
            suggestedDate: this.getNextWeekday(suggestedDate),
            priority: task.priority,
          },
        });
      }
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Suggest breaking down large tasks into subtasks
   */
  private static suggestBreakdown(tasks: TaskWithRelations[]): AISuggestionData[] {
    const suggestions: AISuggestionData[] = [];

    for (const task of tasks) {
      if (task.status === "DONE") continue;

      // Complex tasks with no subtasks
      const isLongTitle = task.title.length > 60;
      const hasLongDescription = task.description && task.description.length > 150;
      const hasNoSubtasks = task.subtasks.length === 0;

      if ((isLongTitle || hasLongDescription) && hasNoSubtasks) {
        const suggestedSubtasks = this.generateSubtaskSuggestions(task);

        suggestions.push({
          type: "BREAKDOWN",
          content: `Break down "${task.title}" into ${suggestedSubtasks.length} smaller steps`,
          reasoning: "Large tasks are more manageable when broken into smaller, actionable steps.",
          taskId: task.id,
          metadata: { suggestedSubtasks },
        });
      }
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Detect patterns and suggest recurring tasks
   */
  private static suggestRecurring(tasks: TaskWithRelations[]): AISuggestionData[] {
    const suggestions: AISuggestionData[] = [];
    const completedTasks = tasks.filter((t) => t.status === "DONE");

    // Group tasks by similar titles (fuzzy matching)
    const taskGroups = new Map<string, TaskWithRelations[]>();

    for (const task of completedTasks) {
      const normalizedTitle = this.normalizeTaskTitle(task.title);
      const existing = taskGroups.get(normalizedTitle) || [];
      existing.push(task);
      taskGroups.set(normalizedTitle, existing);
    }

    // Find recurring patterns
    for (const [, group] of taskGroups) {
      if (group.length >= 3) {
        // At least 3 similar tasks
        const intervals = this.calculateIntervals(group);
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

        if (avgInterval > 0 && avgInterval < 90) {
          // Between 1 day and 3 months
          const recurrenceRule = this.inferRecurrenceRule(avgInterval);
          const latestTask = group.sort(
            (a, b) => b.completedAt!.getTime() - a.completedAt!.getTime()
          )[0]!;

          suggestions.push({
            type: "RECURRING",
            content: `Make "${latestTask.title}" a recurring task`,
            reasoning: `You've completed similar tasks ${group.length} times, averaging every ${Math.round(avgInterval)} days. Consider making this recurring.`,
            taskId: latestTask.id,
            metadata: {
              recurrenceRule,
              occurrences: group.length,
              avgInterval: Math.round(avgInterval),
            },
          });
        }
      }
    }

    return suggestions.slice(0, 2);
  }

  /**
   * Suggest contexts for tasks based on keywords
   */
  private static suggestContexts(
    tasks: TaskWithRelations[],
    contexts: Context[]
  ): AISuggestionData[] {
    const suggestions: AISuggestionData[] = [];

    if (contexts.length === 0) return suggestions;

    const contextKeywords = new Map<string, string[]>([
      ["@home", ["home", "house", "apartment", "room", "clean", "organize"]],
      ["@work", ["work", "office", "meeting", "email", "report", "project"]],
      ["@computer", ["code", "write", "design", "email", "research", "online"]],
      ["@phone", ["call", "phone", "contact", "message", "text"]],
      ["@errands", ["buy", "purchase", "store", "shop", "pick up", "get"]],
      ["@gym", ["workout", "exercise", "gym", "run", "fitness"]],
    ]);

    for (const task of tasks) {
      if (task.status === "DONE" || task.context) continue;

      const taskText = `${task.title} ${task.description || ""}`.toLowerCase();

      for (const [contextName, keywords] of contextKeywords) {
        const matchingContext = contexts.find(
          (c) => c.name.toLowerCase() === contextName
        );

        if (matchingContext && keywords.some((kw) => taskText.includes(kw))) {
          suggestions.push({
            type: "CONTEXT",
            content: `Add "${matchingContext.name}" context to "${task.title}"`,
            reasoning: `This task appears to be ${contextName.replace("@", "")}-related.`,
            taskId: task.id,
            metadata: { contextId: matchingContext.id },
          });
          break;
        }
      }
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Suggest better distribution across categories
   */
  private static suggestCategoryBalance(
    tasks: TaskWithRelations[],
    categories: Category[]
  ): AISuggestionData[] {
    const suggestions: AISuggestionData[] = [];
    const activeTasks = tasks.filter((t) => t.status !== "DONE");

    if (categories.length < 2) return suggestions;

    // Count tasks per category
    const categoryCount = new Map<string, number>();
    const uncategorizedCount = activeTasks.filter((t) => !t.categoryId).length;

    for (const category of categories) {
      const count = activeTasks.filter((t) => t.categoryId === category.id).length;
      categoryCount.set(category.id, count);
    }

    const counts = Array.from(categoryCount.values());
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
    const maxCount = Math.max(...counts);

    // Find overloaded categories
    for (const [categoryId, count] of categoryCount) {
      if (count > avgCount * 2 && count === maxCount && count > 5) {
        const category = categories.find((c) => c.id === categoryId);
        if (category) {
          suggestions.push({
            type: "CATEGORY_BALANCE",
            content: `Consider redistributing tasks from "${category.name}"`,
            reasoning: `You have ${count} active tasks in "${category.name}", which is more than other categories. Consider if some could be better organized elsewhere.`,
            metadata: { categoryId, taskCount: count, avgCount: Math.round(avgCount) },
          });
        }
      }
    }

    // Suggest categorizing uncategorized tasks
    if (uncategorizedCount > 5) {
      suggestions.push({
        type: "CATEGORY_BALANCE",
        content: `Add categories to ${uncategorizedCount} uncategorized tasks`,
        reasoning: "Categorizing tasks helps with organization and finding related work.",
        metadata: { uncategorizedCount },
      });
    }

    return suggestions.slice(0, 2);
  }

  /**
   * Rank suggestions by importance and limit results
   */
  private static rankAndLimitSuggestions(
    suggestions: AISuggestionData[]
  ): AISuggestionData[] {
    // Priority order
    const typePriority: Record<SuggestionType, number> = {
      RESCHEDULE: 10,
      PRIORITY_CHANGE: 9,
      DUE_DATE: 8,
      BREAKDOWN: 7,
      RECURRING: 6,
      CONTEXT: 5,
      CATEGORY_BALANCE: 4,
      TASK_SUGGESTION: 3,
    };

    return suggestions
      .sort((a, b) => typePriority[b.type] - typePriority[a.type])
      .slice(0, 15); // Limit to top 15 suggestions
  }

  // Helper methods

  private static getNextWeekday(date: Date): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + 1);

    // Skip weekends
    const day = result.getDay();
    if (day === 0) result.setDate(result.getDate() + 1); // Sunday -> Monday
    if (day === 6) result.setDate(result.getDate() + 2); // Saturday -> Monday

    return result;
  }

  private static normalizeTaskTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/\d+/g, "") // Remove numbers
      .replace(/[^a-z\s]/g, "") // Remove special chars
      .trim()
      .slice(0, 30); // First 30 chars
  }

  private static calculateIntervals(tasks: TaskWithRelations[]): number[] {
    const sorted = tasks
      .filter((t) => t.completedAt)
      .sort((a, b) => a.completedAt!.getTime() - b.completedAt!.getTime());

    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const interval =
        (sorted[i]!.completedAt!.getTime() - sorted[i - 1]!.completedAt!.getTime()) /
        (1000 * 60 * 60 * 24);
      intervals.push(interval);
    }

    return intervals;
  }

  private static inferRecurrenceRule(avgIntervalDays: number): string {
    if (avgIntervalDays <= 1.5) return "FREQ=DAILY";
    if (avgIntervalDays <= 8) return "FREQ=WEEKLY";
    if (avgIntervalDays <= 35) return "FREQ=MONTHLY";
    return "FREQ=MONTHLY";
  }

  private static generateSubtaskSuggestions(task: TaskWithRelations): string[] {
    const suggestions: string[] = [];

    // Generic breakdown based on task characteristics
    if (task.title.toLowerCase().includes("plan")) {
      suggestions.push("Research and gather information");
      suggestions.push("Create initial outline or draft");
      suggestions.push("Review and finalize");
    } else if (task.title.toLowerCase().includes("write")) {
      suggestions.push("Create outline");
      suggestions.push("Write first draft");
      suggestions.push("Edit and revise");
      suggestions.push("Final review");
    } else if (task.title.toLowerCase().includes("organize")) {
      suggestions.push("Sort and categorize items");
      suggestions.push("Remove unnecessary items");
      suggestions.push("Arrange in final order");
    } else {
      // Default breakdown
      suggestions.push("Prepare and gather resources");
      suggestions.push("Complete main work");
      suggestions.push("Review and finalize");
    }

    return suggestions;
  }
}
