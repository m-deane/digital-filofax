# Modular Planner System Enhancements Plan

## Document Details
- **Analysis Date:** 2026-02-04
- **Comparison Reference:** [Minimal Desk Setups Modular Planner System](https://shop.minimaldesksetups.com/products/modular-planner-system)

---

## 1. Executive Summary

This document provides a comprehensive comparison between the **Minimal Desk Setups Modular Planner System** (a physical planner) and the **Digital Filofax** application. The analysis reveals that while the Digital Filofax has strong foundational features for task management, habits, memos, ideas, and calendar events, it lacks the key philosophical differentiator of the physical system: **true modularity**.

The physical planner's core value proposition is **"choose what you need, cut what you don't"** - allowing users to enable/disable entire sections of their planner. This modularity concept, combined with missing features like time blocking, Pomodoro integration, daily planning pages, and goals/milestones tracking, represents the primary enhancement opportunities.

### Key Findings
| Area | Status |
|------|--------|
| **Strengths** | Tasks with categories/tags, habits with streak tracking, memos with multiple types, ideas kanban board, weekly/monthly planner views, calendar events |
| **Primary Gaps** | Module enable/disable system, customizable dashboard widgets, daily planning page (time grid + tasks + notes combined), Pomodoro/focus timer, goals & milestones tracking |
| **Estimated Effort** | 4 phases over 8-12 weeks |

---

## 2. Modular Planner System Features

### 2.1 Six Insert Types

| Insert | Purpose | Key Features |
|--------|---------|--------------|
| **Daily Pages** | Hour-by-hour planning | Time grid (7am-8pm), Top 3 priorities, To-do list, Dot grid notes area |
| **Weekly Pages** | Week-at-a-glance | Monday-Sunday spread, Weekly priorities, Day columns, Notes section |
| **Monthly Pages** | Long-term planning | Undated calendar grid, Milestones section, Monthly goals |
| **Memo Pages** | Freeform capture | Dot grid/lined options, Brainstorming space, Reference storage |
| **Habit Tracker Cards** | Behavior building | 31-day tracking grid, Notes section, 200 GSM cardstock |
| **Task & Time Cards** | Portable productivity | Credit card-sized, Quick capture, Pomodoro integration |

### 2.2 Binder System
- **Cover:** Premium vegan leather with unique supple finish
- **Ring Capacity:** 90-page ring binder mechanism
- **Storage:** Two sleeves for habit/task cards (take productivity on-the-go)
- **Design:** Slim, portable, fits into daily lifestyle

### 2.3 Key Principles
1. **Undated Flexibility:** No wasted pages, start any time
2. **Mix-and-Match Modularity:** Users select only needed sections
3. **Portability Focus:** Designed for mobile productivity
4. **Premium Feel:** High-quality materials (100 GSM paper, 200 GSM cardstock)
5. **Pomodoro Integration:** Built-in focus session support
6. **Customization Philosophy:** *"Choose what you need, cut what you don't"*

---

## 3. Current Digital Filofax Features

### 3.1 Database Models
| Model | Status | Key Features |
|-------|--------|--------------|
| User | ✅ Complete | OAuth (GitHub, Google), preferences |
| Task | ✅ Complete | Status, priority, due dates, categories, tags, subtasks, weekOf, monthOf |
| Subtask | ✅ Complete | Ordered checklist items |
| Category | ✅ Complete | Color-coded organization |
| Habit | ✅ Complete | Boolean/Numeric/Duration types, frequency, logs |
| HabitLog | ✅ Complete | Date-based completion tracking |
| Memo | ✅ Complete | 5 types (Note, Anecdote, Journal, Meeting, Quick Thought) |
| Tag | ✅ Complete | Cross-entity tagging |
| Idea | ✅ Complete | 5-stage kanban (New → Exploring → In Progress → Implemented → Archived) |
| CalendarEvent | ✅ Complete | Internal events, Google Calendar sync potential |
| GitHubRepo | ⚠️ Partial | Model exists, integration not active |
| UserPreferences | ⚠️ Partial | Theme, defaultView, weekStartsOn, dashboardLayout, enabledWidgets |

### 3.2 UI Pages
| Page | Capabilities |
|------|--------------|
| Dashboard | 4 widgets (Agenda, Tasks, Habits, Ideas), QuickStats |
| Tasks | List/Kanban views, filters, CRUD, subtasks |
| Weekly Tasks | 7-day grid, task assignment to days |
| Monthly Tasks | Category-grouped tasks for month |
| Weekly Planner | Time grid calendar (7am-8pm), event creation |
| Monthly Planner | Calendar grid view |
| Habits | Cards with week view, streak tracking, heatmap |
| Memos | Grid view, type filtering, pinning, archive |
| Ideas | Kanban board with status columns |
| Settings | Category management, integrations display |

### 3.3 Existing Infrastructure for Modularity
The `UserPreferences` model already has:
```typescript
enabledWidgets String[] @default(["agenda", "habits", "tasks"])
dashboardLayout Json?
```

**Current Widget Types:**
- agenda, tasks, habits, calendar, github, meal-plan, quick-capture, streaks

---

## 4. Gap Analysis

### 4.1 Feature Comparison Table

| Physical Planner Feature | Digital Filofax Status | Gap Level |
|--------------------------|------------------------|-----------|
| **MODULARITY** | | |
| Enable/disable entire sections | Infrastructure exists but UI not implemented | 🔴 HIGH |
| Mix-and-match inserts | All features always visible | 🔴 HIGH |
| Portable card system | No equivalent | 🟡 MEDIUM |
| **DAILY PLANNING** | | |
| Daily page with time grid + tasks | Weekly Planner has time grid; no combined daily view | 🔴 HIGH |
| Top 3 priorities highlight | Tasks have priority but no "daily priorities" feature | 🔴 HIGH |
| Daily notes/dot grid area | Memos exist but not integrated into daily view | 🟡 MEDIUM |
| **WEEKLY PLANNING** | | |
| Weekly spread view | Weekly Tasks + Weekly Planner exist separately | 🟢 LOW |
| Weekly priorities | Not available | 🟡 MEDIUM |
| **MONTHLY PLANNING** | | |
| Milestones tracking | Not available | 🔴 HIGH |
| Monthly goals | Not available (only monthly tasks) | 🟡 MEDIUM |
| **PRODUCTIVITY TOOLS** | | |
| Pomodoro timer | Not available | 🔴 HIGH |
| Focus mode | Not available | 🟡 MEDIUM |
| Quick capture cards | Memos.quickCapture exists but no card UI | 🟡 MEDIUM |
| **CUSTOMIZATION** | | |
| Custom templates | Not available | 🟡 MEDIUM |
| Dividers/sections | Categories exist but no visual dividers | 🟢 LOW |

---

## 5. Missing Features (Prioritized)

### P0 - Critical (Core Modularity)

| Feature | Description | Effort |
|---------|-------------|--------|
| **Module Enable/Disable System** | Allow users to turn entire feature modules on/off, hiding them from sidebar and dashboard | Large |
| **Customizable Dashboard Widgets** | Drag-and-drop widget placement, resize widgets, add/remove widgets | Large |
| **Daily Planning Page** | Combined view: time grid + prioritized tasks + to-do list + notes area | XL |

### P1 - High Priority

| Feature | Description | Effort |
|---------|-------------|--------|
| **Time Blocking Integration** | Drag tasks onto calendar time slots, visual time allocation | Large |
| **Pomodoro/Focus Timer** | Built-in timer, session tracking, break reminders, link to active task | Medium |
| **Goals & Milestones System** | Goal creation with deadlines, key results, link tasks to goals, progress visualization | Large |
| **Focus Mode** | Distraction-free single-task view, hide other UI elements, timer integration | Medium |
| **Quick Capture Widget** | Floating/docked quick input for tasks, memos, ideas without navigating | Small |

### P2 - Medium Priority

| Feature | Description | Effort |
|---------|-------------|--------|
| **Custom Templates System** | Save task/project structures as templates, apply with one click | Medium |
| **Print-Friendly Export Views** | Generate PDF matching physical planner format for hybrid users | Medium |
| **Mobile-Optimized Card Views** | Card-based mobile UI optimized for thumb navigation | Medium |
| **Dynamic Sidebar** | Sidebar automatically hides disabled modules | Small |
| **Monthly Milestones View** | Dedicated UI for key dates, deadlines, important events | Small |
| **Habit Heatmap (365-day)** | Year-long GitHub-style visualization of habit completion | Medium |

### P3 - Nice-to-Have

| Feature | Description | Effort |
|---------|-------------|--------|
| Physical Planner Sync | Export to print format, import from scanned pages | XL |
| Handwriting/Sketch Input | Drawing canvas for freeform notes | Large |
| Voice Capture | Speak to create tasks, memos, ideas | Medium |
| Offline Mode Enhancements | Full offline support with sync queue | Large |

---

## 6. Detailed Enhancement Specifications

### 6.1 Module Enable/Disable System (P0)

**Description:** Users can enable/disable entire feature modules (Tasks, Habits, Memos, Ideas, Calendar, Goals) from settings.

**User Stories:**
1. As a user focused only on habits, I want to hide Tasks, Memos, and Ideas so I'm not distracted
2. As a new user, I want to start with minimal modules and add more as needed
3. As a user changing focus, I want to quickly toggle modules on/off without losing data

**Database Changes:**
```prisma
model UserPreferences {
  enabledModules String[] @default(["tasks", "habits", "memos", "ideas", "calendar"])
}
```

**UI Components:**
- `/src/app/dashboard/settings/modules/page.tsx` - Module toggle settings page
- Update sidebar to filter nav items by enabledModules
- Update dashboard to filter widgets by enabledModules

---

### 6.2 Daily Planning Page (P0)

**Description:** Combined daily view featuring:
- Time grid (7am-9pm) for scheduling
- "Today's Priorities" section (top 3 tasks)
- Task list for the day
- Notes area (links to memos)
- Habit checklist for the day

**Database Changes:**
```prisma
model Task {
  scheduledStart  DateTime?
  scheduledEnd    DateTime?
  isDailyPriority Boolean @default(false)
}
```

**New Router:** `dailyRouter`
- `getDailyView` - Returns tasks, events, habits, memos for date
- `setDailyPriorities` - Set top 3 tasks for day
- `scheduleTask` - Assign task to time slot

**Layout:** Two-column design
- Left (60%): Time grid with events and scheduled tasks
- Right (40%): Priorities, unscheduled tasks, habits checklist, notes

---

### 6.3 Pomodoro/Focus Timer (P1)

**Description:** Built-in Pomodoro timer with:
- 25/5/15 minute presets (customizable)
- Session tracking linked to tasks
- Break reminders
- Daily focus time statistics

**Database Changes:**
```prisma
model FocusSession {
  id        String           @id @default(cuid())
  startTime DateTime
  endTime   DateTime?
  duration  Int              // minutes
  type      FocusSessionType // WORK | SHORT_BREAK | LONG_BREAK
  taskId    String?
  userId    String
  createdAt DateTime @default(now())
}

enum FocusSessionType {
  WORK
  SHORT_BREAK
  LONG_BREAK
}
```

**UI Components:**
- Circular timer display with large countdown
- Task selector dropdown
- Start/pause/skip buttons
- Session indicator dots
- Dashboard widget

---

### 6.4 Goals & Milestones System (P1)

**Description:** Goal tracking with:
- Goal creation (title, description, deadline, category)
- Milestones with progress tracking
- Link tasks to goals
- Goal progress visualization

**Database Changes:**
```prisma
model Goal {
  id           String     @id @default(cuid())
  title        String
  description  String?
  status       GoalStatus @default(NOT_STARTED)
  deadline     DateTime?
  progress     Int        @default(0)
  userId       String
  categoryId   String?
  parentGoalId String?
  milestones   Milestone[]
  tasks        Task[]
}

model Milestone {
  id        String   @id @default(cuid())
  title     String
  date      DateTime
  completed Boolean  @default(false)
  goalId    String
}

enum GoalStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  ON_HOLD
  ABANDONED
}

model Task {
  goalId String?  // Add relation to goals
}
```

---

## 7. Modularity Architecture

### 7.1 Module Configuration
```typescript
// src/lib/modules.ts
export const MODULES = {
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    icon: 'CheckSquare',
    routes: ['/dashboard/tasks', '/dashboard/weekly', '/dashboard/monthly'],
    widgets: ['tasks'],
  },
  habits: {
    id: 'habits',
    name: 'Habits',
    icon: 'Target',
    routes: ['/dashboard/habits'],
    widgets: ['habits', 'streaks'],
  },
  memos: {
    id: 'memos',
    name: 'Memos',
    icon: 'FileText',
    routes: ['/dashboard/memos'],
    widgets: ['quick-capture'],
  },
  ideas: {
    id: 'ideas',
    name: 'Ideas',
    icon: 'Lightbulb',
    routes: ['/dashboard/ideas'],
    widgets: ['ideas'],
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    icon: 'Calendar',
    routes: ['/dashboard/planner/weekly', '/dashboard/planner/monthly'],
    widgets: ['agenda', 'calendar'],
  },
  goals: {
    id: 'goals',
    name: 'Goals',
    icon: 'Trophy',
    routes: ['/dashboard/goals'],
    widgets: ['goals'],
  },
} as const;
```

### 7.2 Module-Aware Hooks
```typescript
// src/hooks/use-modules.ts
export function useEnabledModules() {
  const { data: prefs } = api.preferences.getPreferences.useQuery();
  return prefs?.enabledModules ?? Object.keys(MODULES);
}

export function useIsModuleEnabled(moduleId: ModuleId) {
  const enabled = useEnabledModules();
  return enabled.includes(moduleId);
}
```

### 7.3 Layout Presets
```typescript
export const LAYOUT_PRESETS = {
  minimalist: {
    enabledModules: ['habits'],
    widgets: [{ type: 'habits', size: '2x1' }, { type: 'focus-timer', size: '1x1' }],
  },
  taskMaster: {
    enabledModules: ['tasks', 'calendar'],
    widgets: [{ type: 'tasks', size: '2x2' }, { type: 'agenda', size: '1x1' }],
  },
  fullSuite: {
    enabledModules: ['tasks', 'habits', 'memos', 'ideas', 'calendar', 'goals'],
    widgets: [...], // All widgets
  },
};
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Establish modularity infrastructure

| Task | Effort | Priority |
|------|--------|----------|
| Create UserPreferences router | S | P0 |
| Add enabledModules field to schema | S | P0 |
| Build module toggle settings page | M | P0 |
| Make sidebar module-aware | S | P0 |
| Filter dashboard widgets by module | S | P0 |

**Deliverables:**
- Users can enable/disable modules
- Sidebar hides disabled modules
- Dashboard hides widgets for disabled modules

---

### Phase 2: Daily Planning (Weeks 3-5)
**Goal:** Implement core daily planning features

| Task | Effort | Priority |
|------|--------|----------|
| Design daily planning page layout | M | P0 |
| Add scheduledStart/End to Task model | S | P0 |
| Build time grid component | L | P0 |
| Implement task drag-to-schedule | M | P1 |
| Build daily priorities section | S | P0 |
| Create daily router | M | P0 |
| Add daily habits checklist | S | P1 |

**Deliverables:**
- Combined daily planning page
- Time blocking for tasks
- Daily priorities feature

---

### Phase 3: Productivity Tools (Weeks 6-8)
**Goal:** Add focus and goal tracking features

| Task | Effort | Priority |
|------|--------|----------|
| Design FocusSession schema | S | P1 |
| Build Pomodoro timer component | M | P1 |
| Create focus router | M | P1 |
| Build focus timer dashboard widget | S | P1 |
| Implement focus mode overlay | M | P1 |
| Design Goal/Milestone schema | M | P1 |
| Build goals router | M | P1 |
| Create goals page UI | L | P1 |
| Add task-goal linking | S | P1 |

**Deliverables:**
- Pomodoro timer with session tracking
- Focus mode
- Goals and milestones system

---

### Phase 4: Customization (Weeks 9-10)
**Goal:** Enhanced dashboard customization and templates

| Task | Effort | Priority |
|------|--------|----------|
| Add drag-drop to dashboard | L | P0 |
| Implement widget resize | M | P0 |
| Build widget picker drawer | M | P0 |
| Create layout presets | S | P2 |
| Build template system schema | M | P2 |
| Add habit heatmap widget | M | P2 |

**Deliverables:**
- Fully customizable dashboard
- Widget library
- Task templates

---

## 9. Database Schema Changes Summary

### New Tables
```prisma
model Goal {
  id           String     @id @default(cuid())
  title        String
  description  String?    @db.Text
  status       GoalStatus @default(NOT_STARTED)
  deadline     DateTime?
  progress     Int        @default(0)
  userId       String
  categoryId   String?
  parentGoalId String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  category   Category?   @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  parentGoal Goal?       @relation("GoalHierarchy", fields: [parentGoalId], references: [id])
  childGoals Goal[]      @relation("GoalHierarchy")
  milestones Milestone[]
  tasks      Task[]

  @@index([userId])
  @@index([deadline])
}

model Milestone {
  id          String    @id @default(cuid())
  title       String
  date        DateTime  @db.Date
  completed   Boolean   @default(false)
  completedAt DateTime?
  goalId      String
  createdAt   DateTime  @default(now())

  goal Goal @relation(fields: [goalId], references: [id], onDelete: Cascade)

  @@index([goalId])
  @@index([date])
}

model FocusSession {
  id        String           @id @default(cuid())
  startTime DateTime
  endTime   DateTime?
  duration  Int
  type      FocusSessionType
  taskId    String?
  userId    String
  createdAt DateTime         @default(now())

  task Task? @relation(fields: [taskId], references: [id])
  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([taskId])
}

enum GoalStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  ON_HOLD
  ABANDONED
}

