# UX Feature Recommendations - Digital Filofax

**Analysis Date:** 2026-01-18
**Current Stack:** Next.js 15, tRPC, Prisma, Tailwind/shadcn

---

## Executive Summary

The digital Filofax demonstrates solid foundational UX patterns with consistent component usage and clear information architecture. This analysis identifies 32 specific feature opportunities across 6 categories to enhance user engagement, productivity, and personalization. Recommendations prioritize mobile-first interactions, data visualization depth, and reducing cognitive load through intelligent automation.

---

## 1. Dashboard Widget Innovations

### Current State Analysis
- Static 4-widget grid (Agenda, Tasks, Habits, Ideas)
- Fixed widget sizing and order
- QuickStats cards with basic counts
- Limited user customization (UserPreferences.enabledWidgets exists but not fully utilized)

### Feature Recommendations

#### 1.1 Customizable Widget Grid System
**UX Rationale:** Users have different priorities and workflows. A flexible layout reduces noise and increases relevance.

**Implementation:**
- Drag-and-drop widget reordering using react-dnd or dnd-kit
- Widget size variants (1x1, 2x1, 1x2) stored in UserPreferences.dashboardLayout JSON
- "Add Widget" drawer with preview thumbnails
- Collapsible widgets for temporary focus states

**Database Change:**
```prisma
// Already exists in UserPreferences
dashboardLayout Json? // Store: { widgets: [{ id, position, size }] }
```

**Accessibility:** Keyboard shortcuts (Alt+Arrow) for widget focus navigation, ARIA live regions for position announcements

---

#### 1.2 Smart Widget Variations
**UX Rationale:** Different views serve different cognitive modes (quick scan vs deep focus).

**Widget Library:**
1. **Compact Agenda** (current) vs **Expanded Calendar Grid** (week overview)
2. **Task List** (current) vs **Priority Matrix** (Eisenhower quadrant visualization)
3. **Habit Streaks** (current) vs **Habit Calendar Heatmap** (GitHub-style contribution grid)
4. **Ideas Funnel** (kanban summary with stage counts)
5. **Focus Timer** (Pomodoro integration with current task)
6. **Mood Tracker** (journal sentiment analysis from memos)
7. **Weekly Review** (completion rates, overdue alerts, trends)

**Data Requirements:**
- Priority Matrix: Group tasks by (priority x dueDate urgency)
- Habit Heatmap: Query last 365 days of HabitLog entries
- Focus Timer: Store active session in UserPreferences.activeSession JSON

---

#### 1.3 Contextual Widget Recommendations
**UX Rationale:** Proactive surface relevant information based on time, patterns, and context.

**Smart Behaviors:**
- **Morning (6am-10am):** Highlight "Today's Habits" + "Tasks Due Today"
- **Work Hours (10am-5pm):** Show "Focus Timer" + "Active Tasks"
- **Evening (5pm-10pm):** Display "Journal Prompt" + "Tomorrow Preview"
- **Weekend:** Emphasize "Ideas Board" + "Weekly Review"

**Implementation:**
- Client-side time-based rendering in dashboard widgets
- Store time-based preferences in UserPreferences.widgetSchedule JSON

---

## 2. Data Visualization Opportunities

### Current State Analysis
- Progress bars for habit completion (single metric)
- Streak badges (numeric only)
- Week view as checkmarks (binary completion)
- No historical trends or comparative analytics

### Feature Recommendations

#### 2.1 Advanced Habit Analytics Dashboard
**UX Rationale:** Visual feedback drives habit formation. Trends reveal patterns users miss in raw data.

**Visualizations (using recharts or tremor):**

1. **Multi-Habit Heatmap**
   - GitHub-style contribution grid for each habit
   - Color intensity = streak strength or consistency
   - Click cell → drill into that day's notes/value

2. **Streak Timeline**
   - Line chart showing streak length over time
   - Annotations for longest streak, current streak
   - Failure points marked with context (if notes exist)

3. **Completion Radar Chart**
   - Habits on radial axis, completion % for different time periods (week/month/year)
   - Identify which habits need attention

