# Comprehensive App Fix Plan

## Executive Summary
8 pages need to be connected to the tRPC API. Backend is complete. Each fix follows the same pattern:
1. Import `api` from `@/lib/trpc`
2. Replace `useState` with `useQuery` for fetching
3. Add `useMutation` for create/update/delete
4. Wire up onClick handlers
5. Add loading/error states

## Fix Checklist

### Page 1: Habits (/dashboard/habits)
- [ ] Replace `mockHabits` with `api.habits.getAll.useQuery()`
- [ ] Add `api.habits.create.useMutation()`
- [ ] Add `api.habits.update.useMutation()`
- [ ] Add `api.habits.delete.useMutation()`
- [ ] Add `api.habits.logCompletion.useMutation()` for checkboxes
- [ ] Wire "Add Habit" button
- [ ] Wire checkbox toggles
- [ ] Wire delete in dropdown menu

### Page 2: Memos (/dashboard/memos)
- [ ] Replace `mockMemos` with `api.memos.getAll.useQuery()`
- [ ] Add create/update/delete mutations
- [ ] Wire "New Memo" button
- [ ] Wire pin/archive actions
- [ ] Wire type filter tabs

### Page 3: Ideas (/dashboard/ideas)
- [ ] Replace `mockIdeas` with `api.ideas.getAll.useQuery()`
- [ ] Add create/update/delete mutations
- [ ] Wire "Capture Idea" button
- [ ] Wire status changes (kanban drag or dropdown)
- [ ] Wire star rating

### Page 4: Weekly Tasks (/dashboard/weekly)
- [ ] Replace `mockWeeklyTasks` with `api.tasks.getWeeklyTasks.useQuery()`
- [ ] Add mutations for task operations
- [ ] Wire add/edit/delete
- [ ] Wire checkbox toggles

### Page 5: Monthly Tasks (/dashboard/monthly)
- [ ] Replace `mockMonthlyTasks` with `api.tasks.getMonthlyTasks.useQuery()`
- [ ] Add mutations
- [ ] Wire all interactions

### Page 6: Weekly Planner (/dashboard/planner/weekly)
- [ ] Replace `mockEvents` with `api.calendar.getByDateRange.useQuery()`
- [ ] Add event mutations
- [ ] Wire "Add Event" button
- [ ] Wire event click/edit

### Page 7: Monthly Planner (/dashboard/planner/monthly)
- [ ] Replace mocks with real data
- [ ] Wire all interactions

### Page 8: Dashboard (/dashboard)
- [ ] Fetch real stats from each router
- [ ] Display actual task count, habit progress, etc.
- [ ] Wire widget "Add" buttons to open dialogs

## Implementation Pattern

```tsx
// Standard pattern for each page:

// 1. Import
import { api } from "@/lib/trpc";

// 2. Fetch data
const { data, isLoading, error } = api.[router].getAll.useQuery({});

// 3. Mutations
const utils = api.useUtils();
const createMutation = api.[router].create.useMutation({
  onSuccess: () => utils.[router].getAll.invalidate(),
});

// 4. Handlers
const handleCreate = (data) => createMutation.mutate(data);

// 5. UI binding
<Button onClick={handleCreate}>Create</Button>
```

## Non-Functional Buttons Inventory

### Tasks Page (NOW FIXED)
- [x] Add Task button
- [x] Create Task in dialog
- [x] Checkbox toggle
- [x] Delete in dropdown
- [ ] Filter button (needs popover with options)
- [ ] Category button (needs category select)

### Habits Page
- [ ] Add Habit button
- [ ] All checkboxes (day toggles)
- [ ] More menu (edit/delete)

### Memos Page
- [ ] New Memo button
- [ ] Type filter tabs (visual only)
- [ ] Pin button
- [ ] More menu (edit/delete/archive)

### Ideas Page
- [ ] Capture Idea button
- [ ] Add idea in columns
- [ ] Star rating
- [ ] More menu (edit/delete)

### Planner Pages
- [ ] Add Event buttons
- [ ] Event click handlers
- [ ] Navigation (prev/next week/month)

## Testing Workflow

After each fix, test:
1. Page loads without errors
2. Data fetches from database (should be empty initially)
3. Create operation works and persists
4. Edit operation works
5. Delete operation works
6. Page refresh shows persisted data
7. No console errors
