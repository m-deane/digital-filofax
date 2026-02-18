import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { tasksRouter } from "@/server/api/routers/tasks";
import { categoriesRouter } from "@/server/api/routers/categories";
import { contextsRouter } from "@/server/api/routers/contexts";
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
import { reviewRouter } from "@/server/api/routers/review";
import { yearlyRouter } from "@/server/api/routers/yearly";
import { templatesRouter } from "@/server/api/routers/templates";
import { visionRouter } from "@/server/api/routers/vision";
import { financeRouter } from "@/server/api/routers/finance";
import { somedayRouter } from "@/server/api/routers/someday";
import { journalRouter } from "@/server/api/routers/journal";
import { rolesRouter } from "@/server/api/routers/roles";
import { githubRouter } from "@/server/api/routers/github";
import { searchRouter } from "@/server/api/routers/search";
import { exportRouter } from "@/server/api/routers/export";
import { analyticsRouter } from "@/server/api/routers/analytics";
import { importRouter } from "@/server/api/routers/import";
import { collaborationRouter } from "@/server/api/routers/collaboration";
import { suggestionsRouter } from "@/server/api/routers/suggestions";

export const appRouter = createTRPCRouter({
  tasks: tasksRouter,
  categories: categoriesRouter,
  contexts: contextsRouter,
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
  review: reviewRouter,
  yearly: yearlyRouter,
  templates: templatesRouter,
  vision: visionRouter,
  finance: financeRouter,
  someday: somedayRouter,
  journal: journalRouter,
  roles: rolesRouter,
  github: githubRouter,
  search: searchRouter,
  export: exportRouter,
  analytics: analyticsRouter,
  import: importRouter,
  collaboration: collaborationRouter,
  suggestions: suggestionsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