4. **Habit Correlation Matrix**
   - Show which habits tend to succeed/fail together
   - "When you complete X, you're 73% more likely to complete Y"
   - Calculated from log date overlaps

**Database Queries:**
```typescript
// Correlation calculation
SELECT h1.name, h2.name,
  COUNT(*) FILTER (WHERE hl1.date = hl2.date) * 100.0 / COUNT(*) as correlation_pct
FROM habits h1, habits h2, habit_logs hl1
LEFT JOIN habit_logs hl2 ON hl1.date = hl2.date AND hl2.habitId = h2.id
WHERE h1.id != h2.id
GROUP BY h1.id, h2.id
ORDER BY correlation_pct DESC;
```

---

#### 2.2 Task Analytics & Velocity Tracking
**UX Rationale:** Understanding productivity patterns enables better planning and realistic estimation.

**Charts:**

1. **Burndown Chart** (for weekly/monthly task planning)
   - X-axis: days in period
   - Y-axis: remaining tasks
   - Show ideal line vs actual progress
   - Filter by category/priority

2. **Velocity Chart**
   - Tasks completed per week over 12 weeks
   - Average velocity line
   - Identify capacity trends

3. **Time-to-Completion Distribution**
   - Histogram of (completedAt - createdAt) duration
   - By priority level
   - Helps set realistic due dates

4. **Category Breakdown Pie/Donut**
   - Tasks by category (with color coding)
   - Interactive drill-down to task list

**New Database Fields:**
```prisma
model Task {
  // Add:
  estimatedMinutes Int?
  actualMinutes    Int?

  // Enable tracking
  startedAt DateTime?
}
```

---

#### 2.3 Weekly/Monthly Review Dashboard
**UX Rationale:** Reflection drives improvement. Automated summaries reduce friction for periodic reviews.

**Components:**

1. **Completion Summary Card**
   - Tasks: X completed, Y overdue, Z% on-time rate
   - Habits: Average completion rate, best streak
   - Memos: Count by type, most used tags
   - Ideas: Movement through stages

2. **Highlight Reel**
   - "Longest streak: 47 days (Meditation)"
   - "Most productive day: Tuesday (8 tasks)"
   - "Focus area: Work category (45% of time)"

3. **Trend Arrows**
   - Week-over-week comparison for key metrics
   - Green/red indicators with percentage change

4. **Reflection Prompt**
   - "You completed 23 tasks this week. What helped you succeed?"
   - Auto-create JOURNAL memo type with pre-filled template

**Implementation:**
- New tRPC router: `analytics.getWeeklySummary()`
- Pre-calculate in background job (if using Vercel Cron)
- Cache in UserPreferences.lastWeeklyReview JSON

---

#### 2.4 Calendar Heatmap for All Data Types
**UX Rationale:** Unified view shows overall activity and identifies dead zones.

**Heatmap Variations:**

1. **Activity Heatmap**
   - Cell color intensity = total actions (tasks completed + habits logged + memos created)
   - Click day → modal with breakdown

2. **Focus Heatmap**
   - Color = dominant category for that day
   - Shows if life is balanced or siloed

3. **Energy Heatmap**
   - If mood tracking added: color = average mood
   - Correlate with task completion rates

**Technical Approach:**
- Use `cal-heatmap` library or build with shadcn/ui Calendar component
- Query: Aggregate all createdAt/completedAt dates in 366-day window
- Store in client state, refresh daily

---

## 3. Quick Capture & Input Optimization

### Current State Analysis
- Modal dialogs for all creation flows
- 3-4 required form fields before save
- No keyboard shortcuts or quick-add UI
- Mobile: Standard tap → modal flow

### Feature Recommendations

#### 3.1 Global Quick Capture Command Palette
**UX Rationale:** Reduce friction from 3 clicks to 1 keyboard shortcut. Power users achieve flow state.

**Implementation:**
- Trigger: `Cmd/Ctrl + K` opens command palette (cmdk library)
- Type-ahead search with actions:
  - `task Buy groceries` → instant task creation
  - `habit Meditate` → log today's completion
  - `memo Meeting notes [Enter]` → open quick editor
  - `idea AI-powered recipe app` → capture to NEW column
  - `/weekly` → jump to weekly planner

