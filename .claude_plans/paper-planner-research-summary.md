# Paper Planner Research: Actionable Insights for Digital Filofax

## Research Summary

**Platforms Searched**: Filofax official sites, planning blogs, productivity forums, planner retailers
**Documentation Reviewed**: 8 major planning systems and methodologies
**Date**: 2026-02-04

---

## 1. Classic Filofax Structure

### Traditional Sections & Tabs

Based on research, classic Filofax organizers include these core sections:

1. **Diary/Calendar** - Week-on-two-pages layout (most popular format)
2. **Contacts/Address Book** - A-Z indexed with fields for name, address, phone, mobile, email
3. **Notes** - Multiple paper types (blank, dotted, ruled, graph)
4. **To-Do/Tasks** - Action lists and prioritization
5. **Financial** - Budget tracking, bills, expense logs
6. **Projects** - Project planning and tracking pages
7. **Information** - Reference materials, important data

### Key Physical Features

- **6-ring binding system** - Allows adding/removing pages anywhere
- **Pre-printed dividers** - Color-coded tabs for quick navigation
- **Multiple paper types** - Dotted, plain, ruled, graph (4mm spacing)
- **Multiple sizes** - Mini, Pocket, Personal (most popular), A5, A4

**Digital Implications**:
- Enable/disable sections per user preference
- Quick navigation between sections (sidebar/tabs)
- Support for different "page types" within sections
- Import/export sections independently

---

## 2. Modern Paper Planning Systems Analysis

### Bullet Journal (BuJo)

**Core Methodology**:
- **Rapid Logging** - Quick capture with bullets (• task, ○ event, - note)
- **Signifiers** - Symbols for priority (*, !, etc.)
- **Migration** - Monthly review of incomplete tasks (turn • into >)
- **Collections** - Custom pages for specific topics/tracking
- **Index** - Table of contents for finding entries

**What Makes It Effective**:
- Minimal setup, maximum flexibility
- "Create it yourself" mentality
- Visual progress tracking
- Regular reflection through migration
- No wasted pages

**Digital Translation**:
```json
{
  "rapid_logging": {
    "task_creation": "Quick capture with keyboard shortcuts",
    "bullet_types": ["task", "event", "note"],
    "signifiers": ["priority", "inspiration", "research_needed"]
  },
  "migration": {
    "frequency": "monthly_review",
    "action": "Review incomplete tasks, decide to migrate/delete/schedule"
  },
  "collections": {
    "type": "Custom lists/trackers",
    "examples": ["Book reading list", "Habit tracker", "Expense log"]
  },
  "index": {
    "auto_generate": true,
    "searchable": true,
    "tag_based": true
  }
}
```

### Getting Things Done (GTD)

**Core Methodology**:
- **Capture** - Collect everything in inbox
- **Clarify** - Process what each item means
- **Organize** - Put items where they belong:
  - Next Actions (do ASAP)
  - Projects (multi-step outcomes)
  - Waiting For (delegated items)
  - Someday/Maybe (future possibilities)
  - Reference (information to keep)
- **Contexts** - Group actions by location/tool (@home, @computer, @phone, @errands)
- **Weekly Review** - Review all lists, update projects

**What Makes It Effective**:
- Reduces mental burden by externalizing everything
- Context-based action lists increase efficiency
- Someday/Maybe prevents "I should do this" guilt
- Weekly review ensures nothing falls through cracks

**Digital Translation**:
```typescript
// Contexts system
enum Context {
  HOME = "@home",
  WORK = "@work",
  COMPUTER = "@computer",
  PHONE = "@phone",
  ERRANDS = "@errands",
  WAITING = "@waiting",
  PERSON = "@person_name"
}

// Lists structure
interface GTDSystem {
  inbox: Task[]
  nextActions: Task[] // Filtered by context
  projects: Project[] // Each has ≥1 next action
  somedayMaybe: Idea[]
  waiting: Task[] // Delegated items
  reference: Memo[]
  weeklyReview: ReviewChecklist
}
```

### Franklin Covey

