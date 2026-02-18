# Global Search Feature Guide

## User Guide

### Accessing Search

**Method 1: Click Search Input**
- Click the search bar in the header (top of any dashboard page)

**Method 2: Keyboard Shortcut**
- Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
- Search input automatically focuses

### Using Search

1. **Type Your Query**
   - Start typing in the search input
   - Results appear after 300ms (debounced)
   - Matching text is highlighted in yellow

2. **View Results**
   - Results are grouped by type: Tasks, Memos, Ideas, Habits, Events, Contacts
   - Each result shows:
     - Title (highlighted if matches)
     - Snippet/description (if available)
     - Metadata (category, date, status, etc.)
     - Type-specific badges and icons

3. **Navigate to Result**
   - Click any result card to navigate to that item's page
   - Search automatically closes and saves to recent searches

4. **Recent Searches**
   - When search is empty, recent searches appear
   - Click any recent search to re-run it
   - Hover over a search to see delete button (X)
   - Click "Clear" to remove all recent searches

5. **Close Search**
   - Press `Escape` key
   - Click outside the search popover
   - Click the X button next to search input

## Developer Guide

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Input                           │
│                   (Header Search Input)                      │
└────────────┬────────────────────────────────────────────────┘
             │
             │ 300ms debounce
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    tRPC Query (React Query)                  │
│                 api.search.globalSearch.useQuery             │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTP Request
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    tRPC Router (Server)                      │
│               searchRouter.globalSearch                      │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Prisma Queries (Parallel)
             ▼
┌─────────────────────────────────────────────────────────────┐
│                       PostgreSQL                             │
│     Tasks | Memos | Ideas | Habits | Events | Contacts      │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Results (User-scoped)
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    SearchResults Component                   │
│              (Grouped, Sorted, Highlighted)                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

```
src/
├── server/api/routers/
│   └── search.ts                    # Search router & types
├── components/
│   ├── layout/
│   │   └── header.tsx              # Search input & integration
│   └── search/
│       └── search-results.tsx      # Results display
├── hooks/
│   └── use-recent-searches.ts      # localStorage management
└── types/
    └── index.ts                     # Type exports
```

### Adding New Searchable Entity

To add a new entity type to search:

1. **Update Router** (`src/server/api/routers/search.ts`):

```typescript
// Add to SearchResultType union
export type SearchResultType = "task" | "memo" | "newEntity";

// Add interface
export interface NewEntitySearchResult extends BaseSearchResult {
  type: "newEntity";
  // ... entity-specific fields
}

// Update SearchResult union
export type SearchResult = TaskSearchResult | NewEntitySearchResult;

// Add to globalSearch procedure
if (!types || types.includes("newEntity")) {
  const entities = await ctx.db.newEntity.findMany({
    where: {
      userId,
      OR: [
        { field1: searchFilter },
        { field2: searchFilter },
      ],
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  results.push(...entities.map((entity): NewEntitySearchResult => ({
    id: entity.id,
    type: "newEntity",
    title: entity.name,
    // ... map fields
  })));
}
```

2. **Update Results Component** (`src/components/search/search-results.tsx`):

```typescript
// Add icon
const getResultIcon = (type: SearchResult["type"]) => {
  // ... existing cases
  case "newEntity":
    return NewEntityIcon;
};

// Add link
const getResultLink = (result: SearchResult): string => {
  // ... existing cases
  case "newEntity":
    return "/dashboard/new-entity";
};

// Add result component
function NewEntityResult({ result, query, onResultClick }: NewEntityResultProps) {
  // ... render logic
}

// Add to switch in SearchResultItem
switch (result.type) {
  // ... existing cases
  case "newEntity":
    return <NewEntityResult result={result} query={query} onResultClick={onResultClick} />;
}

// Add to typeLabels
const typeLabels: Record<SearchResult["type"], string> = {
  // ... existing
  newEntity: "New Entities",
};
```

3. **Update Types** (if needed):
```typescript
// src/types/index.ts
export type { NewEntitySearchResult } from "@/server/api/routers/search";
```

### Customizing Search Behavior

**Change Debounce Delay**:
```typescript
// src/components/layout/header.tsx
const timer = setTimeout(() => {
  setDebouncedQuery(searchQuery);
}, 500); // Change from 300ms
```