**Parsing Logic:**
```typescript
// Natural language parsing
const patterns = {
  task: /^task (.+?)( #(\w+))?( !(\w+))?( @(\d{4}-\d{2}-\d{2}))?$/,
  // Captures: title, #category, !priority, @dueDate
};
```

**Accessibility:** Full keyboard navigation, screen reader announcements, visible focus indicators

---

#### 3.2 Inline Quick-Add Buttons
**UX Rationale:** Contextual creation reduces mental task-switching. Users stay in their current view.

**Locations:**
1. **Dashboard Widget Footers:** "+" icon opens inline form (no modal)
2. **Calendar Time Slots:** Click empty slot → ghost event, type title, press Enter to confirm
3. **Task List:** Empty row at bottom with placeholder "Add task..."
4. **Habits Page:** "+" icon on each day cell to retroactively log

**Design Pattern:**
- Inline expansion animation (smooth height transition)
- Escape key to cancel, Tab to next field, Enter to save
- Auto-focus on title field
- Minimal fields (just title), expand to full form via "More details" link

**Code Example:**
```tsx
<div className="relative">
  {showInlineAdd ? (
    <form onSubmit={handleQuickAdd} className="flex gap-2 p-2 border rounded">
      <Input autoFocus placeholder="Task title..." />
      <Button type="submit" size="sm">Add</Button>
    </form>
  ) : (
    <Button variant="ghost" onClick={() => setShowInlineAdd(true)}>
      + Add task
    </Button>
  )}
</div>
```

---

#### 3.3 Voice Input Integration
**UX Rationale:** Hands-free capture while cooking, commuting, or exercising. Accessibility win.

**Implementation:**
- Use Web Speech API (browser native, no API costs)
- "Hold to record" button in quick capture palette
- Show real-time transcription with confidence indicator
- Parse captured text through NLP patterns (same as command palette)

**Fallback:** If Web Speech API unavailable, show "Voice input not supported" tooltip

**Privacy Note:** All processing client-side, no audio uploaded to servers

---

#### 3.4 Smart Defaults & Auto-Fill
**UX Rationale:** Reduce decision fatigue. Learn from user patterns.

**Strategies:**

1. **Task Priority Prediction**
   - Analyze past tasks with similar titles/categories
   - Pre-select most common priority for that context
   - "Tasks in 'Work' category are usually HIGH priority"

2. **Due Date Suggestions**
   - Learn typical lead times by category
   - Suggest: "Usually due 3 days after creation"
   - Smart dates: "tomorrow", "friday", "next week"

3. **Category/Tag Auto-Complete**
   - As user types title, suggest matching categories
   - "Buy groceries" → auto-suggest "Personal" category
   - Based on title keyword matching

4. **Template System**
   - Save common task patterns as templates
   - E.g., "Weekly Review" template → creates 5 subtasks automatically
   - Store in UserPreferences.templates JSON

**Database Query:**
```typescript
// Find most common priority for category
SELECT priority, COUNT(*) as count
FROM tasks
WHERE categoryId = ? AND userId = ?
GROUP BY priority
ORDER BY count DESC
LIMIT 1;
```

---

#### 3.5 Batch Operations
**UX Rationale:** Users often need to act on groups. Batch UI prevents RSI and saves time.

**Features:**
1. **Multi-Select Mode**
   - Checkbox column appears on hover/touch
   - Sticky action bar at bottom: "3 selected: Complete | Archive | Delete"

2. **Bulk Edit**
   - Select multiple tasks → "Edit" → change category/priority for all
   - Same for habits (change color), memos (add tag)

3. **Smart Lists**
   - "Complete all overdue tasks" button (with confirmation)
   - "Archive all DONE tasks from last month"

**Implementation:**
```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

// Mutation
const bulkUpdate = api.tasks.bulkUpdate.useMutation();

const handleBulkComplete = () => {
  bulkUpdate.mutate({
    ids: Array.from(selectedIds),
    status: 'DONE'
  });
};
```