**Core Methodology**:
- **ABC Priority System**:
  - A = Must do today (vital)
  - B = Should do (important)
  - C = Could do (trivial)
  - ABC-123 numbering (A1, A2, B1, B2...)
- **Time Management Quadrants**:
  - Q1: Urgent & Important (crises)
  - Q2: Not Urgent & Important (planning, prevention) ← Focus here
  - Q3: Urgent & Not Important (interruptions)
  - Q4: Not Urgent & Not Important (time wasters)
- **Roles & Goals** - Define life roles, set goals for each
- **Daily planning** - Prioritize based on roles and quadrants

**What Makes It Effective**:
- Clear prioritization framework
- Focus on important vs urgent distinction
- Role-based goal alignment
- Structured daily planning

**Digital Translation**:
```typescript
interface FranklinCoveyFeatures {
  priorities: {
    level: "A" | "B" | "C"
    sequence: number // A1, A2, etc.
  }
  quadrant: {
    urgent: boolean
    important: boolean
    // Q2 (not urgent, important) is ideal focus
  }
  roles: {
    name: string // "Parent", "Developer", "Health"
    goals: Goal[]
    weeklyTasks: Task[]
  }
}
```

### Passion Planner

**Core Methodology**:
- **Passion Roadmap** - Long-term goal breakdown:
  - 3-year goals
  - 1-year goals
  - 3-month goals
  - Monthly steps
- **Weekly Layout** - Time-blocked schedule + focus list
- **Monthly Reflections** - Review what worked/didn't
- **Habit Trackers** - Visual progress tracking
- **Vision Boards** - Visual goal representation

**What Makes It Effective**:
- Connects daily actions to long-term vision
- Regular reflection promotes learning
- Visual goal tracking maintains motivation
- Time-blocking prevents overcommitment

**Digital Translation**:
```typescript
interface PassionPlannerFeatures {
  passionRoadmap: {
    lifetime: Goal[]
    threeYear: Goal[]
    oneYear: Goal[]
    threeMonth: Goal[]
    monthly: Action[]
  }
  weeklyLayout: {
    timeBlocks: CalendarEvent[]
    focusList: Task[] // Top 3-5 priorities
  }
  reflection: {
    frequency: "monthly" | "weekly"
    prompts: string[]
    entries: ReflectionEntry[]
  }
  habitTracker: {
    habits: Habit[]
    visualGrid: boolean
  }
}
```

### Hobonichi Techo

**Core Methodology**:
- **One Page Per Day** - Full page for daily planning/journaling
- **Minimal Structure** - Grid paper for flexibility
- **Inspirational Quotes** - Daily motivation
- **Moon Phases** - Connection to natural rhythms
- **Lay-Flat Binding** - Easy writing experience
- **Yearly Index** - Quick date reference

**What Makes It Effective**:
- Combines planning and journaling
- Minimal structure allows creativity
- Daily quotes provide inspiration
- Grid format supports both text and drawing
- High-quality paper encourages usage

**Digital Translation**:
```typescript
interface HobonichiFeatures {
  dailyPage: {
    date: Date
    grid: boolean // Grid layout for flexibility
    quote: string // Daily inspiration
    moonPhase: string
    freeform: string // Journal/planning space
  }
  yearlyIndex: {
    monthView: true
    quickJump: true
  }
  paperQuality: "smooth" // Fast, responsive UI
}
```

---

## 3. What People Love About Paper Planners

### Psychological & Cognitive Benefits

1. **Memory Enhancement**
   - Writing by hand improves memory retention
   - Physical action stimulates brain cells that increase focus
   - Digital Implementation: Encourage detailed note-taking, not just checkboxes

2. **Tactile Satisfaction**
   - Physical act of crossing off tasks provides dopamine hit
   - Smooth pen strokes create satisfying experience
   - Digital Implementation: Satisfying animations, sounds, visual feedback for completion

3. **Visual Overview**
   - See entire week at a glance
   - Color-coding makes priorities stand out
   - Physical progress visible (pages filled)
   - Digital Implementation: Week/month views, visual progress bars, color coding

