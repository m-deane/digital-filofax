# Visual Urgency Indicators Implementation

## Overview
Implemented comprehensive visual urgency indicators throughout the digital Filofax app to highlight urgent and overdue items with color-coded visual cues and badges.

## Implementation Date
2026-02-04

## Files Created

### 1. Utility Functions (`src/lib/urgency.ts`)
Core utility functions for urgency calculations:

- `isOverdue(dueDate)` - Check if a date is overdue (past today)
- `isDueToday(dueDate)` - Check if a date is due today
- `isDueSoon(dueDate, days)` - Check if due within N days (default 3)
- `getDaysUntilDue(dueDate)` - Get days until due (negative if overdue)
- `getUrgencyLevel(task)` - Calculate urgency level: critical | high | medium | low | none
  - **Critical**: Overdue tasks
  - **High**: Due today OR urgent priority
  - **Medium**: Due soon (within 3 days) OR high priority
  - **Low**: Has due date in future OR medium priority
  - **None**: No due date and low/no priority OR completed
- `getUrgencyColor(level)` - Get Tailwind color classes for each level
  - Returns: bg, text, border, badge, hover classes
- `getUrgencyLabel(task)` - Get human-readable urgency text
  - "Overdue by X days", "Due today", "Due tomorrow", "Due in X days"
- `getPriorityIndicator(priority)` - Get visual priority indicators (!, !!, !!!)
- `getPriorityColor(priority)` - Get color classes for priority levels

### 2. Badge Components (`src/components/urgency-badge.tsx`)

#### UrgencyBadge Component
- Props: dueDate, priority, status, showLabel, showIcon, className, variant, animate
- Features:
  - Shows urgency status with icon and label
  - Color-coded: red (overdue/critical), orange (due today), yellow (due soon)
  - Optional pulse animation for critical items
  - Compact and default variants
  - Auto-hides if no urgency

#### UrgencyIndicator Component
- Minimal dot indicator for compact displays
- Shows colored dot based on urgency level
- Pulse animation for critical items

#### PriorityBadge Component
- Shows priority with color coding
- Can display text (URGENT, HIGH, etc.) or symbols (!!!, !!, !)
- Uses shadcn Badge variants for consistency

### 3. Task Card Component (`src/components/task-card.tsx`)
Reusable task card with urgency indicators:

- **Variants**: compact, default, full
- **Features**:
  - Colored left border based on urgency level
  - Background tint for urgent items
  - Priority indicators with colors
  - Urgency badges
  - Checkbox for completion toggle
  - Shows category, tags, due date, subtasks
  - Click handlers for task selection
  - Reduced opacity for completed tasks

### 4. API Endpoint (`src/server/api/routers/tasks.ts`)

#### New Endpoint: `getUrgentCount`
Returns counts of urgent items:
```typescript
{
  overdue: number,      // Tasks past due date
  dueToday: number,     // Tasks due today
  urgent: number,       // Urgent priority tasks (not already counted)
  total: number         // Sum of all urgent items
}
```
- User-scoped query
- Efficient database counts
- Used for sidebar badge

## Files Modified

### 1. Dashboard Page (`src/app/dashboard/page.tsx`)

#### New NeedsAttentionWidget
- Shows top 5 most urgent tasks
- Filtered by urgency level (critical or high)
- Sorted by urgency
- Special styling with gradient header
- Orange/red theme to stand out
- Always visible when urgent items exist

#### Updated TasksWidget
- Added urgency indicators to task cards
- Colored left borders based on urgency
- Background tints for urgent items
- Priority badges and urgency badges
- Improved visual hierarchy

#### Updated Imports
- Added urgency utilities and components
- Added required icons (AlertTriangle)
- Added type imports

### 2. Sidebar (`src/components/layout/sidebar.tsx`)

#### Urgent Count Badge
- Red badge on "Tasks" menu item
- Shows count of overdue tasks
- Auto-updates every minute
- Works in both collapsed and expanded states
- Positioned on top-right corner in collapsed mode
- Shows next to label in expanded mode

#### Updated NavItemComponent
- Added optional `badge` prop
- Badge displays for specific menu items
- Red destructive variant for urgency
- Shows "9+" for counts over 9
- Shows "99+" for counts over 99

## Testing

