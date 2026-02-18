import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

// Result type discriminators
export type SearchResultType = "task" | "memo" | "idea" | "habit" | "event" | "contact";

export interface BaseSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  snippet?: string;
  category?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskSearchResult extends BaseSearchResult {
  type: "task";
  status: string;
  priority: string;
  dueDate?: Date;
}

export interface MemoSearchResult extends BaseSearchResult {
  type: "memo";
  memoType: string;
  isPinned: boolean;
}

export interface IdeaSearchResult extends BaseSearchResult {
  type: "idea";
  status: string;
}

export interface HabitSearchResult extends BaseSearchResult {
  type: "habit";
  frequency: string;
  icon?: string;
}

export interface EventSearchResult extends BaseSearchResult {
  type: "event";
  startDate: Date;
  endDate: Date;
  location?: string;
}

export interface ContactSearchResult extends BaseSearchResult {
  type: "contact";
  email?: string;
  phone?: string;
  company?: string;
}

export type SearchResult =
  | TaskSearchResult
  | MemoSearchResult
  | IdeaSearchResult
  | HabitSearchResult
  | EventSearchResult
  | ContactSearchResult;

export const searchRouter = createTRPCRouter({
  globalSearch: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(500),
        types: z.array(z.enum(["task", "memo", "idea", "habit", "event", "contact"])).optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, types, limit } = input;
      const userId = ctx.session.user.id;

      // Build search filter for case-insensitive partial match
      const searchFilter = {
        contains: query,
        mode: "insensitive" as const,
      };

      // Run all applicable searches in parallel instead of sequentially
      const searchPromises: Array<Promise<SearchResult[]>> = [];

      if (!types || types.includes("task")) {
        searchPromises.push(
          ctx.db.task.findMany({
            where: {
              userId,
              OR: [
                { title: searchFilter },
                { description: searchFilter },
              ],
            },
            include: { category: true },
            take: limit,
            orderBy: { updatedAt: "desc" },
          }).then((tasks) =>
            tasks.map((task): TaskSearchResult => ({
              id: task.id,
              type: "task",
              title: task.title,
              snippet: task.description?.substring(0, 150),
              category: task.category?.name,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate ?? undefined,
              metadata: { categoryColor: task.category?.color },
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
            }))
          )
        );
      }

      if (!types || types.includes("memo")) {
        searchPromises.push(
          ctx.db.memo.findMany({
            where: {
              userId,
              isArchived: false,
              OR: [
                { title: searchFilter },
                { content: searchFilter },
              ],
            },
            take: limit,
            orderBy: { updatedAt: "desc" },
          }).then((memos) =>
            memos.map((memo): MemoSearchResult => ({
              id: memo.id,
              type: "memo",
              title: memo.title,
              snippet: memo.content.substring(0, 150),
              memoType: memo.memoType,
              isPinned: memo.isPinned,
              createdAt: memo.createdAt,
              updatedAt: memo.updatedAt,
            }))
          )
        );
      }

      if (!types || types.includes("idea")) {
        searchPromises.push(
          ctx.db.idea.findMany({
            where: {
              userId,
              OR: [
                { title: searchFilter },
                { description: searchFilter },
              ],
            },
            include: { category: true },
            take: limit,
            orderBy: { updatedAt: "desc" },
          }).then((ideas) =>
            ideas.map((idea): IdeaSearchResult => ({
              id: idea.id,
              type: "idea",
              title: idea.title,
              snippet: idea.description?.substring(0, 150),
              category: idea.category?.name,
              status: idea.status,
              metadata: {
                categoryColor: idea.category?.color,
                priority: idea.priority,
              },
              createdAt: idea.createdAt,
              updatedAt: idea.updatedAt,
            }))
          )
        );
      }

      if (!types || types.includes("habit")) {
        searchPromises.push(
          ctx.db.habit.findMany({
            where: {
              userId,
              isArchived: false,
              name: searchFilter,
            },
            include: { category: true },
            take: limit,
            orderBy: { updatedAt: "desc" },
          }).then((habits) =>
            habits.map((habit): HabitSearchResult => ({
              id: habit.id,
              type: "habit",
              title: habit.name,
              snippet: habit.description ?? undefined,
              category: habit.category?.name,
              frequency: habit.frequency,
              icon: habit.icon ?? undefined,
              metadata: {
                categoryColor: habit.category?.color,
                color: habit.color,
              },
              createdAt: habit.createdAt,
              updatedAt: habit.updatedAt,
            }))
          )
        );
      }

      if (!types || types.includes("event")) {
        searchPromises.push(
          ctx.db.calendarEvent.findMany({
            where: {
              userId,
              OR: [
                { title: searchFilter },
                { description: searchFilter },
                { location: searchFilter },
              ],
            },
            take: limit,
            orderBy: { startDate: "desc" },
          }).then((events) =>
            events.map((event): EventSearchResult => ({
              id: event.id,
              type: "event",
              title: event.title,
              snippet: event.description ?? undefined,
              startDate: event.startDate,
              endDate: event.endDate,
              location: event.location ?? undefined,
              metadata: {
                allDay: event.allDay,
                color: event.color,
              },
              createdAt: event.createdAt,
              updatedAt: event.updatedAt,
            }))
          )
        );
      }

      if (!types || types.includes("contact")) {
        searchPromises.push(
          ctx.db.contact.findMany({
            where: {
              userId,
              OR: [
                { name: searchFilter },
                { email: searchFilter },
                { company: searchFilter },
                { jobTitle: searchFilter },
                { notes: searchFilter },
              ],
            },
            include: { category: true },
            take: limit,
            orderBy: { name: "asc" },
          }).then((contacts) =>
            contacts.map((contact): ContactSearchResult => ({
              id: contact.id,
              type: "contact",
              title: contact.name,
              snippet: contact.notes?.substring(0, 150),
              category: contact.category?.name,
              email: contact.email ?? undefined,
              phone: contact.phone ?? undefined,
              company: contact.company ?? undefined,
              metadata: {
                categoryColor: contact.category?.color,
                isFavorite: contact.isFavorite,
                jobTitle: contact.jobTitle,
              },
              createdAt: contact.createdAt,
              updatedAt: contact.updatedAt,
            }))
          )
        );
      }

      const allResults = await Promise.all(searchPromises);
      const results: SearchResult[] = allResults.flat();

      // Sort all results by relevance (updated date)
      results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      // Limit total results
      return {
        results: results.slice(0, limit),
        totalCount: results.length,
        query,
      };
    }),

});