4. **Mindful Planning**
   - No multitasking - focused planning time
   - Intentional thought during writing
   - Slower pace encourages reflection
   - Digital Implementation: Dedicated planning views, minimize distractions, reflection prompts

5. **Reduced Distractions**
   - No notifications or alerts
   - Can't fall into "notification vortex"
   - Single-purpose tool
   - Digital Implementation: Distraction-free modes, optional notifications, focus timer

6. **Reliability**
   - No battery life concerns
   - No technical glitches
   - Always accessible
   - Digital Implementation: Offline-first architecture, local storage, fast load times

7. **Tangible Progress**
   - Physical stack of completed pages
   - Visual representation of time invested
   - Sense of accomplishment from filled pages
   - Digital Implementation: Progress tracking, statistics, achievement system

### Customization & Flexibility

1. **Modular Design**
   - Add/remove pages as needed
   - Keep planner slim and relevant
   - Mix and match sections
   - Digital Implementation: Enable/disable modules, customizable dashboard

2. **Personal Expression**
   - Stickers, doodles, handwriting
   - Unique to each person
   - Creative outlet
   - Digital Implementation: Themes, custom colors, emoji support, drawing/sketching

3. **Adaptive Structure**
   - Choose your own layout
   - Create custom collections
   - No wasted space
   - Digital Implementation: Customizable views, user-defined sections

---

## 4. Actionable Features for Digital Filofax

### High-Priority Features (Align with Core Strengths)

#### 1. Modular Section System
```typescript
interface ModularSystem {
  availableModules: [
    "tasks",
    "calendar",
    "contacts",
    "finance",
    "habits",
    "journal",
    "goals",
    "someday-maybe",
    "waiting-for",
    "projects",
    "ideas",
    "health",
    "review"
  ]
  userPreferences: {
    enabledModules: string[]
    moduleOrder: number[]
    dashboardWidgets: string[]
  }
}
```

**Implementation**:
- User settings page to enable/disable modules
- Sidebar dynamically shows only enabled sections
- Dashboard shows widgets from enabled modules only
- First-time setup wizard to select initial modules

#### 2. Context-Based Task Management (GTD)
```typescript
interface Task {
  // Existing fields...
  context: Context[] // @home, @computer, @phone, @errands
  nextAction: boolean // Is this a next action?
  project: Project | null // Parent project
  waitingFor: string | null // Person/thing you're waiting on
  somedayMaybe: boolean // Future possibility vs current task
}

// New view: Next Actions by Context
interface NextActionsView {
  groupBy: "context" | "project" | "priority"
  contexts: {
    [key: string]: Task[] // @home: [...tasks]
  }
}
```

**Implementation**:
- Add context multi-select to task creation
- Create "Next Actions" view filtered by context
- Add "Someday/Maybe" list (different from regular tasks)
- Add "Waiting For" list with reminder system

#### 3. ABC Priority System (Franklin Covey)
```typescript
interface Task {
  // Existing fields...
  priorityLevel: "A" | "B" | "C" | null // Must/Should/Could
  prioritySequence: number | null // A1, A2, B1, B2...
  quadrant: {
    urgent: boolean
    important: boolean
  } | null
}

// Auto-calculate quadrant
function calculateQuadrant(task: Task) {
  if (task.priority === "URGENT" && task.quadrant?.important) return "Q1"
  if (!task.priority && task.quadrant?.important) return "Q2" // Ideal
  if (task.priority === "URGENT" && !task.quadrant?.important) return "Q3"
  return "Q4"
}
```

**Implementation**:
- Add ABC priority dropdown
- Add urgent/important toggle
- Auto-number tasks within priority level
- Dashboard widget showing Q2 tasks (important, not urgent)

#### 4. Weekly Review System (GTD)
```typescript
interface WeeklyReview {
  id: string
  userId: string
  weekStartDate: Date
  completedAt: Date | null

  checklist: {
    clearInbox: boolean
    reviewNextActions: boolean
    reviewProjects: boolean // Each has ≥1 next action
    reviewWaitingFor: boolean
    reviewSomedayMaybe: boolean
    reviewCalendar: boolean // Past & future weeks
    brainstormNewIdeas: boolean
  }

  notes: string
  projectsUpdated: number
  tasksProcessed: number
}
```