### Test File (`tests/urgency.test.ts`)
Comprehensive unit tests for urgency utilities:

- **isOverdue**: Tests past dates, today, future dates, null/undefined
- **isDueToday**: Tests today detection, edge cases
- **isDueSoon**: Tests 3-day window, custom thresholds
- **getDaysUntilDue**: Tests positive/negative/zero days
- **getUrgencyLevel**: Tests all urgency levels and edge cases
- **getUrgencyColor**: Tests color classes for all levels
- **getUrgencyLabel**: Tests human-readable labels
- **getPriorityIndicator**: Tests priority symbols
- **getPriorityColor**: Tests priority colors

All tests use vitest framework and date-fns utilities.

## Visual Design

### Color Scheme
- **Critical (Red)**: #ef4444 - Overdue tasks, demands immediate attention
- **High (Orange)**: #f97316 - Due today or urgent priority
- **Medium (Yellow)**: #eab308 - Due soon (within 3 days) or high priority
- **Low (Gray)**: #6b7280 - Has due date or medium priority
- **None**: Default colors - No urgency

### Visual Elements
1. **Colored Left Border** (4px) - Primary urgency indicator on cards
2. **Background Tint** - Subtle color wash for urgent items
3. **Urgency Badge** - Shows specific urgency text with icon
4. **Priority Badge** - Shows priority level
5. **Priority Indicator** - Visual symbols (!, !!, !!!) in title
6. **Pulse Animation** - Critical items animate to draw attention
7. **Sidebar Badge** - Red notification badge for overdue count

### Accessibility
- Clear color contrast for all urgency levels
- Text labels alongside color coding
- Icons with semantic meaning
- Hover states for interactive elements
- Screen reader support with aria-labels

## Usage Examples

### In Dashboard Widgets
```tsx
<TaskCard
  task={task}
  onToggle={handleToggle}
  onClick={handleClick}
  variant="default"
  showCategory={true}
  showTags={true}
  showDueDate={true}
  showSubtasks={true}
/>
```

### Manual Urgency Calculation
```typescript
import { getUrgencyLevel, getUrgencyColor } from "@/lib/urgency";

const urgencyLevel = getUrgencyLevel({
  dueDate: task.dueDate,
  priority: task.priority,
  status: task.status,
});

const colors = getUrgencyColor(urgencyLevel);
// colors.border, colors.bg, colors.text, colors.badge, colors.hover
```

### Urgency Badge
```tsx
<UrgencyBadge
  dueDate={task.dueDate}
  priority={task.priority}
  status={task.status}
  variant="compact"
  animate={true}
/>
```

## Integration Points

1. **Dashboard** - Needs Attention widget, Tasks widget
2. **Sidebar** - Urgent count badge on Tasks menu
3. **Task Cards** - Visual indicators on all task displays
4. **Task Lists** - Can use TaskCard component
5. **Weekly/Monthly Views** - Can integrate urgency indicators
6. **Calendar Views** - Can color-code events by urgency

## Performance Considerations

1. **Database Queries**
   - Efficient count queries for urgent tasks
   - User-scoped to prevent data leaks
   - Indexed on dueDate, status, priority fields

2. **Client-Side Caching**
   - tRPC React Query caching
   - 60-second refetch interval for urgent counts
   - Automatic invalidation on task updates

3. **Component Optimization**
   - Conditional rendering (hide badges when no urgency)
   - Memoization opportunities for expensive calculations
   - CSS-based animations (hardware accelerated)

## Future Enhancements

1. **Customizable Thresholds**
   - User preference for "due soon" window
   - Configurable urgency levels

2. **Sound/Desktop Notifications**
   - Alert for new overdue items
   - Reminder notifications

3. **Urgency Filter**
   - Filter tasks by urgency level
   - Sort by urgency in task lists

4. **Urgency Analytics**
   - Track completion rates by urgency
   - Identify patterns in overdue tasks

5. **Smart Prioritization**
   - AI-suggested priorities based on due dates
   - Auto-escalate approaching deadlines

## Notes

- All urgency calculations happen client-side for real-time updates
- Color coding follows accessibility guidelines (WCAG AA)
- Completed tasks always show "none" urgency (no visual stress)
- System respects user's task status (completed tasks are de-emphasized)
- Urgency indicators are consistent across all views
- Tests ensure reliability of urgency calculations