**Change Result Limit**:
```typescript
// src/components/layout/header.tsx
const { data: searchData } = api.search.globalSearch.useQuery(
  { query: debouncedQuery, limit: 50 }, // Change from 20
  // ...
);
```

**Change Stale Time**:
```typescript
// src/components/layout/header.tsx
const { data: searchData } = api.search.globalSearch.useQuery(
  { query: debouncedQuery, limit: 20 },
  {
    enabled: debouncedQuery.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes instead of 1
  }
);
```

**Change Recent Searches Limit**:
```typescript
// src/hooks/use-recent-searches.ts
const MAX_RECENT_SEARCHES = 10; // Change from 5
```

### API Usage

**Client-side (React)**:
```typescript
import { api } from "@/lib/trpc";

function MyComponent() {
  const { data, isLoading } = api.search.globalSearch.useQuery({
    query: "meeting",
    types: ["task", "event"], // Optional filter
    limit: 10,
  });

  return (
    <div>
      {data?.results.map(result => (
        <div key={result.id}>{result.title}</div>
      ))}
    </div>
  );
}
```

**Server-side (tRPC Caller)**:
```typescript
import { createCaller } from "@/server/api/root";

const caller = createCaller({ session, db });
const results = await caller.search.globalSearch({
  query: "project",
  limit: 20,
});
```

### Testing Search

**Manual Testing Checklist**:
- [ ] Search returns results for tasks
- [ ] Search returns results for memos
- [ ] Search returns results for ideas
- [ ] Search returns results for habits
- [ ] Search returns results for events
- [ ] Search returns results for contacts
- [ ] Search highlights matching text
- [ ] Search is case-insensitive
- [ ] Search works with partial matches
- [ ] Recent searches save correctly
- [ ] Recent searches load on focus
- [ ] Clear recent searches works
- [ ] Cmd/Ctrl+K opens search
- [ ] Escape closes search
- [ ] Click result navigates correctly
- [ ] Only user's own data is returned
- [ ] Search debounces properly (no query until 300ms pause)

**Automated Test Example**:
```typescript
// tests/search.test.ts
describe("Global Search", () => {
  it("should search tasks by title", async () => {
    const caller = createCaller({ session: mockSession, db: mockDb });
    const result = await caller.search.globalSearch({ query: "meeting" });

    expect(result.results).toContainEqual(
      expect.objectContaining({
        type: "task",
        title: expect.stringContaining("meeting"),
      })
    );
  });

  it("should only return user's own data", async () => {
    const caller = createCaller({ session: mockSession, db: mockDb });
    const result = await caller.search.globalSearch({ query: "test" });

    result.results.forEach(item => {
      // Verify all results belong to session user
      expect(item.userId).toBe(mockSession.user.id);
    });
  });
});
```

## Performance Optimization

### Current Optimizations
- 300ms debounce reduces query frequency
- React Query caching (1 minute stale time)
- Result limit (20 default, 50 max)
- Parallel database queries
- Index-based searches (assumed)

### Future Optimizations
- Implement full-text search (PostgreSQL)
- Add search result pagination
- Cache popular searches at CDN edge
- Add search analytics for query optimization
- Implement search suggestions/autocomplete
- Use Redis for search result caching

## Security

All search queries are:
- User-scoped (only returns current user's data)
- Protected by `protectedProcedure` (requires authentication)
- Validated with Zod schemas
- SQL injection safe (Prisma ORM)
- Rate-limited by Next.js API routes

## Troubleshooting

**Issue**: Search returns no results
- Check if user has any data in the searched entities
- Verify search query is at least 1 character
- Check browser console for errors
- Verify database connection

**Issue**: Search is slow
- Check database indexes on searched fields
- Reduce result limit
- Check database query performance
- Consider adding full-text search

**Issue**: Recent searches not persisting
- Check localStorage is enabled in browser
- Verify no browser extensions blocking localStorage
- Check console for localStorage errors
- Try clearing browser cache

**Issue**: Keyboard shortcut not working
- Check if another app is using Cmd/Ctrl+K
- Verify focus is not in another input field
- Check browser console for JavaScript errors
- Try clicking search input manually

## Support

For issues or questions:
1. Check this guide
2. Review implementation document (`.claude_plans/global-search-implementation.md`)
3. Check source code comments
4. Review tRPC and Prisma documentation
