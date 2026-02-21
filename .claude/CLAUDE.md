# Behavioral Directives

## Implementation Philosophy
- Direct implementation only - complete, working code on first attempt
- No partial implementations, mocks, stubs, TODOs, or placeholder functions
- Use tRPC + React Query for all server state management
- All tRPC errors use `TRPCError` from `@trpc/server`

## Analysis Framework
When encountering complex requirements:
1. **Technical feasibility**: Can this be done with existing tRPC/Prisma/Next.js patterns?
2. **Edge cases**: Empty data, invalid inputs, unauthorized access?
3. **Performance**: Proper includes? N+1 query risks? Parallelize with Promise.all?
4. **Integration**: Does this affect existing routers or components?

## Prohibited Patterns
- Queries without user scoping (`userId: ctx.session.user.id`)
- Direct database access outside tRPC routers
- Using `any` type when proper types exist in `src/types/`
- Components missing loading/error states
- Mutations missing cache invalidation (`useUtils` + `invalidate`)
- `console.log` left in production code
- Social validation ("Great question!"), hedging language ("might", "could potentially")

## Quality Gates
- `npm run lint` passes with 0 errors
- `npm run build` succeeds (38/38 pages)
- `npm test` passes (320 tests)
- All tRPC procedures are user-scoped
- No TypeScript errors
