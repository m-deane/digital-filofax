# Bulk Operations Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                  (src/app/dashboard/tasks/page.tsx)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Select All   │  │ Task Cards   │  │ Bulk Actions │         │
│  │  Checkbox    │  │ with Select  │  │   Toolbar    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
│         └─────────────────┴──────────────────┘                  │
│                           ▼                                     │
│                  ┌────────────────┐                            │
│                  │   useSelection │ ◄─── Escape key handler    │
│                  │      Hook      │                            │
│                  └────────┬───────┘                            │
│                           │                                     │
│              ┌────────────┴────────────┐                       │
│              ▼                         ▼                        │
│    ┌──────────────────┐     ┌──────────────────┐              │
│    │ Selection State  │     │ Helper Functions │              │
│    │  - selectedIds   │     │  - toggleSelect  │              │
│    │  - hasSelection  │     │  - selectAll     │              │
│    │  - allSelected   │     │  - clearSelection│              │
│    └──────────────────┘     └──────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ tRPC mutations
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (tRPC)                           │
│                (src/server/api/routers/tasks.ts)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Bulk Mutations                          │  │
│  │                                                          │  │
│  │  ┌────────────────┐  ┌────────────────┐               │  │
│  │  │ bulkUpdateStatus│  │  bulkDelete    │               │  │
│  │  └────────┬───────┘  └────────┬───────┘               │  │
│  │           │                    │                        │  │
│  │           └────────┬───────────┘                        │  │
│  │                    ▼                                    │  │
│  │          ┌──────────────────┐                          │  │
│  │          │ Ownership Check  │                          │  │
│  │          │ (User Scoping)   │                          │  │
│  │          └────────┬─────────┘                          │  │
│  │                   │                                     │  │
│  │  ┌────────────────┴────────────────┐                  │  │
│  │  │                                  │                  │  │
│  │  ▼                                  ▼                  │  │
│  │  ┌────────────────┐  ┌────────────────┐              │  │
│  │  │bulkAssignCategory│ │bulkAssignPriority│            │  │
│  │  └────────────────┘  └────────────────┘              │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                │ Prisma ORM
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer                               │
│                     (PostgreSQL)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Task Table                            │  │
│  │  ┌────────┬──────────┬────────┬──────────┬──────────┐  │  │
│  │  │   id   │  userId  │ status │ priority │ category │  │  │
│  │  ├────────┼──────────┼────────┼──────────┼──────────┤  │  │
│  │  │  uuid  │   uuid   │  enum  │   enum   │   uuid   │  │  │
│  │  └────────┴──────────┴────────┴──────────┴──────────┘  │  │
│  │                                                          │  │
│  │  Operations:                                            │  │
│  │  • updateMany (for status/priority/category changes)   │  │
│  │  • deleteMany (for bulk deletion)                      │  │
│  │  • findMany with userId filter (for ownership check)   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Bulk Status Update Flow

```
User selects tasks
      │
      ▼
useSelection hook updates selectedIds
      │
      ▼
User clicks "Mark Complete"
      │
      ▼
Component calls bulkUpdateStatus.mutate()
      │
      ▼
tRPC sends request with { taskIds: [...], status: "DONE" }
      │
      ▼
Router validates: tasks exist AND userId matches
      │
      ├─ Valid ──────────────────┐
      │                          ▼
      │                   updateMany in database
      │                          │
      │                          ▼
      │                   Return { success: true, count: N }
      │                          │
      │                          ▼
      │                   Invalidate cache (refetch tasks)
      │                          │
      │                          ▼
      │                   Clear selection
      │
      └─ Invalid ─────────────┐
                              ▼
                       Throw FORBIDDEN error
                              │
                              ▼
                       Show error toast
```

### 2. Selection State Management

