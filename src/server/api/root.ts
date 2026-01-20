import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { tasksRouter } from "@/server/api/routers/tasks";
import { categoriesRouter } from "@/server/api/routers/categories";
import { habitsRouter } from "@/server/api/routers/habits";
import { memosRouter } from "@/server/api/routers/memos";
import { ideasRouter } from "@/server/api/routers/ideas";
import { calendarRouter } from "@/server/api/routers/calendar";
import { tagsRouter } from "@/server/api/routers/tags";
import { expensesRouter } from "@/server/api/routers/expenses";

export const appRouter = createTRPCRouter({
  tasks: tasksRouter,
  categories: categoriesRouter,
  habits: habitsRouter,
  memos: memosRouter,
  ideas: ideasRouter,
  calendar: calendarRouter,
  tags: tagsRouter,
  expenses: expensesRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
