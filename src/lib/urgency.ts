import { startOfDay, isAfter, isBefore, addDays, differenceInDays } from "date-fns";
import type { Priority } from "@prisma/client";

/**
 * Check if a date is overdue (past today)
 */
export function isOverdue(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return false;
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  return isBefore(due, today);
}

/**
 * Check if a date is due today
 */
export function isDueToday(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return false;
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  return due.getTime() === today.getTime();
}

/**
 * Check if a date is due within the next N days (default 3)
 */
export function isDueSoon(dueDate: Date | null | undefined, days: number = 3): boolean {
  if (!dueDate) return false;
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const threshold = addDays(today, days);
  return isAfter(due, today) && isBefore(due, threshold);
}

/**
 * Get the number of days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate: Date | null | undefined): number | null {
  if (!dueDate) return null;
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  return differenceInDays(due, today);
}

/**
 * Urgency levels for styling
 */
export type UrgencyLevel = "critical" | "high" | "medium" | "low" | "none";

/**
 * Calculate urgency level based on due date and priority
 */
export function getUrgencyLevel(task: {
  dueDate?: Date | null;
  priority?: Priority | null;
  status?: string;
}): UrgencyLevel {
  // Completed tasks have no urgency
  if (task.status === "DONE") {
    return "none";
  }

  const overdue = isOverdue(task.dueDate);
  const dueToday = isDueToday(task.dueDate);
  const dueSoon = isDueSoon(task.dueDate);
  const priority = task.priority;

  // Critical: Overdue tasks
  if (overdue) {
    return "critical";
  }

  // High: Due today OR urgent priority
  if (dueToday || priority === "URGENT") {
    return "high";
  }

  // Medium: Due soon (within 3 days) OR high priority
  if (dueSoon || priority === "HIGH") {
    return "medium";
  }

  // Low: Has a due date in the future OR medium priority
  if (task.dueDate || priority === "MEDIUM") {
    return "low";
  }

  // None: No due date and low/no priority
  return "none";
}

/**
 * Get Tailwind color classes for urgency level
 */
export function getUrgencyColor(level: UrgencyLevel): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  hover: string;
} {
  switch (level) {
    case "critical":
      return {
        bg: "bg-red-50 dark:bg-red-950/20",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-500",
        badge: "bg-red-500 text-white",
        hover: "hover:bg-red-100 dark:hover:bg-red-950/30",
      };
    case "high":
      return {
        bg: "bg-orange-50 dark:bg-orange-950/20",
        text: "text-orange-700 dark:text-orange-400",
        border: "border-orange-500",
        badge: "bg-orange-500 text-white",
        hover: "hover:bg-orange-100 dark:hover:bg-orange-950/30",
      };
    case "medium":
      return {
        bg: "bg-yellow-50 dark:bg-yellow-950/20",
        text: "text-yellow-700 dark:text-yellow-400",
        border: "border-yellow-500",
        badge: "bg-yellow-500 text-white",
        hover: "hover:bg-yellow-100 dark:hover:bg-yellow-950/30",
      };
    case "low":
      return {
        bg: "bg-gray-50 dark:bg-gray-950/20",
        text: "text-gray-700 dark:text-gray-400",
        border: "border-gray-300",
        badge: "bg-gray-500 text-white",
        hover: "hover:bg-gray-100 dark:hover:bg-gray-950/30",
      };
    default:
      return {
        bg: "",
        text: "",
        border: "border-border",
        badge: "bg-muted text-muted-foreground",
        hover: "hover:bg-muted/50",
      };
  }
}

/**
 * Get urgency text label for display
 */
export function getUrgencyLabel(task: {
  dueDate?: Date | null;
  priority?: Priority | null;
  status?: string;
}): string | null {
  if (task.status === "DONE") {
    return null;
  }

  const daysUntil = getDaysUntilDue(task.dueDate);

  if (daysUntil === null) {
    return null;
  }

  if (daysUntil < 0) {
    const daysOverdue = Math.abs(daysUntil);
    return daysOverdue === 1 ? "Overdue by 1 day" : `Overdue by ${daysOverdue} days`;
  }

  if (daysUntil === 0) {
    return "Due today";
  }

  if (daysUntil === 1) {
    return "Due tomorrow";
  }

  if (daysUntil <= 7) {
    return `Due in ${daysUntil} days`;
  }

  return null;
}

/**
 * Get priority indicator (!, !!, !!!)
 */
export function getPriorityIndicator(priority: Priority | null | undefined): string {
  switch (priority) {
    case "URGENT":
      return "!!!";
    case "HIGH":
      return "!!";
    case "MEDIUM":
      return "!";
    default:
      return "";
  }
}

/**
 * Get priority color class
 */
export function getPriorityColor(priority: Priority | null | undefined): string {
  switch (priority) {
    case "URGENT":
      return "text-red-600 dark:text-red-400";
    case "HIGH":
      return "text-orange-600 dark:text-orange-400";
    case "MEDIUM":
      return "text-yellow-600 dark:text-yellow-400";
    case "LOW":
      return "text-gray-500 dark:text-gray-400";
    default:
      return "text-muted-foreground";
  }
}