---

## 4. Mobile-First Interaction Patterns

### Current State Analysis
- Responsive layouts (grid collapses on mobile)
- Touch targets generally adequate (44px minimum)
- Limited mobile-specific gestures
- Modals may cause scroll issues on small screens

### Feature Recommendations

#### 4.1 Bottom Sheet Modals for Mobile
**UX Rationale:** Thumb-friendly zone. Matches iOS/Android native patterns.

**Implementation:**
- Detect mobile via `window.innerWidth < 768px`
- Replace Dialog with Drawer component (shadcn/ui has Drawer)
- Swipe-down-to-dismiss gesture
- Backdrop darkens 50% (iOS style)

**Example:**
```tsx
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";

const isMobile = useMediaQuery("(max-width: 768px)");

{isMobile ? (
  <Drawer open={isOpen} onOpenChange={setIsOpen}>
    <DrawerContent>
      <DrawerHeader>Add Task</DrawerHeader>
      {/* Form */}
    </DrawerContent>
  </Drawer>
) : (
  <Dialog>...</Dialog>
)}
```

---

#### 4.2 Swipe Gestures for Common Actions
**UX Rationale:** Faster than tap → menu → select. Muscle memory develops quickly.

**Gesture Map:**
- **Swipe Right:** Complete task/habit
- **Swipe Left:** Delete (with undo toast)
- **Long Press:** Open context menu (alternative to three-dot menu)
- **Pull Down:** Refresh data

**Library:** react-swipeable or framer-motion drag constraints

**Visual Feedback:**
- Reveal action icon as user swipes (iOS Mail style)
- Color transition: gray → green (complete) or red (delete)
- Haptic feedback on mobile (if available)

**Code Pattern:**
```tsx
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedRight: () => handleComplete(task.id),
  onSwipedLeft: () => handleDelete(task.id),
  trackMouse: true // Desktop testing
});

<div {...handlers} className="task-card">
  {task.title}
</div>
```

---

#### 4.3 Floating Action Button (FAB)
**UX Rationale:** Persistent, thumb-accessible creation trigger. Reduces need to scroll to header.

**Design:**
- Fixed position: bottom-right, 16px margin
- Primary color with shadow
- "+" icon, press → speed dial menu (task/habit/memo/idea/event)
- Auto-hide on scroll down, show on scroll up (like browser chrome)

**Speed Dial Menu:**
```
[+] → expands to:
  📝 Task
  🎯 Habit
  📄 Memo
  💡 Idea
  📅 Event
```

**Accessibility:** Focus trap, keyboard accessible, announces expanded state

---

#### 4.4 Progressive Disclosure in Forms
**UX Rationale:** Mobile screens are small. Show complexity only when needed.

**Pattern:**
1. **Initial State:** Title field only (90% of use cases)
2. **Expand Trigger:** "Add details" button below title
3. **Expanded State:** Slide-in additional fields (description, category, due date)
4. **Persistent:** Remember user's preference (if they always expand, show by default)

**Visual Design:**
- Smooth height animation (framer-motion or CSS transition)
- Clear "Done" button to collapse back
- Fields remember values if user collapses without saving

---

#### 4.5 Offline-First Architecture
**UX Rationale:** Commutes, flights, poor connectivity. Don't block productivity on network.

**Implementation Strategy:**
1. **Optimistic Updates (already have this in mutations)**
2. **IndexedDB Cache:** Store last fetched data
   - Use Dexie.js wrapper for IndexedDB
3. **Sync Queue:** Pending mutations stored locally
   - Retry on reconnect
4. **Conflict Resolution:** Last-write-wins or user prompt

**Status Indicator:**
- Subtle icon in header: "Offline" (cloud with slash)
- Toast on reconnect: "Synced 3 changes"

**Service Worker:**
- Cache static assets
- Network-first for API calls (with cache fallback)

---

## 5. Personalization & Theming Opportunities

### Current State Analysis
- UserPreferences.theme ("system", "light", "dark")
- Category/habit colors user-selectable
- No profile customization beyond OAuth data
- Fixed UI density and font sizes