enum FocusSessionType {
  WORK
  SHORT_BREAK
  LONG_BREAK
}
```

### Modified Tables
```prisma
model Task {
  // Add fields:
  scheduledStart  DateTime?
  scheduledEnd    DateTime?
  isDailyPriority Boolean   @default(false)
  goalId          String?

  goal          Goal?          @relation(fields: [goalId], references: [id], onDelete: SetNull)
  focusSessions FocusSession[]
}

model UserPreferences {
  // Add fields:
  enabledModules            String[] @default(["tasks", "habits", "memos", "ideas", "calendar"])
  pomodoroWorkMinutes       Int      @default(25)
  pomodoroShortBreakMinutes Int      @default(5)
  pomodoroLongBreakMinutes  Int      @default(15)
  pomodoroSessionsUntilLong Int      @default(4)
}
```

---

## 10. Technical Considerations

### 10.1 Performance
- Implement widget-level suspense boundaries
- Use React Query's `staleTime` to reduce refetches
- Combine multiple queries into single `getDailyView` procedure
- Add database indexes on `(userId, dueDate)` and `(userId, scheduledStart)`

### 10.2 Migration Strategy
1. All new fields should be optional or have defaults
2. New features (Goals) default to disabled until stable
3. Version the `dashboardLayout` schema for future migrations

### 10.3 Testing Approach
```
tests/
  unit/
    modules.test.ts
    widgets.test.ts
    timer.test.ts
  integration/
    daily-router.test.ts
    focus-router.test.ts
    goals-router.test.ts
  e2e/
    modularity.spec.ts
    dashboard-customization.spec.ts
    daily-planning.spec.ts
    pomodoro.spec.ts
```

---

## Summary

The Digital Filofax has a strong foundation but needs to embrace the **modularity philosophy** of its physical inspiration. The key enhancements focus on:

1. **True Modularity** - Let users choose their features
2. **Daily Planning** - A unified daily view like the physical daily pages
3. **Productivity Tools** - Pomodoro timer and focus mode
4. **Goal Tracking** - Connect tasks to higher-level objectives
5. **Customization** - Flexible dashboard and templates

Implementing these features over 4 phases will transform the Digital Filofax from a feature-rich app into a truly **personal** organization system that adapts to each user's workflow.