**Implementation**:
- Weekly review page with interactive checklist
- Show metrics (tasks completed, projects updated)
- Prompt to review each major list
- Track review completion streak

#### 5. Passion Roadmap / Goal Hierarchy
```typescript
interface Goal {
  id: string
  userId: string
  title: string
  description: string

  timeframe: "lifetime" | "3-year" | "1-year" | "3-month" | "monthly"
  parentGoal: Goal | null // 1-year goal links to 3-year goal
  childGoals: Goal[] // 3-month goals under 1-year goal

  role: string | null // "Health", "Career", "Family"
  status: "active" | "achieved" | "abandoned"

  milestones: Milestone[]
  tasks: Task[] // Actions toward this goal
}

interface Milestone {
  title: string
  targetDate: Date
  completed: boolean
}
```

**Implementation**:
- Goal hierarchy page (lifetime → 3-year → 1-year → 3-month → monthly)
- Link tasks to goals
- Visual goal tree/roadmap
- Dashboard widget: "This Month's Goals" with progress

#### 6. Rapid Logging Interface (Bullet Journal)
```typescript
interface RapidLogEntry {
  id: string
  userId: string
  date: Date
  type: "task" | "event" | "note"
  content: string

  signifiers: {
    priority: boolean // *
    inspiration: boolean // !
    research: boolean // ?
  }

  migrated: boolean
  migratedTo: Date | null // Which month/day it moved to
  completed: boolean
}

// Quick capture interface
interface QuickCapture {
  shortcut: "Ctrl+Q" // Global keyboard shortcut
  parseInput: (text: string) => RapidLogEntry
  // "• Buy milk @errands" → Task with context
  // "○ Team meeting 2pm" → Event
  // "- Great idea about..." → Note
}
```

**Implementation**:
- Quick capture dialog (always accessible)
- Parse bullet syntax (•, ○, -)
- Auto-categorize based on input
- Monthly migration interface
- Collections builder (custom lists)

#### 7. Time Quadrant Dashboard (Franklin Covey)
```typescript
interface QuadrantDashboard {
  quadrants: {
    q1: { // Urgent & Important (crises)
      tasks: Task[]
      count: number
      alert: "Try to minimize this quadrant"
    }
    q2: { // Not Urgent & Important (planning)
      tasks: Task[]
      count: number
      highlight: "Focus here for long-term success"
    }
    q3: { // Urgent & Not Important (distractions)
      tasks: Task[]
      count: number
      warning: "Delegate or minimize these"
    }
    q4: { // Not Urgent & Not Important
      tasks: Task[]
      count: number
      advice: "Eliminate these tasks"
    }
  }
}
```

**Implementation**:
- Quadrant view on dashboard
- Drag tasks between quadrants
- Metrics on time spent per quadrant
- Coaching tips to focus on Q2

#### 8. Reflection & Review System
```typescript
interface Reflection {
  id: string
  userId: string
  type: "daily" | "weekly" | "monthly" | "yearly"
  date: Date

  prompts: {
    prompt: string
    response: string
  }[]

  // Pre-defined prompts by type
  dailyPrompts: [
    "What did I accomplish today?",
    "What challenged me?",
    "What am I grateful for?"
  ]

  weeklyPrompts: [
    "What were my wins this week?",
    "What didn't go as planned?",
    "What will I focus on next week?"
  ]

  monthlyPrompts: [
    "Did I make progress on my goals?",
    "What habits served me well?",
    "What do I want to change next month?"
  ]
}
```

**Implementation**:
- Dedicated reflection pages (daily/weekly/monthly)
- Scheduled reminders for reflections
- View past reflections (searchable)
- Dashboard widget: "This Week's Reflection"

#### 9. Life Roles & Role-Based Planning
```typescript
interface LifeRole {
  id: string
  userId: string
  name: string // "Parent", "Developer", "Health Champion"
  description: string
  color: string
  icon: string

  goals: Goal[] // Goals specific to this role
  tasks: Task[] // Weekly tasks for this role
  habits: Habit[] // Habits supporting this role

  weeklyCommitment: number // Hours per week
}

// Weekly planning by role
interface RoleBasedWeeklyPlan {
  roles: {
    role: LifeRole
    thisWeekTasks: Task[]
    timeAllocated: number
  }[]
}
```

