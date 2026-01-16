import type {
  Task,
  Category,
  Habit,
  HabitLog,
  Memo,
  Tag,
  Idea,
  CalendarEvent,
  GitHubRepo,
  Subtask,
  UserPreferences,
  TaskStatus,
  Priority,
  HabitType,
  Frequency,
  MemoType,
  IdeaStatus,
  EventSource
} from "@prisma/client";

// Re-export Prisma types
export type {
  Task,
  Category,
  Habit,
  HabitLog,
  Memo,
  Tag,
  Idea,
  CalendarEvent,
  GitHubRepo,
  Subtask,
  UserPreferences,
  TaskStatus,
  Priority,
  HabitType,
  Frequency,
  MemoType,
  IdeaStatus,
  EventSource
};

// Extended types with relations
export type TaskWithRelations = Task & {
  category: Category | null;
  tags: Tag[];
  subtasks: Subtask[];
};

export type HabitWithLogs = Habit & {
  logs: HabitLog[];
  category: Category | null;
};

export type MemoWithTags = Memo & {
  tags: Tag[];
};

export type IdeaWithRelations = Idea & {
  category: Category | null;
  tags: Tag[];
};

export type CalendarEventWithSource = CalendarEvent & {
  sourceLabel: string;
};

// Input types for forms
export type TaskInput = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: Date;
  categoryId?: string;
  tagIds?: string[];
  weekOf?: Date;
  monthOf?: Date;
  recurrenceRule?: string;
};

export type HabitInput = {
  name: string;
  description?: string;
  habitType?: HabitType;
  frequency?: Frequency;
  targetValue?: number;
  unit?: string;
  icon?: string;
  color?: string;
  categoryId?: string;
};

export type MemoInput = {
  title: string;
  content: string;
  memoType?: MemoType;
  isPinned?: boolean;
  tagIds?: string[];
};

export type IdeaInput = {
  title: string;
  description?: string;
  status?: IdeaStatus;
  priority?: number;
  categoryId?: string;
  tagIds?: string[];
};

export type CalendarEventInput = {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  location?: string;
  color?: string;
  recurrenceRule?: string;
};

export type CategoryInput = {
  name: string;
  color?: string;
  icon?: string;
};

export type TagInput = {
  name: string;
  color?: string;
};

// UI State types
export type ViewMode = "list" | "kanban" | "calendar" | "grid";
export type TimeRange = "today" | "week" | "month" | "all";

export type TaskFilters = {
  status?: TaskStatus[];
  priority?: Priority[];
  categoryId?: string;
  tagIds?: string[];
  search?: string;
  timeRange?: TimeRange;
};

export type HabitFilters = {
  habitType?: HabitType[];
  frequency?: Frequency[];
  categoryId?: string;
  showArchived?: boolean;
};

// Dashboard widget types
export type WidgetType =
  | "agenda"
  | "tasks"
  | "habits"
  | "calendar"
  | "github"
  | "meal-plan"
  | "quick-capture"
  | "streaks";

export type WidgetConfig = {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
};

// GitHub types
export type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  created_at: string;
  updated_at: string;
  labels: Array<{ name: string; color: string }>;
};

export type GitHubPullRequest = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  html_url: string;
  created_at: string;
  updated_at: string;
  draft: boolean;
};

// Streak calculation result
export type StreakInfo = {
  current: number;
  longest: number;
  completionRate: number;
  lastCompleted: Date | null;
};

// Calendar event for react-big-calendar
export type CalendarDisplayEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: {
    type: "task" | "event" | "habit";
    color?: string;
    source?: EventSource;
  };
};
