# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Personal Organization App** - A comprehensive web-based personal organization system (digital Filofax) for managing tasks, habits, calendar events, memos, and ideas.

**Stack**: Next.js 15 (App Router) + TypeScript + tRPC + Prisma + NextAuth + Tailwind/shadcn + PostgreSQL (Supabase)

## Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check

# Database
npm run db:generate  # Generate Prisma client after schema changes
npm run db:push      # Push schema to database (use for development)
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed database (tsx prisma/seed.ts)
```

## Architecture

### Data Flow
```
React Components → tRPC hooks → tRPC routers → Prisma → PostgreSQL
```

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/app/dashboard/` - Protected dashboard routes (tasks, habits, memos, ideas, planner)
- `src/components/ui/` - shadcn/ui components (card, dialog, button, etc.)
- `src/components/layout/` - Sidebar and Header components
- `src/server/api/routers/` - tRPC routers (tasks, habits, memos, ideas, calendar, categories, tags)
- `src/server/auth.ts` - NextAuth configuration (GitHub, Google OAuth + dev bypass)
- `src/server/db.ts` - Prisma client singleton
- `src/lib/trpc.ts` - tRPC React hooks (`api` object)
- `src/lib/providers.tsx` - Client providers (tRPC, QueryClient, Theme, Session)
- `src/types/` - Shared TypeScript types and Zod input schemas
- `prisma/schema.prisma` - Database schema

### tRPC Usage in Components
```typescript
// Query data
const { data: tasks, isLoading } = api.tasks.getAll.useQuery({ status: "TODO" });

// Mutate data with cache invalidation
const utils = api.useUtils();
const createTask = api.tasks.create.useMutation({
  onSuccess: () => utils.tasks.getAll.invalidate(),
});
```

### tRPC Router Pattern
Routers in `src/server/api/routers/` follow this pattern:
```typescript
export const tasksRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ status: z.nativeEnum(TaskStatus).optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.task.findMany({
        where: { userId: ctx.session.user.id, status: input.status },
        include: { category: true, tags: true, subtasks: true },
      });
    }),
  create: protectedProcedure
    .input(z.object({ title: z.string(), priority: z.nativeEnum(Priority).optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.task.create({ data: { ...input, userId: ctx.session.user.id } });
    }),
});
```

### Database Models
Core models: `User`, `Task`, `Subtask`, `Category`, `Habit`, `HabitLog`, `Memo`, `Tag`, `Idea`, `CalendarEvent`, `GitHubRepo`, `UserPreferences`

Key enums: `TaskStatus` (TODO/IN_PROGRESS/DONE), `Priority` (LOW/MEDIUM/HIGH/URGENT), `HabitType` (BOOLEAN/NUMERIC/DURATION), `MemoType` (NOTE/ANECDOTE/JOURNAL/MEETING/QUICK_THOUGHT), `IdeaStatus` (NEW/EXPLORING/IN_PROGRESS/IMPLEMENTED/ARCHIVED), `EventSource` (INTERNAL/GOOGLE_CALENDAR/GITHUB)

### State Management
- **Server state**: tRPC + React Query (automatic caching, invalidation)
- **Client state**: Zustand stores (when needed)
- **UI state**: React hooks (useState, useReducer)

## Working with This Codebase

### Adding a New Feature
1. Define/update Prisma schema → `npm run db:generate` → `npm run db:push`
2. Create/update tRPC router in `src/server/api/routers/`
3. Add router to `src/server/api/root.ts`
4. Build UI components in `src/app/dashboard/[feature]/`
5. Wire up with `api.[router].[procedure].useQuery()` or `useMutation()`

### Adding UI Components
shadcn/ui components live in `src/components/ui/`. Install new ones with:
```bash
npx shadcn@latest add [component-name]
```

### Authentication
- All data is user-scoped via `ctx.session.user.id` in protected procedures
- Providers: GitHub OAuth, Google OAuth (with Calendar API scope)
- Dev bypass: Set `DEV_AUTH_BYPASS=true` in `.env` for local testing without OAuth

### Path Alias
Use `@/` to import from `src/`:
```typescript
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
```

## Project Conventions

- Planning documents go in `.claude_plans/`
- Tests go in `tests/` (Python-based E2E tests)
- No mocks/stubs/TODOs - implement complete working code
- Run `npm run lint` and `npm run build` to verify changes