### Feature Recommendations

#### 5.1 Theme Customization System
**UX Rationale:** Aesthetic preferences impact daily usage joy. Personalization increases ownership.

**Features:**

1. **Color Scheme Builder**
   - Pre-built themes: Ocean, Forest, Sunset, Monochrome, High Contrast
   - Custom: Pick primary/accent colors → auto-generate palette with radix-colors
   - Live preview toggle
   - Store in UserPreferences.customTheme JSON

2. **Accent Color Selection**
   - Affects buttons, links, focus states
   - 12 pre-set options (accessible contrasts verified)
   - Sync with category colors for cohesive look

3. **Dark Mode Variants**
   - Pure black (OLED-friendly)
   - Dim (default, less eye strain)
   - Custom background color picker

**Implementation:**
```tsx
// CSS Variables approach
:root[data-theme="custom"] {
  --primary: ${userPrefs.customTheme.primary};
  --accent: ${userPrefs.customTheme.accent};
}
```

---

#### 5.2 Density & Spacing Controls
**UX Rationale:** Users have different visual acuity and preference for information density.

**Options:**
1. **Compact Mode:** 8px padding, smaller fonts (16px → 14px), tight line-height
2. **Comfortable Mode:** (default) 12px padding, 16px base font
3. **Spacious Mode:** 16px padding, 18px base font, generous whitespace

**Affect:**
- Task list row height: 48px → 36px (compact) or 60px (spacious)
- Dashboard widget padding
- Form field spacing

**Toggle:** Settings page with live preview examples

---

#### 5.3 Dashboard Presets
**UX Rationale:** Reduce onboarding friction. Cater to common personas.

**Preset Layouts:**
1. **Minimalist:** Only Habits + Focus Timer widgets
2. **Task Master:** Tasks (kanban) + Priority Matrix + Weekly Review
3. **Wellness:** Habits Heatmap + Journal prompts + Mood tracker
4. **Entrepreneur:** Ideas funnel + Tasks + Calendar + GitHub integration
5. **Custom:** User's saved layout

**Onboarding Flow:**
- After signup: "Choose your dashboard style" with visual previews
- Can switch anytime in settings

**Database:**
```prisma
model UserPreferences {
  dashboardPreset String @default("minimalist")
}
```

---

#### 5.4 Category & Tag Color Intelligence
**UX Rationale:** Colors aid visual scanning but choosing colors is tedious. Automate with smart defaults.

**Features:**

1. **Auto-Assign Colors**
   - Use semantic mapping: Work (blue), Personal (green), Health (red/pink)
   - Analyze category name keywords
   - Ensure contrast against background

2. **Color Harmony Suggestions**
   - When user picks one color, suggest complementary palette for other categories
   - Use color theory (triadic, analogous schemes)

3. **Accessibility Checker**
   - Warn if color combo fails WCAG AA contrast (4.5:1)
   - Suggest darker/lighter variant

**Implementation:**
```typescript
const categoryColorMap: Record<string, string> = {
  work: '#3b82f6', // blue
  personal: '#10b981', // green
  health: '#ef4444', // red
  finance: '#f59e0b', // amber
  default: '#6366f1', // indigo
};

function assignColor(categoryName: string): string {
  const keyword = categoryName.toLowerCase();
  for (const [key, color] of Object.entries(categoryColorMap)) {
    if (keyword.includes(key)) return color;
  }
  return categoryColorMap.default;
}
```

---

#### 5.5 Font & Typography Settings
**UX Rationale:** Dyslexia-friendly fonts, vision impairment accommodation.

**Options:**
1. **Font Family:**
   - System (default, fast)
   - Inter (modern, clean)
   - OpenDyslexic (accessibility)
   - Serif option (traditional)

2. **Font Size Scaling:**
   - Slider: 80% to 120% (relative to base 16px)
   - Affects all text, maintains proportions

3. **Line Height:**
   - Normal (1.5), Relaxed (1.75), Loose (2.0)

**Implementation:**
- Use CSS custom properties
- Store in UserPreferences.typography JSON

