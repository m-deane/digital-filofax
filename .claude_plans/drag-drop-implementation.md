# Drag-and-Drop Implementation for Weekly Planner

## Overview
Implemented drag-and-drop functionality for the weekly planner using @dnd-kit library to enable scheduling tasks by dragging them into time slots.

## Changes Made

### 1. Dependencies
- ✅ @dnd-kit/core - Core drag-and-drop functionality
- ✅ @dnd-kit/sortable - Sortable list support
- ✅ @dnd-kit/utilities - Utility functions (already installed)

### 2. Backend (tRPC Router)
Updated `src/server/api/routers/tasks.ts`:
- ✅ Added `moveToDate` mutation - Moves task to a specific date/time with scheduledStart and scheduledEnd
- ✅ Added `updateSchedule` mutation - Updates or clears task schedule (for unscheduling)
- ✅ Added `getScheduledTasks` query - Fetches all tasks scheduled within a date range

### 3. Frontend Components

#### DraggableTask (`src/components/planner/draggable-task.tsx`)
- ✅ Wraps task card with `useDraggable` hook
- ✅ Shows drag handle icon (GripVertical) on hover
- ✅ Visual feedback when dragging (opacity, shadow, scale)
- ✅ Displays task details: title, time, category, context, subtasks progress
- ✅ Priority-based color coding (border-left styling)
- ✅ Status icons (clock for in-progress, checkmark for done)

#### DroppableDay (`src/components/planner/droppable-day.tsx`)
- ✅ Wraps day/hour columns with `useDroppable` hook
- ✅ Highlights when task is dragged over (ring effect + background color)
- ✅ Uses `SortableContext` for task ordering within same timeslot
- ✅ Drop indicator animation

#### TaskSidebar (`src/components/planner/task-sidebar.tsx`)
- ✅ Displays unscheduled tasks (tasks without scheduledStart)
- ✅ Droppable area to unschedule tasks
- ✅ Visual feedback when dragging tasks back to unscheduled

### 4. Weekly Planner Page Updates
Updated `src/app/dashboard/planner/weekly/page.tsx`:
- ✅ Wrapped with `DndContext` provider
- ✅ Configured `PointerSensor` with 8px activation distance (prevents accidental drags)
- ✅ Implemented `onDragStart` handler - Sets active task for drag overlay
- ✅ Implemented `onDragEnd` handler with two behaviors:
  - Dropping into timeslot: Calls `moveToDate` mutation with new schedule
  - Dropping into unscheduled area: Calls `updateSchedule` mutation to clear schedule
- ✅ Added `DragOverlay` for smooth drag preview
- ✅ Optimistic updates via query invalidation
- ✅ Grid layout: Sidebar (1/4) + Calendar (3/4)
- ✅ Fetches both scheduled and unscheduled tasks

### 5. Visual Polish
- ✅ Drag handle icon appears on hover
- ✅ Dragging task shows opacity/shadow/scale effect
- ✅ Drop zones highlight with ring and background color
- ✅ Drop indicator with dashed border and pulse animation
- ✅ Smooth transitions and animations
- ✅ Touch device support (via PointerSensor)

### 6. Additional Bug Fixes
Fixed unrelated build issues:
- ✅ Created missing UI components (Skeleton, Alert)
- ✅ Installed missing `sonner` package
- ✅ Fixed JSX.Element return type annotations (removed namespace references)
- ✅ Fixed Next.js 15 async params in shared list page
- ✅ Fixed tasks query response structure (myTasks.tasks.filter)

## Usage

1. **Schedule a Task**: Drag a task from the "Unscheduled Tasks" sidebar and drop it into any day/hour timeslot in the calendar grid.

2. **Reschedule a Task**: Drag a scheduled task from one timeslot to another.

3. **Unschedule a Task**: Drag a scheduled task back to the "Unscheduled Tasks" sidebar.

4. **Visual Feedback**:
   - Hover over a task to see the drag handle
   - While dragging, the task becomes semi-transparent
   - Drop zones highlight when you drag over them
   - Events (from calendar) are shown with lower opacity and are read-only

## Architecture Notes

### Data Flow
```
User drags task → DndContext.onDragEnd →
  → moveToDate/updateSchedule mutation →
    → Prisma updates scheduledStart/scheduledEnd →
      → Query invalidation →
        → UI re-fetches and updates
```

### Key Design Decisions

1. **Default Duration**: When scheduling a task, it defaults to 1 hour duration
2. **User Scoping**: All mutations are user-scoped via `ctx.session.user.id`
3. **Optimistic Updates**: Cache invalidation ensures UI updates immediately after mutation
4. **Activation Distance**: 8px drag threshold prevents accidental drags on click
5. **Event Handling**: Calendar events are displayed but not draggable (read-only overlay)

### Type Safety
- All components use Prisma-generated types
- Task relations (category, context, tags, subtasks) are properly typed
- Droppable data includes type discriminators ("timeslot" vs "unscheduled")

## Testing

Manual testing checklist:
- [x] Tasks can be dragged from sidebar to calendar
- [x] Tasks can be moved between different timeslots
- [x] Tasks can be unscheduled by dragging back to sidebar
- [x] Drag handle appears on hover
- [x] Visual feedback works (opacity, shadows, highlights)
- [x] Multiple tasks in same timeslot display correctly
- [x] Calendar events and tasks can coexist
- [x] Build passes TypeScript checking

## Future Enhancements

Potential improvements:
- [ ] Resize tasks to change duration (drag bottom edge)
- [ ] Multi-day task spanning
- [ ] Drag to create new tasks directly in calendar
- [ ] Batch operations (select multiple tasks)
- [ ] Keyboard shortcuts for drag-and-drop
- [ ] Custom duration selector on drop
- [ ] Conflict detection (overlapping tasks/events)
- [ ] Undo/redo for drag operations
