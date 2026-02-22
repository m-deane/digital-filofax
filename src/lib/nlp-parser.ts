import * as chrono from "chrono-node";

export type ParsedPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ParsedTask {
  title: string;
  dueDate: Date | null;
  dueTime: string | null; // "HH:MM" format
  priority: ParsedPriority | null;
  categories: string[]; // from #tag
  contexts: string[]; // from @context
  rawInput: string;
}

// Priority keyword patterns
// Note: \b before ! fails because ! is not a word char; use \b only after word chars
const PRIORITY_PATTERNS: { pattern: RegExp; value: ParsedPriority }[] = [
  { pattern: /!urgent\b/i, value: "URGENT" },
  { pattern: /!high\b/i, value: "HIGH" },
  { pattern: /!medium\b/i, value: "MEDIUM" },
  { pattern: /!low\b/i, value: "LOW" },
  { pattern: /\bp1\b/i, value: "URGENT" },
  { pattern: /\bp2\b/i, value: "HIGH" },
  { pattern: /\bp3\b/i, value: "MEDIUM" },
  { pattern: /\bp4\b/i, value: "LOW" },
  { pattern: /!!!/, value: "URGENT" },
  { pattern: /!!(?!!)/, value: "HIGH" },
];

// Category pattern: #word
const CATEGORY_PATTERN = /#([\w-]+)/g;

// Context pattern: @word
const CONTEXT_PATTERN = /@([\w-]+)/g;

function extractPriority(input: string): { priority: ParsedPriority | null; cleaned: string } {
  let priority: ParsedPriority | null = null;
  let cleaned = input;

  for (const { pattern, value } of PRIORITY_PATTERNS) {
    if (pattern.test(cleaned)) {
      priority = value;
      cleaned = cleaned.replace(pattern, "").trim();
      break; // Take first match (highest priority marker found)
    }
  }

  return { priority, cleaned };
}

function extractCategories(input: string): { categories: string[]; cleaned: string } {
  const categories: string[] = [];
  const cleaned = input.replace(CATEGORY_PATTERN, (_, tag: string) => {
    categories.push(tag.toLowerCase());
    return "";
  }).trim();

  return { categories, cleaned };
}

function extractContexts(input: string): { contexts: string[]; cleaned: string } {
  const contexts: string[] = [];
  const cleaned = input.replace(CONTEXT_PATTERN, (_, ctx: string) => {
    contexts.push(ctx.toLowerCase());
    return "";
  }).trim();

  return { contexts, cleaned };
}

function extractDateTime(input: string, referenceDate: Date = new Date()): {
  dueDate: Date | null;
  dueTime: string | null;
  cleaned: string;
} {
  const results = chrono.parse(input, referenceDate, { forwardDate: true });

  if (results.length === 0) {
    return { dueDate: null, dueTime: null, cleaned: input };
  }

  const result = results[0];
  if (!result) {
    return { dueDate: null, dueTime: null, cleaned: input };
  }

  const date = result.start.date();
  const hasTime = result.start.isCertain("hour");

  const dueTime = hasTime
    ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    : null;

  // Remove the matched date text from input
  const beforeMatch = input.slice(0, result.index);
  const afterMatch = input.slice(result.index + result.text.length);
  const cleaned = (beforeMatch + afterMatch).trim().replace(/\s+/g, " ");

  return { dueDate: date, dueTime, cleaned };
}

/**
 * Parse a natural language task input string into structured fields.
 *
 * Examples:
 *   "Call dentist tomorrow at 2pm !high #health @phone"
 *   → { title: "Call dentist", dueDate: <tomorrow>, dueTime: "14:00", priority: "HIGH", categories: ["health"], contexts: ["phone"] }
 *
 *   "Buy groceries next monday p2 #personal"
 *   → { title: "Buy groceries", dueDate: <next monday>, dueTime: null, priority: "HIGH", categories: ["personal"], contexts: [] }
 */
export function parseTaskInput(input: string, referenceDate: Date = new Date()): ParsedTask {
  const rawInput = input;
  let working = input.trim();

  // Extract structured fields in order
  const { priority, cleaned: afterPriority } = extractPriority(working);
  working = afterPriority;

  const { categories, cleaned: afterCategories } = extractCategories(working);
  working = afterCategories;

  const { contexts, cleaned: afterContexts } = extractContexts(working);
  working = afterContexts;

  const { dueDate, dueTime, cleaned: afterDate } = extractDateTime(working, referenceDate);
  working = afterDate;

  // Clean up extra whitespace and punctuation
  const title = working.replace(/\s+/g, " ").trim();

  return {
    title: title || rawInput.trim(),
    dueDate,
    dueTime,
    priority,
    categories,
    contexts,
    rawInput,
  };
}

/**
 * Check if input has any structured tokens that indicate NLP parsing is active.
 */
export function hasNlpTokens(input: string): boolean {
  return (
    /#[\w-]+/.test(input) ||
    /@[\w-]+/.test(input) ||
    /!(urgent|high|medium|low)/i.test(input) ||
    /\b(p[1-4]|!!!?)\b/i.test(input) ||
    /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next|this|in \d+)\b/i.test(input)
  );
}

/**
 * Format a parsed result into a human-readable preview string.
 */
export function formatParsedPreview(parsed: ParsedTask): string {
  const parts: string[] = [];

  if (parsed.dueDate) {
    const dateStr = parsed.dueDate.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    parts.push(parsed.dueTime ? `${dateStr} at ${formatTime(parsed.dueTime)}` : dateStr);
  }

  if (parsed.priority) {
    parts.push(parsed.priority.charAt(0) + parsed.priority.slice(1).toLowerCase());
  }

  if (parsed.categories.length > 0) {
    parts.push(...parsed.categories.map((c) => `#${c}`));
  }

  if (parsed.contexts.length > 0) {
    parts.push(...parsed.contexts.map((c) => `@${c}`));
  }

  return parts.join(" · ");
}

function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr ?? "0", 10);
  const minute = parseInt(minuteStr ?? "0", 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return minute === 0 ? `${displayHour}${ampm}` : `${displayHour}:${minuteStr}${ampm}`;
}