---

## 6. Accessibility Improvements

### Current State Analysis
- Semantic HTML (good foundation)
- shadcn/ui has ARIA labels
- Keyboard navigation works in most flows
- Missing: Screen reader testing, focus indicators, skip links

### Feature Recommendations

#### 6.1 Keyboard Shortcuts System
**UX Rationale:** Power users and motor disability accommodation.

**Global Shortcuts:**
- `?` → Show shortcut help modal
- `Cmd/Ctrl + K` → Quick capture (already mentioned)
- `G then D` → Go to Dashboard
- `G then T` → Go to Tasks
- `G then H` → Go to Habits
- `/` → Focus search input (if present)

**Context Shortcuts (on task/habit pages):**
- `C` → Create new item
- `J/K` → Navigate down/up list
- `Enter` → Open selected item
- `Space` → Toggle complete
- `E` → Edit
- `Delete` → Delete (with confirmation)

**Implementation:**
```tsx
import { useHotkeys } from 'react-hotkeys-hook';

useHotkeys('g,d', () => router.push('/dashboard'));
useHotkeys('c', () => setIsCreateOpen(true));
```

**Discoverability:**
- Tooltip on buttons: "Create Task (C)"
- Dedicated /keyboard-shortcuts page
- `?` modal with categorized list

---

#### 6.2 Enhanced Focus Management
**UX Rationale:** Visible focus indicators help keyboard users track position.

**Improvements:**
1. **Custom Focus Ring:**
   - 2px solid primary color, 2px offset
   - Higher contrast than default browser outline
   - Skip invisible focus states

2. **Focus Trapping in Modals:**
   - Already have this with Dialog, verify in all modals
   - First field auto-focused

3. **Skip Links:**
   - "Skip to main content" at page top
   - "Skip to navigation" link
   - Hidden until focused

**CSS:**
```css
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 2px;
}
```

---

#### 6.3 Screen Reader Optimization
**UX Rationale:** 2.2% of web users rely on screen readers. Must be fully navigable.

**Enhancements:**

1. **ARIA Live Regions:**
   - Toast notifications: `aria-live="polite"`
   - Form validation errors: `aria-live="assertive"`
   - Loading states: "Loading tasks..."

2. **Landmark Roles:**
   - `<nav role="navigation">`
   - `<main role="main">`
   - `<aside role="complementary">` (for widgets)

3. **Descriptive Labels:**
   - Icon-only buttons: `aria-label="Delete task"`
   - Form fields: Associate labels with `htmlFor`
   - Complex widgets: `aria-describedby` for instructions

4. **Dynamic Content Announcements:**
   - Task completed: Announce "Task marked as complete"
   - Habit logged: "Running habit logged for today"

**Testing:**
- Use VoiceOver (Mac) / NVDA (Windows) for QA
- Automated: axe-core in tests

---

#### 6.4 Reduced Motion Support
**UX Rationale:** Vestibular disorders, motion sensitivity. Accessibility is not optional.

**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Respect User Preference:**
- Detect with `window.matchMedia('(prefers-reduced-motion: reduce)')`
- Disable parallax, auto-play animations
- Replace motion with instant transitions

**Opt-In Override:**
- Settings toggle: "Enable animations" (defaults to system preference)

---

#### 6.5 Color Contrast & High Contrast Mode
**UX Rationale:** 1 in 12 men, 1 in 200 women have color blindness. 15% of adults have low vision.

**Features:**

1. **Contrast Checker Tool:**
   - Built into category color picker
   - Show WCAG AA/AAA rating in real-time
   - Auto-suggest adjusted shade

2. **High Contrast Theme:**
   - Pure black on white or white on black
   - No grays, only extremes
   - Thicker borders (2px → 3px)

3. **Color-Independent Information:**
   - Never rely on color alone (e.g., status)
   - Add icons: Red "Overdue" + clock icon
   - Use patterns/textures in charts

4. **Focus on Typography:**
   - When colors are limited, font weight/size carry meaning
   - Bold for active states, medium for default

