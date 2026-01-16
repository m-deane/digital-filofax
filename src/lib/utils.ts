import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, isFuture, differenceInDays, addDays, subDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, formatStr: string = "PPP"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, formatStr);
}

export function getWeekDays(date: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const start = startOfWeek(date, { weekStartsOn });
  const end = endOfWeek(date, { weekStartsOn });
  return eachDayOfInterval({ start, end });
}

export function getMonthDays(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
}

export function getCalendarDays(date: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

export function calculateStreak(completedDates: Date[], today: Date = new Date()): { current: number; longest: number } {
  if (completedDates.length === 0) return { current: 0, longest: 0 };

  const sortedDates = [...completedDates].sort((a, b) => b.getTime() - a.getTime());
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Check if today or yesterday is completed for current streak
  const todayCompleted = sortedDates.some(d => isSameDay(d, today));
  const yesterdayCompleted = sortedDates.some(d => isSameDay(d, subDays(today, 1)));

  if (todayCompleted || yesterdayCompleted) {
    currentStreak = 1;
    let checkDate = todayCompleted ? subDays(today, 1) : subDays(today, 2);

    for (const date of sortedDates) {
      if (isSameDay(date, checkDate)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }
    }
  }

  // Calculate longest streak
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = differenceInDays(sortedDates[i - 1], sortedDates[i]);
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return { current: currentStreak, longest: longestStreak };
}

export function getCompletionRate(completedCount: number, totalDays: number): number {
  if (totalDays === 0) return 0;
  return Math.round((completedCount / totalDays) * 100);
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "URGENT":
      return "bg-red-500";
    case "HIGH":
      return "bg-orange-500";
    case "MEDIUM":
      return "bg-yellow-500";
    case "LOW":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "TODO":
      return "bg-slate-500";
    case "IN_PROGRESS":
      return "bg-blue-500";
    case "DONE":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = typeof key === "function" ? key(item) : String(item[key]);
    (result[groupKey] = result[groupKey] || []).push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function sortByDate<T extends { createdAt: Date }>(items: T[], order: "asc" | "desc" = "desc"): T[] {
  return [...items].sort((a, b) => {
    const diff = a.createdAt.getTime() - b.createdAt.getTime();
    return order === "asc" ? diff : -diff;
  });
}

export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export {
  format,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isPast,
  isFuture,
  differenceInDays,
  addDays,
  subDays
};