**Implementation**:
- Life roles management page
- Assign tasks/goals to roles
- Weekly role review: "What will I do for each role this week?"
- Dashboard shows balanced role distribution

#### 10. Collections & Custom Trackers (Bullet Journal)
```typescript
interface Collection {
  id: string
  userId: string
  name: string // "Books to Read", "Movies Watched", "Expenses"
  type: "list" | "tracker" | "log" | "table"

  // For lists
  items: {
    content: string
    completed: boolean
    notes: string
  }[]

  // For trackers (habit-like)
  trackingData: {
    date: Date
    value: number | boolean | string
  }[]

  // For tables
  columns: string[]
  rows: Record<string, string>[]
}
```

**Implementation**:
- Collections page to create custom lists/trackers
- Templates for common collections (reading list, expense tracker, etc.)
- Flexible data entry
- Visual representations (graphs for tracking data)

---

## 5. Medium-Priority Features (Enhance Experience)

### Visual & UX Enhancements

1. **Satisfying Completion Animations**
   - Smooth strikethrough animation for completed tasks
   - Confetti for completing projects/goals
   - Progress bar fill animations
   - Sound effects (optional)

2. **Week-at-a-Glance View**
   - Calendar + tasks side-by-side
   - Time blocks for each day
   - Color-coding by category/role/context
   - Drag-and-drop between days

3. **Monthly/Yearly Overview**
   - Bird's-eye view of all commitments
   - Heatmap for habit tracking
   - Goal progress visualization
   - Key events highlighted

4. **Customizable Dashboard**
   - Widget system (drag to arrange)
   - Choose which widgets to show
   - Widget types:
     - Today's tasks
     - This week's goals
     - Habit tracker
     - Upcoming events
     - Recent journal entries
     - Financial summary
     - Quick capture
     - Inspirational quote

5. **Color Coding & Visual Organization**
   - Color by category
   - Color by role
   - Color by context
   - Color by priority
   - User-defined color schemes

6. **Progress Visualization**
   - Completed tasks count
   - Streak tracking (daily/weekly reviews)
   - Goal progress bars
   - Habit completion charts
   - "Year in Pixels" style overview

---

## 6. Low-Priority Features (Nice-to-Have)

1. **Daily Quotes/Inspiration** (Hobonichi-style)
   - Rotation of inspirational quotes
   - User can add custom quotes
   - Toggle on/off per preference

2. **Templates System**
   - Meeting notes template
   - Project plan template
   - Decision log template
   - User can create custom templates

3. **Monthly Migration Interface**
   - Show all incomplete tasks from last month
   - Batch action: Complete / Migrate / Delete
   - Reflection prompt: "Why didn't I complete this?"

4. **Index/Search System**
   - Full-text search across all content
   - Tag-based navigation
   - Auto-generated index
   - Recent items

5. **Export/Backup**
   - Export section as PDF
   - Export date range
   - Backup entire planner
   - Import from other systems

---

## 7. Database Schema Additions Needed

### New Models

