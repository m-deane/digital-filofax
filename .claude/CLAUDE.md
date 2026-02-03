# PROJECT CONTEXT & CORE DIRECTIVES

## Project Overview

**Personal Organization App (Digital Filofax)** - A comprehensive web-based personal organization system for managing tasks, habits, calendar events, memos, and ideas with user-scoped data isolation.

**Technology Stack**: Next.js 15 (App Router) + TypeScript + tRPC + Prisma + NextAuth.js + Tailwind CSS/shadcn/ui + PostgreSQL (Supabase)

**Architecture**: Full-stack monolith with type-safe API layer (tRPC) and ORM (Prisma)

## WORKFLOW - Core Guidelines

- Never use mock data, results or workarounds
- Implement tests after every checkpoint and verify all tests pass
- Only update progress and create planning documents in `.claude_plans/`
- Write all tests to the `tests/` folder
- Do not leave files in the root directory - sort into appropriate folders
- Always run `npm run lint` and `npm run build` to verify changes before completing

## SYSTEM-LEVEL OPERATING PRINCIPLES

### Core Implementation Philosophy
- DIRECT IMPLEMENTATION ONLY: Generate complete, working code
- NO PARTIAL IMPLEMENTATIONS: Eliminate mocks, stubs, TODOs, or placeholder functions
- All data queries must be user-scoped via `ctx.session.user.id`
- Use tRPC + React Query for all server state management

### Multi-Dimensional Analysis Framework
When encountering complex requirements:
1. **Technical feasibility**: Can this be done with tRPC/Prisma/Next.js patterns?
2. **Edge cases**: What happens with empty data, invalid inputs, unauthorized access?
3. **Performance**: Are we including proper relations? N+1 query risks?
4. **Integration**: Does this affect existing routers or components?

## ANTI-PATTERN ELIMINATION

### Prohibited Implementation Patterns
- Mock functions or placeholder data structures
- Incomplete error handling or validation
- Queries without user scoping (`userId: ctx.session.user.id`)
- Direct database access outside tRPC routers
- Using `any` type when proper types exist in `src/types/`

### Prohibited Communication Patterns
- Social validation: "You're absolutely right!", "Great question!"
- Hedging language: "might", "could potentially", "perhaps"
- Excessive explanation of obvious concepts

## PROJECT-SPECIFIC GUIDELINES

### File Structure & Boundaries

**SAFE TO MODIFY**:
- `src/app/` - Next.js pages and API routes
- `src/components/` - React components
- `src/server/api/routers/` - tRPC routers
- `src/lib/` - Utility functions and providers
- `src/types/` - TypeScript types and Zod schemas
- `prisma/schema.prisma` - Database schema
- `tests/` - Test files

**NEVER MODIFY**:
- `node_modules/` - Dependencies
- `.git/` - Version control
- `.next/` - Build output
- `.env` files - Environment variables (reference only)

### Code Style & Architecture Standards

**TypeScript Conventions**:
- Variables/functions: camelCase
- Types/interfaces/classes: PascalCase
- Constants: SCREAMING_SNAKE_CASE
- Files: kebab-case.ts or camelCase.ts

**tRPC Router Pattern**:
```typescript
export const exampleRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ /* optional filters */ }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.model.findMany({
        where: { userId: ctx.session.user.id, ...input },
        include: { /* related models */ },
        orderBy: { createdAt: "desc" },
      });
    }),
  create: protectedProcedure
    .input(CreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.model.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),
});
```

**Component Pattern with tRPC**:
```typescript
"use client";
import { api } from "@/lib/trpc";

export function MyComponent() {
  const { data, isLoading } = api.router.procedure.useQuery();
  const utils = api.useUtils();

  const mutation = api.router.create.useMutation({
    onSuccess: () => utils.router.getAll.invalidate(),
  });

  if (isLoading) return <div>Loading...</div>;
  return /* JSX */;
}
```

**Prisma Query Patterns**:
- Always filter by `userId` for user-scoped data
- Use `include` for related data to avoid N+1 queries
- Use `orderBy` for consistent ordering
- Use transactions for multi-model operations

### Database Schema Changes
1. Edit `prisma/schema.prisma`
2. Run `npm run db:generate` to update Prisma client
3. Run `npm run db:push` to apply changes to database
4. Update relevant tRPC router if needed
5. Update TypeScript types in `src/types/` if needed

### Adding New Features
1. Schema: Add/update models in `prisma/schema.prisma`
2. Router: Create/update router in `src/server/api/routers/`
3. Root: Add router to `src/server/api/root.ts` if new
4. Types: Add input schemas to `src/types/index.ts` if complex
5. UI: Build components in `src/app/dashboard/[feature]/`
6. Wire: Connect UI to API with `api.[router].[procedure].useQuery/useMutation()`

### Authentication Context
- `protectedProcedure` ensures user is authenticated
- Access user ID via `ctx.session.user.id`
- All user data must be filtered by this ID
- Dev bypass available with `DEV_AUTH_BYPASS=true`

## QUALITY ASSURANCE

### Pre-Commit Checklist
- `npm run lint` passes
- `npm run build` succeeds
- All tRPC procedures are user-scoped
- No TypeScript errors
- No console.log statements left in code

### Success Indicators
- Complete working code on first attempt
- Zero placeholder implementations
- Proper error handling with user-friendly messages
- Type-safe from database to UI

### Failure Recognition
- Deferred implementations or TODOs
- Queries missing user scope
- Components not handling loading/error states
- Missing cache invalidation on mutations
