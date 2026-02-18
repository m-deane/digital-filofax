/**
 * Export utility functions for converting data to various formats and triggering downloads
 */

/**
 * Convert an array of objects to CSV format
 * Handles nested objects by flattening them with dot notation
 * Arrays in objects are converted to JSON strings
 */
export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: {
    excludeFields?: string[];
    dateFields?: string[];
  } = {}
): string {
  if (data.length === 0) {
    return "";
  }

  const { excludeFields = [], dateFields = [] } = options;

  // Flatten nested objects and collect all unique keys
  const flattenedData = data.map((item) => flattenObject(item));
  const allKeys = Array.from(
    new Set(flattenedData.flatMap((item) => Object.keys(item)))
  ).filter((key) => !excludeFields.includes(key));

  // Create header row
  const header = allKeys.join(",");

  // Create data rows
  const rows = flattenedData.map((item) => {
    return allKeys
      .map((key) => {
        const value = item[key];

        // Handle null/undefined
        if (value === null || value === undefined) {
          return "";
        }

        // Handle dates
        if (dateFields.includes(key) && value instanceof Date) {
          return `"${value.toISOString()}"`;
        }

        // Handle strings with special characters
        if (typeof value === "string") {
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          if (value.includes(",") || value.includes("\n") || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }

        // Handle numbers and booleans
        if (typeof value === "number" || typeof value === "boolean") {
          return String(value);
        }

        // Handle arrays and objects - convert to JSON
        if (typeof value === "object") {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }

        return String(value);
      })
      .join(",");
  });

  return [header, ...rows].join("\n");
}

/**
 * Flatten nested object with dot notation
 * Arrays are kept as-is (will be JSON stringified later)
 */
function flattenObject(
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      result[newKey] = value;
    } else if (Array.isArray(value)) {
      // Keep arrays as-is (they'll be JSON stringified in CSV)
      result[newKey] = value;
    } else if (
      typeof value === "object" &&
      !(value instanceof Date) &&
      Object.keys(value).length > 0
    ) {
      // Recursively flatten nested objects
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Convert data to formatted JSON string
 */
export function convertToJSON<T>(data: T, options: { pretty?: boolean } = {}): string {
  const { pretty = true } = options;

  if (pretty) {
    return JSON.stringify(data, null, 2);
  }

  return JSON.stringify(data);
}

/**
 * Trigger browser download of data as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType = "application/octet-stream"
): void {
  // Create a Blob from the content
  const blob = new Blob([content], { type: mimeType });

  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element and trigger download
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a timestamp-based filename
 */
export function generateExportFilename(
  baseName: string,
  extension: string,
  includeTimestamp = true
): string {
  if (!includeTimestamp) {
    return `${baseName}.${extension}`;
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace(/T/, "_")
    .slice(0, -5); // Remove milliseconds and Z

  return `${baseName}_${timestamp}.${extension}`;
}

/**
 * Export helper that combines conversion and download
 */
export function exportAsJSON<T>(data: T, baseName: string): void {
  const json = convertToJSON(data);
  const filename = generateExportFilename(baseName, "json");
  downloadFile(json, filename, "application/json");
}

/**
 * Export helper that combines conversion and download for CSV
 */
export function exportAsCSV<T extends Record<string, unknown>>(
  data: T[],
  baseName: string,
  options?: Parameters<typeof convertToCSV>[1]
): void {
  const csv = convertToCSV(data, options);
  const filename = generateExportFilename(baseName, "csv");
  downloadFile(csv, filename, "text/csv");
}

/**
 * Prepare tasks data for CSV export by flattening nested relations
 */
export function prepareTasksForCSV<
  T extends {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate?: Date | null;
    completedAt?: Date | null;
    category?: { name: string } | null;
    context?: { name: string } | null;
    tags?: Array<{ name: string }>;
    subtasks?: Array<{ title: string; completed: boolean }>;
    createdAt: Date;
    updatedAt: Date;
  }
>(tasks: T[]): Record<string, unknown>[] {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString(),
    completedAt: task.completedAt?.toISOString(),
    category: task.category?.name,
    context: task.context?.name,
    tags: task.tags?.map((t) => t.name).join(", "),
    subtaskCount: task.subtasks?.length ?? 0,
    subtasks: task.subtasks?.map((s) => s.title).join("; "),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }));
}

/**
 * Prepare habits data for CSV export
 */
export function prepareHabitsForCSV<
  T extends {
    id: string;
    name: string;
    description?: string | null;
    habitType: string;
    frequency: string;
    targetValue?: number | null;
    unit?: string | null;
    category?: { name: string } | null;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    logs?: Array<{ date: Date; value?: number | null }>;
  }
>(habits: T[]): Record<string, unknown>[] {
  return habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    description: habit.description,
    habitType: habit.habitType,
    frequency: habit.frequency,
    targetValue: habit.targetValue,
    unit: habit.unit,
    category: habit.category?.name,
    isArchived: habit.isArchived,
    logCount: habit.logs?.length ?? 0,
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString(),
  }));
}

/**
 * Prepare memos data for CSV export
 */
export function prepareMemosForCSV<
  T extends {
    id: string;
    title: string;
    content: string;
    memoType: string;
    isPinned: boolean;
    isArchived: boolean;
    tags?: Array<{ name: string }>;
    createdAt: Date;
    updatedAt: Date;
  }
>(memos: T[]): Record<string, unknown>[] {
  return memos.map((memo) => ({
    id: memo.id,
    title: memo.title,
    content: memo.content,
    memoType: memo.memoType,
    isPinned: memo.isPinned,
    isArchived: memo.isArchived,
    tags: memo.tags?.map((t) => t.name).join(", "),
    createdAt: memo.createdAt.toISOString(),
    updatedAt: memo.updatedAt.toISOString(),
  }));
}

/**
 * Prepare contacts data for CSV export
 */
export function prepareContactsForCSV<
  T extends {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    birthday?: Date | null;
    notes?: string | null;
    isFavorite: boolean;
    category?: { name: string } | null;
    createdAt: Date;
    updatedAt: Date;
  }
>(contacts: T[]): Record<string, unknown>[] {
  return contacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    address: contact.address,
    company: contact.company,
    jobTitle: contact.jobTitle,
    birthday: contact.birthday?.toISOString(),
    notes: contact.notes,
    isFavorite: contact.isFavorite,
    category: contact.category?.name,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  }));
}
