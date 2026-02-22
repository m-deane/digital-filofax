import Anthropic from "@anthropic-ai/sdk";

export interface PlannerContext {
  overdueCount: number;
  dueTodayCount: number;
  dueSoonTasks: Array<{ title: string; dueDate: Date }>;
  lowStreakHabits: Array<{ name: string; streak: number }>;
  lastReflectionDate: Date | null;
  unprocessedInboxCount: number;
}

export interface AISuggestionResult {
  title: string;
  description: string;
  actionType: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

function buildUserPrompt(context: PlannerContext): string {
  const parts: string[] = [];

  if (context.overdueCount > 0) {
    parts.push(`User has ${context.overdueCount} overdue task${context.overdueCount === 1 ? "" : "s"}.`);
  }

  if (context.dueTodayCount > 0) {
    parts.push(
      `${context.dueTodayCount} task${context.dueTodayCount === 1 ? "" : "s"} due today: ${context.dueSoonTasks
        .filter((t) => {
          const today = new Date();
          return (
            t.dueDate.getFullYear() === today.getFullYear() &&
            t.dueDate.getMonth() === today.getMonth() &&
            t.dueDate.getDate() === today.getDate()
          );
        })
        .map((t) => `'${t.title}'`)
        .join(", ")}.`
    );
  }

  const upcomingTasks = context.dueSoonTasks.filter((t) => {
    const today = new Date();
    return !(
      t.dueDate.getFullYear() === today.getFullYear() &&
      t.dueDate.getMonth() === today.getMonth() &&
      t.dueDate.getDate() === today.getDate()
    );
  });

  if (upcomingTasks.length > 0) {
    parts.push(
      `${upcomingTasks.length} task${upcomingTasks.length === 1 ? "" : "s"} due soon: ${upcomingTasks
        .map((t) => `'${t.title}'`)
        .join(", ")}.`
    );
  }

  if (context.lowStreakHabits.length > 0) {
    parts.push(
      `Habits needing attention: ${context.lowStreakHabits
        .map((h) => `'${h.name}' (streak: ${h.streak} day${h.streak === 1 ? "" : "s"})`)
        .join(", ")}.`
    );
  }

  if (context.lastReflectionDate) {
    const daysSince = Math.floor(
      (Date.now() - context.lastReflectionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    parts.push(`Last reflection was ${daysSince} day${daysSince === 1 ? "" : "s"} ago.`);
  } else {
    parts.push("User has never written a reflection.");
  }

  if (context.unprocessedInboxCount > 0) {
    parts.push(`${context.unprocessedInboxCount} unprocessed item${context.unprocessedInboxCount === 1 ? "" : "s"} in inbox.`);
  }

  if (parts.length === 0) {
    parts.push("User has no overdue tasks, no tasks due today, and all habits are on track.");
  }

  return parts.join(" ");
}

export async function generateAISuggestions(
  context: PlannerContext
): Promise<AISuggestionResult[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const client = new Anthropic({ apiKey });

    const userPrompt = buildUserPrompt(context);

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:
        "You are a personal productivity assistant for a digital planner. Given the user's current planning context, generate 3-5 specific, actionable suggestions. Return ONLY a JSON array of suggestions, no other text. Each suggestion must have: title (string), description (string), actionType (string like 'review_tasks', 'schedule_reflection', 'focus_habit', 'plan_day', 'clear_inbox'), priority ('LOW', 'MEDIUM', 'HIGH', or 'URGENT').",
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return [];
    }

    const parsed = JSON.parse(textBlock.text) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item: unknown): item is AISuggestionResult =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).title === "string" &&
          typeof (item as Record<string, unknown>).description === "string" &&
          typeof (item as Record<string, unknown>).actionType === "string" &&
          ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(
            (item as Record<string, unknown>).priority as string
          )
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}