**System Integration:**
```css
@media (prefers-contrast: more) {
  /* High contrast overrides */
  :root {
    --border-width: 3px;
  }
}
```

---

## 7. Implementation Priority Matrix

### Phase 1: Quick Wins (1-2 weeks)
**High Impact, Low Effort**
1. Global Quick Capture Command Palette (3.1)
2. Inline Quick-Add Buttons (3.2)
3. Keyboard Shortcuts System (6.1)
4. Bottom Sheet Modals for Mobile (4.1)
5. Swipe Gestures (4.2)
6. Enhanced Focus Management (6.2)

### Phase 2: Engagement Drivers (3-4 weeks)
**High Impact, Medium Effort**
1. Advanced Habit Analytics Dashboard (2.1)
2. Customizable Widget Grid (1.1)
3. Smart Widget Variations (1.2)
4. Weekly/Monthly Review Dashboard (2.3)
5. Theme Customization System (5.1)
6. Voice Input Integration (3.3)

### Phase 3: Power Features (4-6 weeks)
**Medium Impact, High Effort**
1. Task Analytics & Velocity Tracking (2.2)
2. Calendar Heatmap (2.4)
3. Smart Defaults & Auto-Fill (3.4)
4. Offline-First Architecture (4.5)
5. Batch Operations (3.5)

### Phase 4: Polish & Personalization (2-3 weeks)
**Medium Impact, Low-Medium Effort**
1. Contextual Widget Recommendations (1.3)
2. Dashboard Presets (5.3)
3. Density & Spacing Controls (5.2)
4. Font & Typography Settings (5.5)
5. Floating Action Button (4.3)
6. Category Color Intelligence (5.4)

### Phase 5: Accessibility Hardening (Ongoing)
**Critical for Compliance, Variable Effort**
1. Screen Reader Optimization (6.3)
2. Reduced Motion Support (6.4)
3. Color Contrast & High Contrast Mode (6.5)

---

## 8. Design System Additions

### New Components Needed
1. **CommandPalette** - cmdk wrapper with custom styling
2. **Drawer** - Mobile bottom sheet (shadcn/ui has this)
3. **SpeedDial** - FAB with expandable menu
4. **Heatmap** - Calendar grid with color intensity
5. **StatCard** - Metric display with trend arrow
6. **ChartContainer** - Wrapper for recharts with responsive config
7. **InlineForm** - Expandable form row component
8. **FloatingActionButton** - Fixed position circular button
9. **KeyboardShortcut** - Display keyboard hints (Cmd+K badge)

### Animation Library
- Use framer-motion for:
  - Widget reordering
  - Modal/drawer slides
  - List reordering
  - Chart transitions
  - Hover/tap feedback

### Utility Functions
```typescript
// lib/analytics.ts
export function calculateStreak(logs: Date[]): number;
export function getWeeklySummary(userId: string): Promise<Summary>;
export function predictPriority(title: string, categoryId: string): Priority;

// lib/colors.ts
export function getContrastRatio(bg: string, fg: string): number;
export function isAccessible(bg: string, fg: string, level: 'AA' | 'AAA'): boolean;
export function generatePalette(baseColor: string): ColorPalette;

// lib/offline.ts
export function queueMutation(mutation: Mutation): void;
export function syncQueue(): Promise<void>;
```

---

## 9. Mobile-Specific UX Patterns Reference

### Touch Target Sizes
- Minimum: 44x44px (WCAG 2.5.5)
- Comfortable: 48x48px (Material Design)
- Spacing: 8px between targets

### Gesture Standards
- Swipe threshold: 50px movement
- Long press: 500ms hold
- Double tap: 300ms between taps

### Modal Behaviors
- Full-screen on mobile (<640px)
- Bottom sheet on tablet (640-1024px)
- Centered modal on desktop (>1024px)

### Virtual Keyboard Handling
- Avoid fixed bottom bars (conflicts with keyboard)
- Use `inputMode` for numeric fields
- Scroll active input into view on focus

---

## 10. Analytics & Metrics to Track

### User Engagement
- Daily/weekly active users
- Average session duration
- Features used per session
- Time to first action (after login)

