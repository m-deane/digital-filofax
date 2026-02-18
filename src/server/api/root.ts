import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { tasksRouter } from "@/server/api/routers/tasks";
import { categoriesRouter } from "@/server/api/routers/categories";
import { habitsRouter } from "@/server/api/routers/habits";
import { memosRouter } from "@/server/api/routers/memos";
import { ideasRouter } from "@/server/api/routers/ideas";
import { calendarRouter } from "@/server/api/routers/calendar";
import { tagsRouter } from "@/server/api/routers/tags";
import { preferencesRouter } from "@/server/api/routers/preferences";
import { dailyRouter } from "@/server/api/routers/daily";
import { focusRouter } from "@/server/api/routers/focus";
import { goalsRouter } from "@/server/api/routers/goals";
import { contactsRouter } from "@/server/api/routers/contacts";
import { reflectionsRouter } from "@/server/api/routers/reflections";

export const appRouter = createTRPCRouter({
  tasks: tasksRouter,
  categories: categoriesRouter,
  habits: habitsRouter,
  memos: memosRouter,
  ideas: ideasRouter,
  calendar: calendarRouter,
  tags: tagsRouter,
  preferences: preferencesRouter,
  daily: dailyRouter,
  focus: focusRouter,
  goals: goalsRouter,
  contacts: contactsRouter,
  reflections: reflectionsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
