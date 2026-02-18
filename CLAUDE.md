# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Personal Organization App** - A web-based personal organization system (digital Filofax) for managing tasks, habits, calendar events, memos, and ideas.

**Stack**: Next.js 15 (App Router) + TypeScript + tRPC + Prisma + NextAuth + Tailwind/shadcn + PostgreSQL (Supabase)

## Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check

# Database
npm run db:generate  # Generate Prisma client after schema changes
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed database

# Add shadcn components
npx shadcn@latest add [component-name]
```

## Architecture

**Data Flow**: React Components → tRPC hooks (`api.*`) → tRPC routers → Prisma → PostgreSQL

**Key Directories**:
- `src/app/dashboard/` - Protected dashboard routes
- `src/server/api/routers/` - tRPC routers (all user-scoped)
- `src/components/ui/` - shadcn/ui components
- `src/lib/trpc.ts` - tRPC React hooks (`api` object)
- `src/types/` - Shared TypeScript types and Zod schemas
- `prisma/schema.prisma` - Database schema

**Core Models**: User, Task, Subtask, Category, Habit, HabitLog, Memo, Tag, Idea, CalendarEvent, GitHubRepo, UserPreferences

**Enums**: TaskStatus (TODO/IN_PROGRESS/DONE), Priority (LOW/MEDIUM/HIGH/URGENT), HabitType, MemoType, IdeaStatus, EventSource

## Critical Patterns

### tRPC Router (all queries must be user-scoped)
```typescript
export const exampleRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ /* filters */ }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.model.findMany({
        where: { userId: ctx.session.user.id, ...input },
        include: { /* related models */ },
      });
    }),
});
```

### Component with tRPC
```typescript
"use client";
import { api } from "@/lib/trpc";

export function MyComponent() {
  const { data, isLoading } = api.router.getAll.useQuery();
  const utils = api.useUtils();
  const mutation = api.router.create.useMutation({
    onSuccess: () => utils.router.getAll.invalidate(),
  });
}
```

## Adding Features

1. Schema: Edit `prisma/schema.prisma` → `npm run db:generate` → `npm run db:push`
2. Router: Create in `src/server/api/routers/`, add to `src/server/api/root.ts`
3. UI: Build in `src/app/dashboard/[feature]/`, wire with `api.[router].[procedure]`

## Authentication

- All data user-scoped via `ctx.session.user.id` in protected procedures
- Dev bypass: `DEV_AUTH_BYPASS=true` in `.env`

## Project Conventions

- Planning documents: `.claude_plans/`
- Tests: `tests/` (Python E2E)
- Path alias: `@/` imports from `src/`
- Verify changes: `npm run lint && npm run build`
- No mocks/stubs/TODOs - implement complete working code