### Feature Adoption
- % users with customized dashboard
- Command palette usage rate
- Keyboard shortcut frequency
- Offline usage patterns

### Performance
- Time to interactive (TTI)
- First contentful paint (FCP)
- Mutation success/failure rates
- API response times by endpoint

### Accessibility
- Keyboard-only navigation completion rate
- Screen reader user retention
- High contrast mode adoption
- Reduced motion preference distribution

**Tracking Tools:**
- Vercel Analytics (already built-in)
- PostHog (open-source, privacy-friendly)
- Sentry (error tracking)

---

## 11. User Testing Recommendations

### Usability Testing Sessions
**Frequency:** Bi-weekly during development
**Participants:** 5 users per session (Nielsen Norman Group standard)
**Tasks:**
1. Create a task with keyboard only
2. Complete today's habits on mobile
3. Review last week's analytics
4. Customize dashboard layout
5. Use quick capture for all data types

**Metrics:**
- Task completion rate
- Time on task
- Error rate
- Satisfaction (1-5 scale)

### A/B Testing Opportunities
1. Dashboard layout: Grid vs Masonry vs Tabs
2. Quick capture: Command palette vs FAB vs Both
3. Habit view: List vs Cards vs Heatmap-first
4. Onboarding: Preset selection vs Blank slate vs Guided tour

### Accessibility Audit
- WCAG 2.1 Level AA compliance scan
- Screen reader walkthrough (full app)
- Keyboard-only navigation test
- Color contrast automated checks (axe DevTools)

---

## 12. Technical Implementation Notes

### State Management Strategy
**Current:** tRPC + React Query (server state) + useState (local UI state)
**Recommended Additions:**
- Zustand for global client state (theme, shortcuts, offline queue)
- Local storage sync for preferences
- IndexedDB for offline data cache

### Performance Optimizations
1. **Code Splitting:**
   - Lazy load analytics charts (`React.lazy`)
   - Route-based splitting (Next.js automatic)

2. **Data Fetching:**
   - Prefetch on hover (link hover → start API call)
   - Infinite scroll for long lists (react-virtual)

3. **Image Optimization:**
   - Next.js Image component for user avatars
   - WebP format with PNG fallback

### Database Indexing
```sql
-- Add for analytics queries
CREATE INDEX idx_habit_logs_user_date ON habit_logs(userId, date DESC);
CREATE INDEX idx_tasks_user_completed ON tasks(userId, completedAt) WHERE completedAt IS NOT NULL;
CREATE INDEX idx_tasks_category_status ON tasks(categoryId, status);
```

### Security Considerations
- Rate limiting on mutations (prevent spam)
- Input sanitization (XSS prevention)
- CSRF tokens (Next.js built-in)
- OAuth token refresh handling

---

## 13. Conclusion

This analysis identified 32 actionable UX improvements across 6 categories. The prioritized roadmap balances quick wins (command palette, swipe gestures) with foundational enhancements (analytics dashboards, offline support).

**Core Philosophy:**
- **User Agency:** Customization without complexity
- **Progressive Enhancement:** Works great at baseline, exceptional with features
- **Accessibility First:** Not an afterthought
- **Data-Driven:** Surface insights, enable reflection

**Next Steps:**
1. Validate priorities with user interviews
2. Create detailed Figma prototypes for Phase 1 features
3. Build component library additions in Storybook
4. Implement Phase 1 features with A/B tests
5. Iterate based on metrics and feedback

**File Locations for Implementation:**
- New components: `/src/components/ui/` (extend shadcn/ui)
- Analytics: `/src/server/api/routers/analytics.ts` (new router)
- Utilities: `/src/lib/analytics.ts`, `/src/lib/colors.ts`
- Hooks: `/src/hooks/useKeyboardShortcuts.ts`, `/src/hooks/useOfflineSync.ts`
- Tests: `/tests/accessibility/`, `/tests/performance/`

---

**Document Version:** 1.0
**Last Updated:** 2026-01-18
**Author:** UX Analysis System
**Status:** Ready for Review
