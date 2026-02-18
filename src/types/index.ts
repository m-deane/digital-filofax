import type {
  Task,
  Category,
  Context,
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
  EventSource,
  Contact,
  ContactCategory,
  DailyReflection,
  MonthlyReflection,
  Template,
  TemplateType,
  GratitudeEntry,
  MoodEntry,
  MoodLevel,
  ImportLog,
  ImportSource,
  AISuggestion,
  SuggestionType
} from "@prisma/client";

// Re-export Prisma types
export type {
  Task,
  Category,
  Context,
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
  EventSource,
  Contact,
  ContactCategory,
  DailyReflection,
  MonthlyReflection,
  Template,
  TemplateType,
  GratitudeEntry,
  MoodEntry,
  MoodLevel,
  ImportLog,
  ImportSource,
  AISuggestion,
  SuggestionType
};

// Extended types with relations
export type ContactWithCategory = Contact & {
  category: ContactCategory | null;
};

// ============================================================================
// LIFE ROLES (Franklin Covey)
// ============================================================================

import type { LifeRole as PrismaLifeRole, WeeklyBigRock as PrismaWeeklyBigRock } from "@prisma/client";

// Re-export from Prisma
export type LifeRole = PrismaLifeRole;
export type WeeklyBigRock = PrismaWeeklyBigRock;

// Vision Board types
export type VisionBoard = {
  id: string;
  name: string;
  year: number | null;
  isDefault: boolean;
  bgColor: string;
  bgImage: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type VisionItemType = "IMAGE" | "TEXT" | "GOAL" | "AFFIRMATION";

export type VisionItem = {
  id: string;
  type: VisionItemType;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string | null;
  boardId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type VisionBoardWithItems = VisionBoard & {
  items: VisionItem[];
};

// ============================================================================
// SEARCH TYPES
// ============================================================================

export type {
  SearchResult,
  SearchResultType,
  TaskSearchResult,
  MemoSearchResult,
  IdeaSearchResult,
  HabitSearchResult,
  EventSearchResult,
  ContactSearchResult,
} from "@/server/api/routers/search";
