# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Digital Filofax** - A web-based personal organization system for managing tasks, habits, calendar events, memos, ideas, finance, contacts, goals, reflections, and more.

**Stack**: Next.js 15 (App Router) + TypeScript + tRPC v11 RC + Prisma 6 + NextAuth v5 beta + Tailwind/shadcn + PostgreSQL (Supabase)

**Scale**: 38 pages, 30 tRPC routers, 38 Prisma models (1144-line schema), 320 tests

## Commands

```bash
# Development
npm run dev              # Dev server with Turbopack (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint

# Testing (vitest)
npm test                 # Run all 320 tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npx vitest run tests/routers/tasks.test.ts          # Single file
npx vitest run -t "should create a task"             # Single test by name

# Database
npm run db:generate      # Regenerate Prisma client after schema changes
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database

# Dev with auth bypass (no OAuth needed)
DEV_AUTH_BYPASS=true npm run dev
```

## Architecture

**Data Flow**: React Components → tRPC hooks (`api.*`) → tRPC routers (`protectedProcedure`) → Prisma → PostgreSQL

**Key Directories**:
- `src/app/dashboard/` - All protected dashboard routes (25+ feature pages)
- `src/server/api/routers/` - 29 tRPC router files (registered in `root.ts`)
- `src/server/api/trpc.ts` - tRPC context, middleware, procedure definitions
- `src/components/ui/` - shadcn/ui base components
- `src/lib/` - Utilities (trpc.ts hooks, modules.ts, urgency.ts, import/export)
- `src/types/index.ts` - Shared TypeScript types and Zod schemas
- `prisma/schema.prisma` - Full database schema
- `tests/` - All test files (vitest)
- `.claude_plans/` - Planning documents and review reports

**Router Structure** (30 routers in `src/server/api/root.ts`):
Tasks, categories, contexts, habits, memos, ideas, calendar, tags, preferences, daily, focus, goals, contacts, reflections, review, yearly (nested sub-routers: `yearly.goals.*`, `yearly.reflection.*`), templates, vision, finance, someday, journal, roles, github, search, export, analytics, import, collaboration, suggestions

**Path Alias**: `@/` maps to `src/`

## Critical Patterns

### All queries MUST be user-scoped
```typescript
// Every query filters by userId from session
where: { userId: ctx.session.user.id, ...filters }
```

### All errors must use TRPCError
```typescript
import { TRPCError } from "@trpc/server";
throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
// NEVER: throw new Error("Task not found")
```

### All Zod string inputs must have .max() bounds
```typescript
z.string().max(500)       // search fields
z.string().max(5000)      // notes/descriptions
z.array(z.string().max(1000)).max(50)  // string arrays
```

### Component pattern with cache invalidation
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

### Prisma query patterns
- Use `include` for related data (avoid N+1)
- Use `orderBy` for consistent ordering
- Use `$transaction` / `Promise.all` for multi-model operations
- Use `updateMany` with `userId` in where clause for secure bulk updates

## Adding Features

1. **Schema**: Edit `prisma/schema.prisma` → `npm run db:generate` → `npm run db:push`
2. **Router**: Create in `src/server/api/routers/`, register in `src/server/api/root.ts`
3. **Module**: Add module ID to `src/lib/modules.ts` if feature should be toggleable
4. **UI**: Build page in `src/app/dashboard/[feature]/page.tsx`
5. **Wire**: Connect with `api.[router].[procedure].useQuery/useMutation()`

## Testing

**Framework**: vitest 4.0.18 with mocked Prisma client

**Test structure**: Tests simulate router logic by calling mock Prisma methods directly and verifying correct arguments (user scoping, ownership checks, etc.)

**Key files**:
- `tests/helpers.ts` - `createMockContext()`, `createMockPrismaClient()`, test user constants
- `tests/routers/*.test.ts` - Router tests (tasks, habits, goals, daily, collaboration, finance, contacts, reflections, calendar)
- `tests/lib/*.test.ts` - Utility tests (import, export, modules)
- `vitest.config.ts` - Config with `@/` path alias, v8 coverage provider

**Mocks required in every router test file**:
```typescript
vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
```

## Authentication

- `protectedProcedure` enforces authentication - throws `UNAUTHORIZED` if no session
- All user data filtered by `ctx.session.user.id`
- Providers: GitHub OAuth, Google OAuth, Credentials (dev only)
- Dev bypass: `DEV_AUTH_BYPASS=true` skips OAuth, uses a seeded dev user
- NextAuth v5 beta with PrismaAdapter (database sessions in prod, JWT in dev)

## Known Trade-offs

- `z.any()` in preferences.ts (dashboardLayout) and templates.ts (content) - required for Prisma Json field spread compatibility
- `any` type for editingTask in `tasks/page.tsx` and GoalData in `goals/page.tsx` - intentionally simplified for UI
- `github.ts` getIssues/getPullRequests/getStats return empty arrays with `integrationRequired: true` (awaiting GitHub OAuth integration)
- `suggestions.ts` uses rule-based heuristics, not actual AI

## Troubleshooting

- **Dev server MODULE_NOT_FOUND errors**: Clear `.next` cache: `rm -rf .next && npm run dev`
- **Dev server crash (exit 144)**: Kill process and restart: `lsof -ti :3000 | xargs kill -9`
- **Prisma client out of date**: Run `npm run db:generate` after any schema changes

## Workflow Rules

- Always verify changes: `npm run lint && npm run build`
- All tests must pass: `npm test` (320 tests)
- No mocks, stubs, TODOs, or placeholder implementations
- Planning documents go in `.claude_plans/`
- Never modify `.env` files, `node_modules/`, `.git/`, `.next/`