```prisma
model Context {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name      String   // "@home", "@computer", "@phone"
  icon      String?
  color     String?

  tasks     Task[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model LifeRole {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name             String   // "Developer", "Parent", "Health"
  description      String?
  color            String?
  icon             String?
  weeklyCommitment Int?     // Hours per week

  goals            Goal[]
  tasks            Task[]
  habits           Habit[]

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([userId])
}

model Goal {
  id           String      @id @default(cuid())
  userId       String
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  title        String
  description  String?
  timeframe    GoalTimeframe

  parentGoalId String?
  parentGoal   Goal?       @relation("GoalHierarchy", fields: [parentGoalId], references: [id], onDelete: SetNull)
  childGoals   Goal[]      @relation("GoalHierarchy")

  roleId       String?
  role         LifeRole?   @relation(fields: [roleId], references: [id], onDelete: SetNull)

  status       GoalStatus  @default(ACTIVE)
  targetDate   DateTime?
  completedAt  DateTime?

  tasks        Task[]
  milestones   Milestone[]

  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@index([userId])
  @@index([parentGoalId])
  @@index([roleId])
}

enum GoalTimeframe {
  LIFETIME
  THREE_YEAR
  ONE_YEAR
  THREE_MONTH
  MONTHLY
}

enum GoalStatus {
  ACTIVE
  ACHIEVED
  ABANDONED
}

model Milestone {
  id          String   @id @default(cuid())
  goalId      String
  goal        Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)

  title       String
  targetDate  DateTime
  completed   Boolean  @default(false)
  completedAt DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([goalId])
}

model WeeklyReview {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  weekStartDate       DateTime
  completedAt         DateTime?

  clearInbox          Boolean  @default(false)
  reviewNextActions   Boolean  @default(false)
  reviewProjects      Boolean  @default(false)
  reviewWaitingFor    Boolean  @default(false)
  reviewSomedayMaybe  Boolean  @default(false)
  reviewCalendar      Boolean  @default(false)
  brainstormNewIdeas  Boolean  @default(false)

  notes               String?
  projectsUpdated     Int      @default(0)
  tasksProcessed      Int      @default(0)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([userId])
  @@index([weekStartDate])
}

model Reflection {
  id        String          @id @default(cuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  type      ReflectionType
  date      DateTime

  responses ReflectionResponse[]

  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  @@index([userId])
  @@index([date])
}

enum ReflectionType {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

model ReflectionResponse {
  id           String     @id @default(cuid())
  reflectionId String
  reflection   Reflection @relation(fields: [reflectionId], references: [id], onDelete: Cascade)

  prompt       String
  response     String

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([reflectionId])
}

model Collection {
  id             String           @id @default(cuid())
  userId         String
  user           User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  name           String
  description    String?
  type           CollectionType

  // For list collections
  items          CollectionItem[]

  // For tracker collections
  trackingData   TrackingData[]

  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([userId])
}

enum CollectionType {
  LIST
  TRACKER
  LOG
  TABLE
}

model CollectionItem {
  id           String     @id @default(cuid())
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  content      String
  completed    Boolean    @default(false)
  notes        String?
  order        Int

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([collectionId])
}

model TrackingData {
  id           String     @id @default(cuid())
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  date         DateTime
  value        String     // JSON string for flexibility

  createdAt    DateTime   @default(now())

  @@index([collectionId])
  @@index([date])
}
```

### Updates to Existing Models

```prisma
model Task {
  // Add these fields to existing Task model

  // GTD Context
  contexts       Context[]
  isNextAction   Boolean   @default(false)
  waitingFor     String?   // Person/thing waiting on
  somedayMaybe   Boolean   @default(false)

  // Franklin Covey Priority
  priorityLevel  PriorityLevel?
  prioritySeq    Int?
  isUrgent       Boolean   @default(false)
  isImportant    Boolean   @default(false)

  // Goal linkage
  goalId         String?
  goal           Goal?     @relation(fields: [goalId], references: [id], onDelete: SetNull)

  // Role linkage
  roleId         String?
  role           LifeRole? @relation(fields: [roleId], references: [id], onDelete: SetNull)
}

enum PriorityLevel {
  A  // Must do
  B  // Should do
  C  // Could do
}

model UserPreferences {
  // Add these fields to existing UserPreferences model

  enabledModules    String[]  // JSON array of enabled module names
  moduleOrder       String[]  // JSON array for sidebar order
  dashboardWidgets  String[]  // JSON array of dashboard widget IDs

  // Planning preferences
  useGTD            Boolean   @default(false)
  useFranklinCovey  Boolean   @default(false)
  useBulletJournal  Boolean   @default(false)

  // Reflection settings
  dailyReflection   Boolean   @default(false)
  weeklyReflection  Boolean   @default(true)
  monthlyReflection Boolean   @default(true)

  // Review settings
  weeklyReviewDay   Int?      // 0-6 (Sunday-Saturday)
  weeklyReviewTime  String?   // HH:MM format
}
```