```
┌─────────────────────────────────────────────────────────┐
│                  useSelection Hook                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  State:                                                 │
│  ┌───────────────────────────────────────────────┐     │
│  │ selectedIds: Set<string>                      │     │
│  │ lastSelectedIndex: number | null              │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  Effects:                                               │
│  ┌───────────────────────────────────────────────┐     │
│  │ Watch items array changes                     │     │
│  │   ▼                                            │     │
│  │ Filter out invalid IDs                        │     │
│  │   ▼                                            │     │
│  │ Update selectedIds Set                        │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  Actions:                                               │
│  ┌───────────────────────────────────────────────┐     │
│  │ toggleSelect(id, shiftKey)                    │     │
│  │   │                                            │     │
│  │   ├─ No Shift: Toggle single item             │     │
│  │   │                                            │     │
│  │   └─ Shift: Select range from last to current │     │
│  │                                                │     │
│  │ selectAll() → Set all item IDs                │     │
│  │                                                │     │
│  │ clearSelection() → Empty Set                  │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. Security & Validation Flow

```
┌──────────────────────────────────────────────────┐
│        Bulk Operation Request                    │
│   { taskIds: ["id1", "id2", "id3"], ... }       │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│         Input Validation (Zod)                   │
│  • taskIds is array of strings                   │
│  • taskIds.length >= 1                           │
│  • Additional fields valid per mutation          │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│        Database Ownership Query                  │
│  SELECT id FROM tasks                            │
│  WHERE id IN (taskIds)                           │
│    AND userId = currentUser.id                   │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌────────────┐    ┌──────────────┐
│ Count      │    │ Count        │
│ matches    │    │ doesn't      │
│ input      │    │ match        │
│ length     │    │              │
└─────┬──────┘    └──────┬───────┘
      │                  │
      │                  ▼
      │          ┌──────────────┐
      │          │ FORBIDDEN    │
      │          │ Error        │
      │          └──────────────┘
      │
      ▼
┌────────────────────────────────────────────────┐
│     Additional Validation                      │
│  (e.g., category ownership check)              │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│      Execute Bulk Operation                    │
│   updateMany / deleteMany                      │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│      Return Success                            │
│   { success: true, count: N }                  │
└────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TasksPage Component                      │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Filters    │  │   Search     │  │  View Mode   │
│   Toolbar    │  │     Bar      │  │   Toggle     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  Filtered Tasks  │
              └────────┬─────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Select All  │ │  Task Cards  │ │ Bulk Actions │
│   Checkbox   │ │  (List/Grid) │ │   Toolbar    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       │         ┌──────┴──────┐         │
       │         │ TaskCard    │         │
       │         │ Component   │         │
       │         └──────┬──────┘         │
       │                │                │
       └────────────────┴────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  useSelection    │
              │      Hook        │
              └────────┬─────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
       ┌─────────────┐   ┌─────────────┐
       │ State Mgmt  │   │ Event       │
       │ (Set<id>)   │   │ Handlers    │
       └─────────────┘   └─────────────┘
```

## Technology Stack

```
┌─────────────────────────────────────────┐
│           Frontend Layer                │
├─────────────────────────────────────────┤
│ • React 18 (hooks, state)               │
│ • TypeScript (type safety)              │
│ • Tailwind CSS (styling)                │
│ • shadcn/ui (components)                │
│ • tRPC Client (API calls)               │
└─────────────────────────────────────────┘
                    │
                    │ HTTP / WebSocket
                    ▼
┌─────────────────────────────────────────┐
│            API Layer                    │
├─────────────────────────────────────────┤
│ • tRPC (type-safe RPC)                  │
│ • Zod (runtime validation)              │
│ • NextAuth (authentication)             │
└─────────────────────────────────────────┘
                    │
                    │ Database queries
                    ▼
┌─────────────────────────────────────────┐
│         Database Layer                  │
├─────────────────────────────────────────┤
│ • Prisma ORM                            │
│ • PostgreSQL (Supabase)                 │
└─────────────────────────────────────────┘
```

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Select single item | O(1) | Set insertion |
| Select all | O(n) | Create new Set from array |
| Clear selection | O(1) | Create empty Set |
| Shift-select range | O(m) | Where m = range size |
| Bulk status update | O(n) | Database updateMany |
| Bulk delete | O(n) | Database deleteMany |

### Space Complexity

| Data Structure | Space | Notes |
|---------------|-------|-------|
| selectedIds Set | O(k) | Where k = selected count |
| Task list | O(n) | Where n = total tasks |
| Filtered tasks | O(m) | Where m ≤ n |

### Database Operations

All bulk operations use efficient batch queries:

```sql
-- bulkUpdateStatus
UPDATE tasks
SET status = $status, completedAt = $timestamp
WHERE id IN ($taskIds) AND userId = $userId;

-- bulkDelete
DELETE FROM tasks
WHERE id IN ($taskIds) AND userId = $userId;

-- bulkAssignCategory
UPDATE tasks
SET categoryId = $categoryId
WHERE id IN ($taskIds) AND userId = $userId;

-- bulkAssignPriority
UPDATE tasks
SET priority = $priority
WHERE id IN ($taskIds) AND userId = $userId;
```

Each operation is:
- **Atomic** - All succeed or all fail
- **Indexed** - Uses primary key and userId index
- **Secure** - Always filters by userId
