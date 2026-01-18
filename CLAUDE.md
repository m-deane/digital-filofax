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
- `src/components/ui/` - shadcn/ui components (card, dialog, button, etc.)
- `src/server/api/routers/` - tRPC routers (tasks, habits, memos, ideas, calendar, categories, tags)
- `src/server/auth.ts` - NextAuth configuration (GitHub, Google OAuth)
- `src/server/db.ts` - Prisma client singleton
- `src/types/` - Shared TypeScript types
- `prisma/schema.prisma` - Database schema

### tRPC Pattern
Routers in `src/server/api/routers/` follow this pattern:
```typescript
export const tasksRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.task.findMany({ where: { userId: ctx.session.user.id } });
  }),
  create: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.task.create({ data: { ...input, userId: ctx.session.user.id } });
    }),
});
```

### Database Models
Core models: `User`, `Task`, `Subtask`, `Category`, `Habit`, `HabitLog`, `Memo`, `Tag`, `Idea`, `CalendarEvent`, `GitHubRepo`, `UserPreferences`

Key enums: `TaskStatus` (TODO/IN_PROGRESS/DONE), `Priority` (LOW/MEDIUM/HIGH/URGENT), `HabitType`, `MemoType`, `IdeaStatus`, `EventSource`

### State Management
- **Server state**: tRPC + React Query (automatic caching, invalidation)
- **Client state**: Zustand stores
- **UI state**: React hooks (useState, useReducer)

## Working with This Codebase

### Adding a New Feature
1. Define/update Prisma schema → `npm run db:generate` → `npm run db:push`
2. Create/update tRPC router in `src/server/api/routers/`
3. Add router to `src/server/api/root.ts`
4. Build UI components in `src/app/dashboard/[feature]/`

### Adding UI Components
shadcn/ui components live in `src/components/ui/`. Install new ones with:
```bash
npx shadcn@latest add [component-name]
```

### Authentication
All data is user-scoped. Protected procedures access `ctx.session.user.id` to filter queries.

## Project Conventions

- Planning documents go in `.claude_plans/`
- Tests go in `tests/`
- No mocks/stubs/TODOs - implement complete working code
- Run `npm run lint` and `npm run build` to verify changes