---

## 8. Implementation Priority Roadmap

### Phase 1: Foundation (Already Complete)
- [x] Basic tasks, habits, calendar, memos, ideas
- [x] Categories and tags
- [x] User authentication
- [x] Dashboard

### Phase 2: Core Planning Features (Current Focus)
- [ ] Enable/disable modules system
- [ ] Contexts model and UI
- [ ] Next Actions view
- [ ] Someday/Maybe list
- [ ] Waiting For list
- [ ] Weekly review system

### Phase 3: Goal & Role System
- [ ] Goals model with hierarchy
- [ ] Life roles model
- [ ] Passion Roadmap visualization
- [ ] Link tasks to goals and roles
- [ ] Role-based weekly planning

### Phase 4: Prioritization & Quadrants
- [ ] ABC priority system
- [ ] Urgent/Important toggles
- [ ] Time quadrant dashboard
- [ ] Priority sequence auto-numbering

### Phase 5: Reflection & Review
- [ ] Reflection model and pages
- [ ] Daily/weekly/monthly prompts
- [ ] Reflection history
- [ ] Review streak tracking

### Phase 6: Collections & Custom Trackers
- [ ] Collections model
- [ ] Collection builder UI
- [ ] Templates for common collections
- [ ] Visual tracking displays

### Phase 7: UX Polish
- [ ] Completion animations
- [ ] Week-at-a-glance view
- [ ] Customizable dashboard widgets
- [ ] Color coding system
- [ ] Progress visualizations

### Phase 8: Advanced Features
- [ ] Quick capture with parsing
- [ ] Migration interface
- [ ] Templates system
- [ ] Advanced search/index
- [ ] Export/import

---

## 9. Key Takeaways for Digital Implementation

### Do's

1. **Embrace Modularity** - Let users enable only what they need
2. **Multiple Mental Models** - Support GTD, Franklin Covey, BuJo simultaneously
3. **Visual Feedback** - Satisfying animations, progress bars, color coding
4. **Flexible Structure** - Don't force one planning methodology
5. **Regular Reflection** - Build in review/reflection prompts
6. **Quick Capture** - Fast task entry is critical
7. **Context Awareness** - Show relevant info based on location/time
8. **Offline-First** - Fast, reliable, always accessible
9. **Hierarchy Support** - Goals cascade to tasks, projects to actions
10. **Role-Based Organization** - Support life roles for balanced planning

### Don'ts

1. **Don't Overwhelm** - Start simple, add features progressively
2. **Don't Force Structure** - Let users choose their planning style
3. **Don't Add Noise** - Minimize notifications, maintain focus
4. **Don't Complicate** - Keep UI clean and intuitive
5. **Don't Forget Paper Strengths** - Preserve visual overview, tactile feedback
6. **Don't Ignore Migration** - Help users process incomplete tasks
7. **Don't Skip Reviews** - Regular review is essential for effectiveness
8. **Don't Lock In** - Allow export and backup
9. **Don't Assume One Method** - Different users prefer different systems
10. **Don't Sacrifice Speed** - Fast load times and interactions are critical

### Unique Digital Advantages

While paper planners excel in certain areas, digital can offer:

1. **Search** - Find anything instantly
2. **Linking** - Connect related items across modules
3. **Automation** - Recurring tasks, reminders, auto-migration
4. **Analytics** - Progress tracking, time analysis, completion rates
5. **Sync** - Access from multiple devices
6. **Backup** - Never lose data
7. **Flexibility** - Reorganize without rewriting
8. **Integration** - Connect with calendar, email, GitHub, etc.
9. **Scalability** - Handle unlimited tasks/notes without bulk
10. **Accessibility** - Screen readers, keyboard shortcuts, responsive design

---

## 10. Research Citations

