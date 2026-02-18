import { z } from "zod";
import type { TaskStatus, Priority } from "@prisma/client";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CSVTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  category: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
});

const TodoistTaskSchema = z.object({
  content: z.string(),
  description: z.string().optional(),
  due: z
    .object({
      date: z.string(),
      is_recurring: z.boolean().optional(),
      string: z.string().optional(),
    })
    .optional(),
  priority: z.number().min(1).max(4).optional(),
  labels: z.array(z.string()).optional(),
  completed_at: z.string().nullable().optional(),
});

const AppleReminderSchema = z.object({
  title: z.string(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  completed: z.boolean().optional(),
  priority: z.number().optional(), // 0-9 in Apple Reminders
  list: z.string().optional(),
});

const JSONTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  contextId: z.string().optional(),
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ImportTaskData = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: Date;
  category?: string;
  tags?: string[];
  contextId?: string;
};

export type ImportResult = {
  success: boolean;
  data?: ImportTaskData[];
  errors: string[];
  warnings?: string[];
};

// ============================================================================
// CSV PARSING
// ============================================================================

export function parseCSV(csvContent: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: ImportTaskData[] = [];

  try {
    const lines = csvContent.trim().split("\n");

    if (lines.length < 2) {
      return {
        success: false,
        errors: ["CSV file must have at least a header row and one data row"],
      };
    }

    // Parse header
    const headers = lines[0]!
      .split(",")
      .map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

    const titleIndex = headers.indexOf("title");
    if (titleIndex === -1) {
      return {
        success: false,
        errors: ["CSV must have a 'title' column"],
      };
    }

    const descriptionIndex = headers.indexOf("description");
    const dueDateIndex = headers.indexOf("duedate");
    const priorityIndex = headers.indexOf("priority");
    const statusIndex = headers.indexOf("status");
    const categoryIndex = headers.indexOf("category");
    const tagsIndex = headers.indexOf("tags");

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]!.trim();
      if (!line) continue;

      try {
        // Simple CSV parsing (handles basic cases)
        const values = parseCSVLine(line);

        const rawData: Record<string, string | undefined> = {
          title: values[titleIndex],
          description: descriptionIndex >= 0 ? values[descriptionIndex] : undefined,
          dueDate: dueDateIndex >= 0 ? values[dueDateIndex] : undefined,
          priority: priorityIndex >= 0 ? values[priorityIndex] : undefined,
          status: statusIndex >= 0 ? values[statusIndex] : undefined,
          category: categoryIndex >= 0 ? values[categoryIndex] : undefined,
          tags: tagsIndex >= 0 ? values[tagsIndex] : undefined,
        };

        const validated = CSVTaskSchema.safeParse(rawData);

        if (!validated.success) {
          errors.push(`Row ${i + 1}: ${validated.error.errors[0]?.message ?? "Validation error"}`);
          continue;
        }

        const task: ImportTaskData = {
          title: validated.data.title,
          description: validated.data.description,
          status: validated.data.status as TaskStatus | undefined,
          priority: validated.data.priority as Priority | undefined,
          category: validated.data.category,
        };

        // Parse due date
        if (validated.data.dueDate) {
          const parsedDate = parseDate(validated.data.dueDate);
          if (parsedDate) {
            task.dueDate = parsedDate;
          } else {
            warnings.push(`Row ${i + 1}: Could not parse date "${validated.data.dueDate}"`);
          }
        }

        // Parse tags
        if (validated.data.tags) {
          task.tags = validated.data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }

        data.push(task);
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "Parse error"}`);
      }
    }

    return {
      success: data.length > 0,
      data,
      errors,
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      errors: [err instanceof Error ? err.message : "Failed to parse CSV"],
    };
  }
}

// Simple CSV line parser (handles quoted values)
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

// ============================================================================
// TODOIST JSON PARSING
// ============================================================================

export function parseTodoistJSON(jsonContent: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: ImportTaskData[] = [];

  try {
    const parsed = JSON.parse(jsonContent) as unknown;

    let tasks: unknown[];
    if (Array.isArray(parsed)) {
      tasks = parsed;
    } else if (typeof parsed === "object" && parsed !== null && "items" in parsed) {
      tasks = (parsed as { items: unknown[] }).items;
    } else {
      return {
        success: false,
        errors: ["Invalid Todoist export format. Expected array of tasks or object with 'items' field."],
      };
    }

    for (let i = 0; i < tasks.length; i++) {
      try {
        const validated = TodoistTaskSchema.safeParse(tasks[i]);

        if (!validated.success) {
          errors.push(`Task ${i + 1}: ${validated.error.errors[0]?.message ?? "Validation error"}`);
          continue;
        }

        const todoistTask = validated.data;

        // Map Todoist priority (1-4) to our Priority enum
        // Todoist: 4 = urgent, 3 = high, 2 = medium, 1 = low
        let priority: Priority = "MEDIUM";
        if (todoistTask.priority === 4) priority = "URGENT";
        else if (todoistTask.priority === 3) priority = "HIGH";
        else if (todoistTask.priority === 2) priority = "MEDIUM";
        else if (todoistTask.priority === 1) priority = "LOW";

        const task: ImportTaskData = {
          title: todoistTask.content,
          description: todoistTask.description,
          status: todoistTask.completed_at ? "DONE" : "TODO",
          priority,
          tags: todoistTask.labels,
        };

        // Parse due date
        if (todoistTask.due?.date) {
          const parsedDate = parseDate(todoistTask.due.date);
          if (parsedDate) {
            task.dueDate = parsedDate;
          } else {
            warnings.push(`Task ${i + 1}: Could not parse date "${todoistTask.due.date}"`);
          }
        }

        data.push(task);
      } catch (err) {
        errors.push(`Task ${i + 1}: ${err instanceof Error ? err.message : "Parse error"}`);
      }
    }

    return {
      success: data.length > 0,
      data,
      errors,
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      errors: [err instanceof Error ? err.message : "Failed to parse JSON"],
    };
  }
}

// ============================================================================
// APPLE REMINDERS JSON PARSING
// ============================================================================

export function parseAppleReminders(jsonContent: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: ImportTaskData[] = [];

  try {
    const parsed = JSON.parse(jsonContent) as unknown;

    const reminders = Array.isArray(parsed) ? parsed : [parsed];

    for (let i = 0; i < reminders.length; i++) {
      try {
        const validated = AppleReminderSchema.safeParse(reminders[i]);

        if (!validated.success) {
          errors.push(`Reminder ${i + 1}: ${validated.error.errors[0]?.message ?? "Validation error"}`);
          continue;
        }

        const reminder = validated.data;

        // Map Apple priority (0-9) to our Priority enum
        // Apple: 0 = none, 1 = low, 5 = medium, 9 = high
        let priority: Priority = "MEDIUM";
        if (reminder.priority !== undefined) {
          if (reminder.priority >= 8) priority = "URGENT";
          else if (reminder.priority >= 6) priority = "HIGH";
          else if (reminder.priority >= 3) priority = "MEDIUM";
          else priority = "LOW";
        }

        const task: ImportTaskData = {
          title: reminder.title,
          description: reminder.notes,
          status: reminder.completed ? "DONE" : "TODO",
          priority,
          category: reminder.list,
        };

        // Parse due date
        if (reminder.dueDate) {
          const parsedDate = parseDate(reminder.dueDate);
          if (parsedDate) {
            task.dueDate = parsedDate;
          } else {
            warnings.push(`Reminder ${i + 1}: Could not parse date "${reminder.dueDate}"`);
          }
        }

        data.push(task);
      } catch (err) {
        errors.push(`Reminder ${i + 1}: ${err instanceof Error ? err.message : "Parse error"}`);
      }
    }

    return {
      success: data.length > 0,
      data,
      errors,
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      errors: [err instanceof Error ? err.message : "Failed to parse JSON"],
    };
  }
}

// ============================================================================
// INTERNAL JSON PARSING (for backup/restore)
// ============================================================================

export function parseInternalJSON(jsonContent: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: ImportTaskData[] = [];

  try {
    const parsed = JSON.parse(jsonContent) as unknown;

    const tasks = Array.isArray(parsed) ? parsed : [parsed];

    for (let i = 0; i < tasks.length; i++) {
      try {
        const validated = JSONTaskSchema.safeParse(tasks[i]);

        if (!validated.success) {
          errors.push(`Task ${i + 1}: ${validated.error.errors[0]?.message ?? "Validation error"}`);
          continue;
        }

        const jsonTask = validated.data;

        const task: ImportTaskData = {
          title: jsonTask.title,
          description: jsonTask.description,
          status: jsonTask.status,
          priority: jsonTask.priority,
          category: jsonTask.category,
          tags: jsonTask.tags,
          contextId: jsonTask.contextId,
        };

        // Parse due date
        if (jsonTask.dueDate) {
          const parsedDate = parseDate(jsonTask.dueDate);
          if (parsedDate) {
            task.dueDate = parsedDate;
          } else {
            warnings.push(`Task ${i + 1}: Could not parse date "${jsonTask.dueDate}"`);
          }
        }

        data.push(task);
      } catch (err) {
        errors.push(`Task ${i + 1}: ${err instanceof Error ? err.message : "Parse error"}`);
      }
    }

    return {
      success: data.length > 0,
      data,
      errors,
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      errors: [err instanceof Error ? err.message : "Failed to parse JSON"],
    };
  }
}

// ============================================================================
// VALIDATION & MAPPING
// ============================================================================

export function validateImportData(data: ImportTaskData[]): {
  valid: ImportTaskData[];
  invalid: Array<{ data: ImportTaskData; error: string }>;
} {
  const valid: ImportTaskData[] = [];
  const invalid: Array<{ data: ImportTaskData; error: string }> = [];

  for (const task of data) {
    if (!task.title || task.title.trim().length === 0) {
      invalid.push({ data: task, error: "Title is required" });
      continue;
    }

    if (task.title.length > 500) {
      invalid.push({ data: task, error: "Title is too long (max 500 characters)" });
      continue;
    }

    valid.push(task);
  }

  return { valid, invalid };
}

// ============================================================================
// DATE PARSING
// ============================================================================

export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Try ISO format first
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try common formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // M/D/YY or M/D/YYYY
  ];

  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      try {
        let year: number, month: number, day: number;

        if (format === formats[0]) {
          // YYYY-MM-DD
          [, year, month, day] = match.map(Number) as [string, number, number, number];
        } else if (format === formats[1]) {
          // MM/DD/YYYY
          [, month, day, year] = match.map(Number) as [string, number, number, number];
        } else if (format === formats[2]) {
          // DD-MM-YYYY
          [, day, month, year] = match.map(Number) as [string, number, number, number];
        } else {
          // M/D/YY or M/D/YYYY
          [, month, day, year] = match.map(Number) as [string, number, number, number];
          if (year! < 100) {
            year! += 2000; // Convert YY to YYYY
          }
        }

        const date = new Date(year!, month! - 1, day!);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

// ============================================================================
// CSV TEMPLATE GENERATION
// ============================================================================

export function generateCSVTemplate(): string {
  const header = "title,description,dueDate,priority,status,category,tags";
  const example1 = '"Complete project report","Write final report for Q1 project","2026-03-15","HIGH","TODO","Work","project,important"';
  const example2 = '"Buy groceries","Get items for weekly meal prep","2026-02-07","MEDIUM","TODO","Personal","shopping,weekly"';
  const example3 = '"Call dentist","Schedule annual checkup","","LOW","TODO","Health","appointments"';

  return [header, example1, example2, example3].join("\n");
}
