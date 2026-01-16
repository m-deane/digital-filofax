# Personal Organization App - Digital Filofax System

## Project Overview

Build a comprehensive personal organization web application that replicates and enhances a paper-based Filofax system. This is a **single control center** for managing all aspects of personal productivity, with integration capabilities to external repositories and services.

## Technology Stack (Recommended)

**Core Framework:**
- Next.js 15 with App Router
- T3 Stack (TypeScript + tRPC + Prisma + NextAuth + Tailwind CSS)
- shadcn/ui component library (Base UI backend)

**Key Libraries:**
- react-big-calendar - Calendar views (weekly/monthly planners)
- dnd-kit - Drag-and-drop for kanban boards and task ordering
- TanStack Query - Server state management
- Zustand - Client state management
- Recharts or Chart.js - Data visualization for habit tracking

**Database & Backend:**
- Supabase (PostgreSQL + Auth + Real-time)
- IndexedDB - Local offline storage
- Service Workers - PWA offline support

**Integrations:**
- Octokit.js - GitHub API (for external repository automation)
- Google Calendar API - Calendar sync
- Optional: Tauri for desktop app (3-10MB vs Electron's 50-120MB)

---

## Core Features

### 1. Task Management System

**To-Do Lists with Customizable Categories:**
- Create, edit, delete tasks with rich text descriptions
- User-defined categories with custom colors and icons (e.g., "Work", "Personal", "Health", "Finance", "Learning")
- Category CRUD management interface
- Filter and sort tasks by category, priority, due date, status
- Drag-and-drop reordering within and across categories

**Task Properties:**
- Title and description (markdown support)
- Category assignment (multiple categories allowed)
- Priority levels: Low, Medium, High, Urgent
- Status: To Do, In Progress, Done
- Due date with optional time
- Recurring task support (daily, weekly, monthly, custom RRule)
- Subtasks/checklist items
- Tags for additional organization
- Notes/comments section

**Views:**
- List view with filters and sorting
- Kanban board view (columns by status or category)
- Calendar view showing tasks by due date
- Focus mode (today's tasks only)

### 2. Weekly To-Do Lists

- Dedicated weekly planning view
- Week-at-a-glance with daily task slots
- Drag tasks between days
- Rollover incomplete tasks to next week
- Weekly goals section at top
- Weekly review/reflection area
- Print-friendly layout option

### 3. Monthly To-Do Lists

- Month-level task organization
- Monthly goals and objectives
- Key milestones tracking
- Month overview with task density indicators
- Rollover functionality from previous month
- Monthly review section

### 4. Weekly Planner

- Full weekly calendar view (7-day spread)
- Time-blocked scheduling (hourly slots)
- Drag-and-drop event scheduling
- Multiple calendar overlay (tasks + events + habits)
- Color-coded by category/calendar source
- Quick event creation
- Event details panel
- Recurring event support
- Integration with Google Calendar

### 5. Monthly Planner

- Traditional calendar grid view
- Day cells showing:
  - Event previews
  - Task counts
  - Habit completion indicators
- Click to expand day details
- Month navigation
- Today indicator
- Mini calendar for navigation

### 6. Memo Notes & Anecdotal Items

**Notes System:**
- Create rich text/markdown notes
- Title, content, tags, created/updated timestamps
- Pin important notes
- Archive old notes
- Full-text search across all notes
- Quick capture (hotkey or floating button)

**Organization:**
- Tag-based organization (user-defined tags with colors)
- Notebook/folder system (optional hierarchy)
- Favorites/starred notes
- Recently accessed notes
- Linked notes (wiki-style [[note]] links)

**Special Note Types:**
- Anecdotes/stories (with date and context fields)
- Quick thoughts/ideas
- Meeting notes template
- Journal entries

### 7. Habit Tracking Cards

**Habit Definition:**
- Create habits with name, description, frequency
- Habit types:
  - Boolean (done/not done)
  - Numeric (e.g., glasses of water, pages read)
  - Duration (e.g., meditation minutes)
- Frequency options: daily, weekly, specific days
- Target values for numeric/duration habits
- Category assignment
- Icon selection

**Tracking Interface:**
- Daily habit card view (checklist style)
- Calendar heatmap view (GitHub contribution style)
- Streak tracking and display
- Completion percentage
- Quick-check buttons for mobile
- Undo accidental completions

**Analytics:**
- Current streak vs. longest streak
- Weekly/monthly completion rates
- Trend charts over time
- Habit correlation insights
- Exportable reports

### 8. Idea Generation & Tracking

**Idea Capture:**
- Quick idea entry (title + description)
- Category/domain assignment
- Priority/potential rating
- Status: New, Exploring, In Progress, Implemented, Archived
- Related links/resources
- Tags

**Idea Board:**
- Kanban-style board by status
- Card view with previews
- Filter by category/tag
- Search functionality
- Idea parking lot (low-priority holding area)

**Idea Development:**
- Nested notes/research per idea
- Linked tasks (convert idea to project)
- Voting/scoring system
- Review reminders

### 9. Calendar Integration

**Google Calendar Sync:**
- OAuth authentication
- Two-way sync (read and write events)
- Multiple calendar support (select which to sync)
- Real-time updates
- Conflict resolution
- Sync status indicators

**Unified Calendar View:**
- All events in single view
- Color-coded by source (app events, Google Calendar, GitHub, etc.)
- Event type indicators
- Agenda view for upcoming items

### 10. Automation & External Repository Integration

**GitHub Integration:**
- OAuth authentication with GitHub
- Repository selection (choose which repos to connect)
- Sync issues and PRs from connected repos
- Display in dashboard as actionable items
- Create GitHub issues from app tasks
- Webhook support for real-time updates

**Meal Plan Integration (Example External Project):**
- Connect to meal planning repository in GitHub
- Fetch generated meal plans (via GitHub API or custom endpoint)
- Display current week's meal plan in dashboard widget
- Link to recipe details
- Shopping list integration

**Automation Features:**
- Scheduled tasks (run scripts, fetch data at intervals)
- Trigger actions based on conditions (e.g., create task when GitHub issue assigned)
- Template workflows (e.g., weekly review creates standard tasks)
- API endpoints for external tools to push data

### 11. Dashboard - Command Center

**Overview Panels:**
- Today's agenda (tasks + events + habits)
- Week at a glance (mini weekly view)
- Habit streaks summary
- Upcoming deadlines
- GitHub activity feed
- Meal plan widget (if connected)
- Quick capture buttons
- Weather widget (optional)

**Customization:**
- Drag-and-drop widget arrangement
- Show/hide widgets
- Widget size options
- Multiple dashboard layouts (work vs. personal)

---

## Data Models (Prisma Schema)

```prisma
// Core Models

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  tasks         Task[]
  categories    Category[]
  habits        Habit[]
  habitLogs     HabitLog[]
  memos         Memo[]
  tags          Tag[]
  ideas         Idea[]
  events        CalendarEvent[]
  githubRepos   GitHubRepo[]
  preferences   UserPreferences?
}

model Category {
  id        String   @id @default(cuid())
  name      String
  color     String   @default("#6366f1")
  icon      String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks     Task[]
  habits    Habit[]
  ideas     Idea[]
  createdAt DateTime @default(now())

  @@unique([userId, name])
}

model Task {
  id              String    @id @default(cuid())
  title           String
  description     String?   @db.Text
  status          TaskStatus @default(TODO)
  priority        Priority   @default(MEDIUM)
  dueDate         DateTime?
  completedAt     DateTime?
  order           Int        @default(0)

  // Recurrence
  recurrenceRule  String?    // RRule format
  parentTaskId    String?
  parentTask      Task?      @relation("TaskRecurrence", fields: [parentTaskId], references: [id])
  childTasks      Task[]     @relation("TaskRecurrence")

  // Relations
  userId          String
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId      String?
  category        Category?  @relation(fields: [categoryId], references: [id])
  tags            Tag[]
  subtasks        Subtask[]

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  // Week/Month assignment
  weekOf          DateTime?  // Start of week for weekly lists
  monthOf         DateTime?  // Start of month for monthly lists
}

model Subtask {
  id          String   @id @default(cuid())
  title       String
  completed   Boolean  @default(false)
  order       Int      @default(0)
  taskId      String
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model Habit {
  id            String      @id @default(cuid())
  name          String
  description   String?
  habitType     HabitType   @default(BOOLEAN)
  frequency     Frequency   @default(DAILY)
  targetValue   Int?        // For numeric/duration habits
  unit          String?     // e.g., "glasses", "minutes", "pages"
  icon          String?
  color         String      @default("#10b981")
  isArchived    Boolean     @default(false)

  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId    String?
  category      Category?   @relation(fields: [categoryId], references: [id])
  logs          HabitLog[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model HabitLog {
  id          String   @id @default(cuid())
  date        DateTime @db.Date
  value       Int?     // For numeric/duration habits
  notes       String?

  habitId     String
  habit       Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())

  @@unique([habitId, date])
}

model Memo {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  isPinned    Boolean  @default(false)
  isArchived  Boolean  @default(false)
  memoType    MemoType @default(NOTE)

  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags        Tag[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Tag {
  id        String   @id @default(cuid())
  name      String
  color     String   @default("#8b5cf6")

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks     Task[]
  memos     Memo[]
  ideas     Idea[]

  @@unique([userId, name])
}

model Idea {
  id          String      @id @default(cuid())
  title       String
  description String?     @db.Text
  status      IdeaStatus  @default(NEW)
  priority    Int         @default(0) // 0-5 rating

  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId  String?
  category    Category?   @relation(fields: [categoryId], references: [id])
  tags        Tag[]

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model CalendarEvent {
  id              String    @id @default(cuid())
  title           String
  description     String?
  startDate       DateTime
  endDate         DateTime
  allDay          Boolean   @default(false)
  location        String?
  color           String?
  recurrenceRule  String?

  // External sync
  source          EventSource @default(INTERNAL)
  externalId      String?

  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@unique([userId, externalId, source])
}

model GitHubRepo {
  id            String   @id @default(cuid())
  repoFullName  String   // e.g., "username/repo"
  displayName   String?
  isActive      Boolean  @default(true)
  lastSyncAt    DateTime?

  // For special integrations (e.g., meal planner)
  integrationType String?  // e.g., "meal_planner"

  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, repoFullName])
}

model UserPreferences {
  id                  String   @id @default(cuid())
  theme               String   @default("system") // light, dark, system
  defaultView         String   @default("dashboard")
  weekStartsOn        Int      @default(1) // 0 = Sunday, 1 = Monday
  dashboardLayout     Json?    // Widget positions
  enabledWidgets      String[] @default(["agenda", "habits", "tasks"])

  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Enums

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum HabitType {
  BOOLEAN
  NUMERIC
  DURATION
}

enum Frequency {
  DAILY
  WEEKLY
  MONTHLY
  CUSTOM
}

enum MemoType {
  NOTE
  ANECDOTE
  JOURNAL
  MEETING
  QUICK_THOUGHT
}

enum IdeaStatus {
  NEW
  EXPLORING
  IN_PROGRESS
  IMPLEMENTED
  ARCHIVED
}

enum EventSource {
  INTERNAL
  GOOGLE_CALENDAR
  GITHUB
}
```

---

## Application Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Main app routes
│   │   ├── layout.tsx            # Dashboard layout (sidebar + header)
│   │   ├── page.tsx              # Dashboard home
│   │   ├── tasks/
│   │   │   ├── page.tsx          # Task list/board
│   │   │   └── [id]/page.tsx     # Task detail
│   │   ├── weekly/
│   │   │   └── page.tsx          # Weekly to-do list
│   │   ├── monthly/
│   │   │   └── page.tsx          # Monthly to-do list
│   │   ├── planner/
│   │   │   ├── weekly/page.tsx   # Weekly planner/calendar
│   │   │   └── monthly/page.tsx  # Monthly planner/calendar
│   │   ├── habits/
│   │   │   ├── page.tsx          # Habit tracker
│   │   │   └── analytics/page.tsx
│   │   ├── memos/
│   │   │   ├── page.tsx          # Notes list
│   │   │   └── [id]/page.tsx     # Note detail
│   │   ├── ideas/
│   │   │   └── page.tsx          # Idea board
│   │   ├── calendar/
│   │   │   └── page.tsx          # Unified calendar
│   │   └── settings/
│   │       ├── page.tsx          # General settings
│   │       ├── categories/page.tsx
│   │       ├── integrations/page.tsx # GitHub, Google Calendar
│   │       └── preferences/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── trpc/[trpc]/route.ts
│   │   └── webhooks/
│   │       └── github/route.ts
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx
│   ├── dashboard/
│   │   ├── AgendaWidget.tsx
│   │   ├── HabitsWidget.tsx
│   │   ├── TasksWidget.tsx
│   │   ├── GitHubWidget.tsx
│   │   └── MealPlanWidget.tsx
│   ├── tasks/
│   │   ├── TaskList.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskForm.tsx
│   │   ├── KanbanBoard.tsx
│   │   └── TaskFilters.tsx
│   ├── habits/
│   │   ├── HabitCard.tsx
│   │   ├── HabitForm.tsx
│   │   ├── HabitCalendar.tsx     # Heatmap view
│   │   └── StreakDisplay.tsx
│   ├── calendar/
│   │   ├── CalendarView.tsx      # react-big-calendar wrapper
│   │   ├── EventForm.tsx
│   │   └── MiniCalendar.tsx
│   ├── memos/
│   │   ├── MemoList.tsx
│   │   ├── MemoEditor.tsx
│   │   └── TagManager.tsx
│   └── ideas/
│       ├── IdeaBoard.tsx
│       └── IdeaCard.tsx
│
├── server/
│   ├── api/
│   │   ├── root.ts               # tRPC root router
│   │   └── routers/
│   │       ├── tasks.ts
│   │       ├── habits.ts
│   │       ├── memos.ts
│   │       ├── ideas.ts
│   │       ├── calendar.ts
│   │       ├── github.ts
│   │       └── categories.ts
│   ├── auth.ts                   # NextAuth config
│   └── db.ts                     # Prisma client
│
├── lib/
│   ├── utils.ts                  # Helper functions
│   ├── constants.ts              # App constants
│   ├── hooks/                    # Custom React hooks
│   │   ├── useHabits.ts
│   │   ├── useTasks.ts
│   │   └── useCalendar.ts
│   └── stores/                   # Zustand stores
│       ├── uiStore.ts
│       └── filterStore.ts
│
├── styles/
│   └── globals.css               # Tailwind + custom styles
│
└── types/
    └── index.ts                  # TypeScript types
```

---

## Implementation Phases

### Phase 1: Foundation
- Initialize Next.js 15 + T3 Stack
- Set up Supabase project
- Configure Prisma schema
- Implement NextAuth (email + GitHub + Google OAuth)
- Set up shadcn/ui
- Create layout (sidebar, header, responsive design)
- Build settings/preferences pages

### Phase 2: Task Management
- Task CRUD with tRPC
- Category management
- Kanban board with dnd-kit
- List view with filters
- Subtasks implementation
- Weekly to-do list view
- Monthly to-do list view

### Phase 3: Notes & Ideas
- Memo CRUD operations
- Markdown editor integration
- Tag management
- Full-text search
- Quick capture modal
- Idea board (kanban)

### Phase 4: Habit Tracking
- Habit CRUD
- Daily completion logging
- Calendar heatmap (contribution graph)
- Streak calculations
- Progress charts
- Analytics dashboard

### Phase 5: Calendar & Planning
- Integrate react-big-calendar
- Event CRUD
- Weekly planner view (time-blocked)
- Monthly planner view
- Drag-to-reschedule
- Recurring events

### Phase 6: Integrations
- GitHub OAuth integration
- Repository selection and sync
- Issue/PR display in dashboard
- Google Calendar OAuth
- Two-way calendar sync
- External repo integration (meal planner example)

### Phase 7: Dashboard & Polish
- Dashboard layout with widgets
- Customizable widget arrangement
- PWA setup (Service Worker, manifest)
- Offline support with IndexedDB
- Performance optimization
- Accessibility audit
- Mobile responsiveness

---

## Key UX Principles

1. **Quick Capture**: Hotkeys and floating buttons for rapid entry of tasks, notes, ideas
2. **Keyboard Navigation**: Full keyboard support for power users
3. **Drag-and-Drop**: Intuitive reorganization throughout
4. **Contextual Actions**: Right-click menus, hover actions
5. **Search Everywhere**: Global search across all content types
6. **Responsive Design**: Full functionality on mobile
7. **Offline-First**: Works without internet, syncs when connected
8. **Minimal Friction**: Reduce clicks to accomplish common actions

---

## Success Criteria

- [ ] All core features functional and tested
- [ ] Offline support working reliably
- [ ] Google Calendar sync operational
- [ ] GitHub integration displaying repository data
- [ ] Dashboard customizable and responsive
- [ ] Performance: < 3s initial load, instant navigation
- [ ] Mobile-friendly on all views
- [ ] Data persists reliably
- [ ] Export functionality for data portability

---

## External Repository Integration Pattern

For connecting to external repos like a meal planner:

```typescript
// server/api/routers/external.ts
export const externalRouter = createTRPCRouter({
  getMealPlan: protectedProcedure
    .input(z.object({ weekOf: z.date() }))
    .query(async ({ ctx, input }) => {
      const mealPlanRepo = await ctx.db.gitHubRepo.findFirst({
        where: {
          userId: ctx.session.user.id,
          integrationType: 'meal_planner'
        }
      });

      if (!mealPlanRepo) return null;

      const octokit = new Octokit({ auth: ctx.session.user.githubToken });

      // Fetch meal plan data (adjust path based on your repo structure)
      const { data } = await octokit.rest.repos.getContent({
        owner: mealPlanRepo.repoFullName.split('/')[0],
        repo: mealPlanRepo.repoFullName.split('/')[1],
        path: `meal-plans/${format(input.weekOf, 'yyyy-MM-dd')}.json`
      });

      return JSON.parse(Buffer.from(data.content, 'base64').toString());
    })
});
```

---

## Notes

- Start with core features (tasks, habits, notes) before integrations
- Test offline sync early in development
- Use feature flags to gradually enable functionality
- Consider data export/import for user ownership
- Plan for data migration if schema changes