### Traditional Filofax
- [Filofax Organizer & Organizer Refill Sizes](https://us.filofax.com/pages/organizer-sizes)
- [The Original Personal Leather Organizer](https://us.filofax.com/products/the-original-personal-organizer-filofax)
- [Customizable Inserts for Filofax, Franklin & Day-Timer - Agendio](https://agendio.com/customizable-inserts)
- [Filofax Personal Organizer – Cool Tools](https://kk.org/cooltools/filofax-personal-organizer/)
- [Personal & Business Financial Filofax Sections](https://www.wendaful.com/2015/10/personal-business-financial-filofax-sections-free-printables/)

### Planning Systems
- [Why I Switched From a Bullet Journal to a Franklin Covey Planner](https://sandracarren.medium.com/why-i-switched-from-a-bullet-journal-to-a-franklin-covey-planner-for-2022-d5b5717b1d53)
- [How is Bullet Journaling different from other systems](https://www.quora.com/How-is-Bullet-Journaling-different-from-other-systems-e-g-the-Franklin-Covey-system)

### Paper vs Digital Benefits
- [5 Reasons Why Paper Planners Are Better Than Digital Planners](https://luxafor.com/5-science-backed-reasons-why-paper-planners-are-better-than-digital-planners-and-calendars/)
- [Pros and Cons of Digital and Paper Planners](https://www.erincondren.com/inspiration-center-how-to-use-digital-planners-and-paper-planners)
- [Paper vs Digital Planner? 10 Reasons to Choose Printed Planners](https://www.schoolplanner.com/paper-vs-digital-planner/)
- [In Defense of Paper Planners and To-Do Lists](https://workbrighter.co/why-paper-planners/)

### Passion Planner
- [Passion Planner | 2026 Weekly and Daily Planners](https://passionplanner.com/)
- [Weekly 2026 Planners](https://passionplanner.com/collections/weekly-2026-planners)

### Bullet Journal
- [How to Bullet Journal](https://bulletjournal.com/pages/how-to-bullet-journal)
- [What is Rapid Logging?](https://bulletjournal.com/blogs/faq/what-is-rapid-logging-understand-rapid-logging-bullets-and-signifiers)
- [Bullet Journal Rapid Logging & Migration](https://bujoing.com/bujo-rapid-log-migration/)
- [The Bullet Journal Method: A Comprehensive Guide](https://nozomunoto.com/the-bullet-journal-method-a-comprehensive-guide-to-organizing-and-prioritizing-tasks/)

### Getting Things Done (GTD)
- [GTD in 15 minutes – A Pragmatic Guide](https://hamberg.no/gtd)
- [Getting Things Done - Wikipedia](https://en.wikipedia.org/wiki/Getting_Things_Done)
- [The Getting Things Done (GTD) FAQ](https://zenhabits.net/the-getting-things-done-gtd-faq/)
- [Getting Things Done (GTD) Guide](https://super-productivity.com/guides/getting-things-done/)

### Franklin Covey
- [Covey Time Management for Prioritizing](https://www.timecounselor.com/covey-time-management.html)
- [The Franklin Covey Time Management System](https://www.mytimemanagement.com/franklin-covey.html)
- [What is the Franklin Covey Method?](https://weekplan.net/academy/glossary/franklin-covey/)
- [Franklin Planner Review](https://alifeofbalance.com/franklin-planner/)

### Hobonichi Techo
- [Planner - Techo Type Guide - Hobonichi Techo 2026](https://www.1101.com/store/techo/en/2026/all_about/planner/)
- [Hobonichi Techo Planner 2026 - A6](https://yosekastationery.com/products/hobonichi-techo-planner-2026-a6)
- [Hobonichi Techo Planner](https://thehobonichitecho.com/hobonichi-techo-planner/)

### Modular Systems
- [Modular Planner System](https://shop.minimaldesksetups.com/products/modular-planner-system)
- [Design Your Own Refill – Filofax US](https://us.filofax.com/products/design-your-own-refill)
- [2026 Personal Planner Inserts](https://crossbowplannerco.com/products/2026-personal-planner-inserts)

### Visual Organization
- [Paper vs Digital? Which is the Perfect Planner](https://www.yopandtom.com/blogs/news/paper-vs-digital-planner)
- [How Paper Planners Improve Focus in a Digital World](https://janesagenda.com/blogs/planning-101/how-paper-planners-improve-focus-in-a-digital-world)
