# Modular Productivity Systems Research
## Technical Research for Digital Filofax Enhancement

**Research Date**: 2026-02-04
**Focus**: Modular planning systems, productivity frameworks, and digital implementation patterns

---

## Executive Summary

This research analyzes modern productivity systems to identify modular, customizable features that can be implemented in a Next.js/tRPC web application. Key findings reveal that successful digital productivity systems share three core attributes:

1. **Modularity**: Users can enable/disable features based on their needs
2. **Multi-level review systems**: Daily, weekly, monthly, quarterly, and annual rhythms
3. **Flexible organization**: Support for multiple mental models (PARA, GTD, life areas, contexts)

---

## 1. MODULAR PRODUCTIVITY SYSTEMS

### Key Patterns Observed

**Obsidian and Notion Templates** provide all-in-one productivity systems combining:
- Task Management with GTD methodology
- PARA organizational framework
- Goal tracking and reviews
- Note-taking and knowledge management
- 30+ templates with 200+ resources

**Modularity Implementation**:
- Drag-and-drop customizable blocks
- Community templates as starting points
- Ability to enable/disable entire modules
- Reconfigurable system as needs change

### Digital Implementation for Filofax App

```typescript
// User Preferences Model Extension
model UserPreferences {
  // ... existing fields
  enabledModules     Json    @default("[]") // ["tasks", "goals", "habits", "journal"]
  dashboardLayout    Json    @default("{}") // Widget positions and sizes
  reviewSchedule     Json    @default("{}") // Custom review frequencies
}

// Module Registry Pattern
export const AVAILABLE_MODULES = {
  tasks: { name: "Tasks & Projects", icon: "CheckSquare", defaultEnabled: true },
  goals: { name: "Goals & OKRs", icon: "Target", defaultEnabled: false },
  habits: { name: "Habit Tracking", icon: "BarChart", defaultEnabled: true },
  journal: { name: "Journaling", icon: "BookOpen", defaultEnabled: false },
  calendar: { name: "Calendar", icon: "Calendar", defaultEnabled: true },
  contacts: { name: "Contacts", icon: "Users", defaultEnabled: false },
  finance: { name: "Finance", icon: "DollarSign", defaultEnabled: false },
  vision: { name: "Vision Board", icon: "Eye", defaultEnabled: false },
  review: { name: "Reviews", icon: "RefreshCw", defaultEnabled: false },
  someday: { name: "Someday/Maybe", icon: "Archive", defaultEnabled: false },
  roles: { name: "Life Roles", icon: "Briefcase", defaultEnabled: false },
} as const;
```

**UI Component Pattern**:
```typescript
// Dashboard Module Picker
"use client";
import { api } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";

export function ModulePicker() {
  const { data: preferences } = api.preferences.get.useQuery();
  const utils = api.useUtils();

  const toggleModule = api.preferences.toggleModule.useMutation({
    onSuccess: () => utils.preferences.get.invalidate(),
  });

  const enabledModules = preferences?.enabledModules || [];

  return (
    <div className="grid gap-4">
      {Object.entries(AVAILABLE_MODULES).map(([key, module]) => (
        <div key={key} className="flex items-center justify-between">
          <label>{module.name}</label>
          <Switch
            checked={enabledModules.includes(key)}
            onCheckedChange={(enabled) =>
              toggleModule.mutate({ module: key, enabled })
            }
          />
        </div>
      ))}
    </div>
  );
}
```

---

## 2. TIME-BLOCKING AND SCHEDULING METHODS

### Cal Newport's Time Blocking Method

**Core Principles**:
- Schedule every minute of the day in blocks
- Protect hours for "deep work" vs batching "shallow tasks"
- Uses plain text file for daily time-block plan
- Revise schedule as day evolves

**Digital Implementation Strategy**:

```typescript
// Time Block Model
model TimeBlock {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  date        DateTime
  startTime   String   // "09:00"
  endTime     String   // "11:00"
  title       String
  type        TimeBlockType // DEEP_WORK, SHALLOW_WORK, MEETING, BREAK
  taskId      String?  // Optional link to task
  task        Task?    @relation(fields: [taskId], references: [id])
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([userId, date])
}

enum TimeBlockType {
  DEEP_WORK
  SHALLOW_WORK
  MEETING
  BREAK
  PERSONAL
}
```

**Weekly Planner Enhancement**:
- Add time-blocking view alongside existing weekly task view
- Drag tasks from sidebar into time blocks
- Color-code blocks by type (deep work = purple, shallow = blue)
- Show actual vs planned time utilization
- Daily "time block template" feature for recurring schedules

### Eisenhower Matrix Integration

**Implementation Pattern**:
```typescript
// Extend Task model with priority quadrant
model Task {
  // ... existing fields
  urgency     Priority @default(MEDIUM) // HIGH = urgent, MEDIUM/LOW = not urgent
  importance  Priority @default(MEDIUM) // HIGH = important, MEDIUM/LOW = not important

  // Computed quadrant
  // Q1: urgent + important (DO NOW)
  // Q2: not urgent + important (SCHEDULE)
  // Q3: urgent + not important (DELEGATE)
  // Q4: not urgent + not important (ELIMINATE)
}
```

**UI View**:
- 2x2 grid view for tasks dashboard
- Drag tasks between quadrants
- Auto-scheduling: Q2 tasks → weekly planner
- Delegate feature: Assign to others or move to "Someday/Maybe"

---

## 3. GOAL-SETTING FRAMEWORKS

### OKRs vs SMART Goals

**Key Differences**:
| Aspect | OKRs | SMART Goals |
|--------|------|-------------|
| Timeframe | Quarterly (90 days) | Annual |
| Structure | Objective + 3-5 Key Results | Single goal with 5 criteria |
| Review Cadence | Weekly check-ins | Monthly/quarterly |
| Scope | Team/department level | Individual level |
| Completion Rate | 70% is success | 100% expected |

**Hybrid Implementation (Best of Both)**:

```typescript
// Goals Model with Hybrid Approach
model Goal {
  id            String       @id @default(cuid())
  userId        String
  user          User         @relation(fields: [userId], references: [id])
  title         String       // Objective
  description   String?      // Why this matters
  type          GoalType     // OKR, SMART, WILDLY_IMPORTANT

  // SMART Criteria
  specific      String?
  measurable    String?
  achievable    String?
  relevant      String?
  timeBound     DateTime?

  // OKR Structure
  keyResults    KeyResult[]  // 3-5 measurable outcomes

  // Timeframe
  timeframe     GoalTimeframe // QUARTERLY, ANNUAL, MULTI_YEAR
  startDate     DateTime
  targetDate    DateTime

  // Progress
  progress      Int          @default(0) // 0-100
  status        GoalStatus   @default(ON_TRACK)

  // Links
  lifeAreaId    String?
  lifeArea      LifeArea?    @relation(fields: [lifeAreaId], references: [id])
  tasks         Task[]       // Actions supporting this goal

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model KeyResult {
  id          String   @id @default(cuid())
  goalId      String
  goal        Goal     @relation(fields: [goalId], references: [id])
  title       String
  metric      String   // "Increase revenue", "Launch feature"
  baseline    Float    // Starting value
  target      Float    // Target value
  current     Float    @default(0)
  unit        String?  // "dollars", "users", "percent"

  @@index([goalId])
}

enum GoalType {
  OKR
  SMART
  WILDLY_IMPORTANT
  HABIT_BASED
}

enum GoalTimeframe {
  WEEKLY
  MONTHLY
  QUARTERLY
  ANNUAL
  MULTI_YEAR
}

enum GoalStatus {
  ON_TRACK
  AT_RISK
  OFF_TRACK
  COMPLETED
  ARCHIVED
}
```

**Dashboard Widget**:
- Show quarterly OKRs with progress bars
- Weekly check-in prompts
- Link goals to daily tasks
- Annual goals with quarterly milestones

### 12-Week Year Concept

**Implementation Pattern**:
- Default goal timeframe to 12 weeks instead of 12 months
- Built-in weekly review prompts
- Progress tracking: weekly actuals vs plan
- "Execution system" emphasis: daily/weekly actions

---

## 4. REVIEW AND REFLECTION PATTERNS

### GTD Weekly Review Checklist

**Three-Phase Structure**:

1. **Get Clear**: Process all loose ends
   - Empty inbox (tasks, memos, ideas)
   - Process calendar items from past week
   - Review "waiting for" items

2. **Get Current**: Update all items
   - Review next actions lists
   - Review project lists
   - Update task statuses

3. **Get Creative**: Plan ahead
   - Review Someday/Maybe list
   - Set intentions for next week
   - Schedule important tasks

**Digital Implementation**:

```typescript
// Weekly Review Model
model WeeklyReview {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  weekStartDate   DateTime  // Monday of the week
  completedAt     DateTime?

  // Get Clear
  inboxProcessed      Boolean @default(false)
  calendarReviewed    Boolean @default(false)
  waitingForReviewed  Boolean @default(false)

  // Get Current
  tasksReviewed       Boolean @default(false)
  projectsReviewed    Boolean @default(false)
  statusesUpdated     Boolean @default(false)

  // Get Creative
  somedayReviewed     Boolean @default(false)
  intentionsSet       Boolean @default(false)
  weekPlanned         Boolean @default(false)

  // Reflections
  wins                String?
  challenges          String?
  lessons             String?
  nextWeekFocus       String?

  createdAt           DateTime @default(now())

  @@index([userId, weekStartDate])
}
```

**UI Flow**:
- Guided weekly review wizard
- Checklist with progress indicator
- Auto-populate stats (tasks completed, habits logged)
- Prompt for qualitative reflections
- Generate "weekly compass" summary

### Multi-Level Review System

**Review Cadence Best Practices**:

| Frequency | Duration | Focus | Implementation |
|-----------|----------|-------|----------------|
| Daily | 2-5 min | Active tasks, today's plan | Morning/evening routine prompts |
| Weekly | 15-30 min | Clear inbox, update projects | GTD weekly review checklist |
| Monthly | 30-60 min | Goals progress, habits trends | Monthly retrospective template |
| Quarterly | 1-2 hours | OKRs, goal setting | Comprehensive review + planning |
| Annual | 2-4 hours | Year reflection, vision | Year in review + annual planning |

**Monthly Retrospective Template**:

```typescript
model MonthlyReview {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  month             DateTime  // First day of month
  completedAt       DateTime?

  // Auto-generated stats
  tasksCompleted    Int       @default(0)
  habitsLogged      Int       @default(0)
  goalsProgress     Json      @default("[]")

  // Reflection prompts
  highlights        String?   // What went well?
  lowlights         String?   // What didn't go well?
  learnings         String?   // What did I learn?
  gratitude         String?   // What am I grateful for?

  // Forward-looking
  nextMonthFocus    String?   // Top 3 priorities
  adjustments       String?   // What to change?

  createdAt         DateTime  @default(now())

  @@index([userId, month])
}
```

### Daily Reflection Prompts

**Morning Routine**:
- What are my top 3 priorities today?
- What's my energy level? (1-10)
- What's one thing I'm grateful for?
- What could make today great?

**Evening Routine**:
- What did I accomplish today?
- What challenged me?
- What did I learn?
- What am I grateful for?
- How well did I stick to my time blocks? (1-10)

**Implementation**:
```typescript
model DailyReflection {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id])
  date                DateTime

  // Morning
  morningEnergyLevel  Int?      // 1-10
  morningGratitude    String?
  topPriorities       String[]
  intention           String?

  // Evening
  accomplishments     String?
  challenges          String?
  learnings           String?
  eveningGratitude    String?
  timeBlockAdherence  Int?      // 1-10

  // Mood tracking
  morningMood         String?   // "energized", "anxious", "calm"
  eveningMood         String?

  createdAt           DateTime  @default(now())

  @@unique([userId, date])
}
```

---

## 5. LIFE AREAS AND CONTEXTS

### PARA Method (Projects, Areas, Resources, Archives)

**Framework Overview**:
- **Projects**: Time-bound goals with deadlines (e.g., "Launch website")
- **Areas**: Ongoing responsibilities requiring attention (e.g., "Health", "Finance")
- **Resources**: Topics of interest for future reference (e.g., "Marketing ideas")
- **Archives**: Completed or inactive items

**Organizational Principle**: Sort by **actionability**, not topic

**Digital Implementation**:

```typescript
// Life Areas Model (PARA "Areas")
model LifeArea {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String   // "Health", "Career", "Finance", "Relationships"
  description String?
  icon        String?
  color       String?

  // PARA categorization
  type        AreaType @default(PERSONAL)

  // Links
  projects    Project[] // Time-bound initiatives
  tasks       Task[]    // Ongoing responsibilities
  goals       Goal[]
  memos       Memo[]    // Resources

  // Review schedule
  reviewFrequency ReviewFrequency @default(WEEKLY)
  lastReviewed    DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}

enum AreaType {
  WORK
  PERSONAL
  HEALTH
  FINANCE
  RELATIONSHIPS
  LEARNING
  CREATIVE
}

enum ReviewFrequency {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
}

// Project Model (PARA "Projects")
model Project {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  title         String
  description   String?

  // PARA: Projects are time-bound
  deadline      DateTime?
  isActive      Boolean     @default(true)

  // Links
  lifeAreaId    String?
  lifeArea      LifeArea?   @relation(fields: [lifeAreaId], references: [id])
  tasks         Task[]
  goalId        String?
  goal          Goal?       @relation(fields: [goalId], references: [id])

  // Archive when complete
  archivedAt    DateTime?

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([userId, isActive])
}
```

**UI Views**:
- PARA sidebar navigation
- Active projects with progress
- Areas dashboard with review status
- Resources (memos) by topic
- Archives (read-only, searchable)

### GTD Contexts

**Context Types**:
- **Location-based**: @home, @office, @errands, @anywhere
- **Tool-based**: @computer, @phone, @email
- **People-based**: @boss, @spouse, @team
- **Energy-based**: @high-energy, @low-energy, @creative
- **Time-based**: @15min, @1hour, @morning

**Implementation Pattern**:

```typescript
// Context Model
model Context {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String   // "@home", "@office", "@high-energy"
  type        ContextType
  icon        String?
  color       String?

  tasks       Task[]

  @@index([userId])
}

enum ContextType {
  LOCATION
  TOOL
  PERSON
  ENERGY
  TIME
}

// Extend Task model
model Task {
  // ... existing fields
  contextId   String?
  context     Context?  @relation(fields: [contextId], references: [id])
}
```

**Smart Context Filtering**:
- Show tasks by current context (location-aware with geolocation API)
- Filter by energy level (integrate with daily reflection mood/energy)
- Show quick tasks when user has limited time
- "Next actions" view filtered by available contexts

### Life Roles Framework

**Common Life Roles**:
- Professional: Career/Business, Leadership, Expertise
- Personal: Self-care, Learning, Creative pursuits
- Relational: Partner, Parent, Friend, Family member
- Community: Volunteer, Mentor, Citizen

**Implementation**:

```typescript
model LifeRole {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  name            String   // "Software Engineer", "Parent", "Mentor"
  description     String?
  category        RoleCategory

  // Vision for this role
  visionStatement String?
  coreValues      String[] // ["Innovation", "Growth", "Impact"]

  // Weekly time allocation
  targetHoursPerWeek  Float?
  actualHoursPerWeek  Float?

  // Links
  goals           Goal[]
  tasks           Task[]
  projects        Project[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
}

enum RoleCategory {
  PROFESSIONAL
  PERSONAL
  RELATIONAL
  COMMUNITY
  HEALTH
  FINANCIAL
  SPIRITUAL
}
```

**Role-Based Weekly Planning**:
- Allocate time to each role
- Ensure balanced attention across life domains
- Weekly review by role: "Am I showing up as the person I want to be?"

---

## 6. EMERGING PRODUCTIVITY PATTERNS

### Energy Management vs Time Management

**Core Concept**: Manage work around energy levels, not just time slots

**Key Insights**:
- Physical energy: Sleep, nutrition, exercise
- Emotional energy: Mood, stress levels
- Mental energy: Focus, creativity capacity
- Spiritual energy: Purpose, alignment with values

**Digital Implementation**:

```typescript
// Energy Tracking
model EnergyLog {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  timestamp       DateTime  @default(now())

  physicalEnergy  Int       // 1-10
  emotionalEnergy Int       // 1-10
  mentalEnergy    Int       // 1-10
  spiritualEnergy Int       // 1-10

  // Context
  activity        String?   // What were you doing?
  location        String?

  @@index([userId, timestamp])
}
```

**Smart Task Scheduling**:
- Track when energy is highest
- Suggest deep work during peak mental energy
- Batch shallow tasks during low-energy periods
- Prompt for breaks when energy dips

### Interstitial Journaling

**Technique**: Write a few lines every time you transition between tasks

**Benefits**:
- Combines note-taking, tasks, and time tracking
- Increases intentionality
- Captures context switches
- Natural pomodoro-like workflow

**Implementation**:

```typescript
model InterstitialEntry {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  timestamp       DateTime  @default(now())

  // Previous task
  previousTask    String?
  unfinishedItems String?   // Lingering thoughts

  // Next task
  nextTask        String
  anxieties       String?   // Resistance or doubts
  strategy        String?   // How to tackle it

  // Metadata
  energyLevel     Int?      // 1-10
  mood            String?

  // Link to actual tasks
  taskId          String?
  task            Task?     @relation(fields: [taskId], references: [id])

  @@index([userId, timestamp])
}
```

**UI Implementation**:
- "Start new task" button triggers interstitial prompt
- Quick 3-question form (2 min max)
- Auto-generates timeline view of day
- Integrates with time tracking

### Progressive Summarization

**Technique**: Distill notes in layers, highlighting key points progressively

**Layers**:
1. Raw notes (capture everything)
2. Bold main points (10-20% of layer 1)
3. Highlight critical insights (10-20% of layer 2)
4. Executive summary (top of note)

**Implementation for Memos**:

```typescript
model Memo {
  // ... existing fields

  // Progressive summarization layers
  rawContent      String    // Layer 1: Original capture
  highlighted     Json?     // Layer 2: Bold sections (character ranges)
  keyInsights     String[]  // Layer 3: Critical points
  summary         String?   // Layer 4: Executive summary

  distillationLevel Int @default(1) // 1-4
  lastDistilled     DateTime?
}
```

**UI Features**:
- Rich text editor with bold/highlight tools
- "Distill" button to add layer
- Summary view showing only key insights
- Search prioritizes higher distillation levels

### Customizable Dashboard Widgets

**Widget Types**:
- Quick capture (tasks, ideas, memos)
- Today's schedule (time blocks)
- Habit streak tracker
- Goal progress bars
- Recent reflections
- Weekly review checklist
- Focus timer (Pomodoro)
- Energy level tracker
- Life areas health check
- Upcoming deadlines

**Implementation**:

```typescript
model DashboardWidget {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])

  widgetType  WidgetType
  position    Int       // Grid position
  size        WidgetSize
  settings    Json      @default("{}")
  isVisible   Boolean   @default(true)

  createdAt   DateTime  @default(now())

  @@index([userId])
}

enum WidgetType {
  QUICK_CAPTURE
  TODAY_SCHEDULE
  HABIT_TRACKER
  GOAL_PROGRESS
  WEEKLY_REVIEW
  FOCUS_TIMER
  ENERGY_TRACKER
  UPCOMING_DEADLINES
  LIFE_AREAS_HEALTH
  RECENT_REFLECTIONS
}

enum WidgetSize {
  SMALL   // 1x1
  MEDIUM  // 2x1
  LARGE   // 2x2
  WIDE    // 3x1
}
```

**Dashboard Customization UI**:
- Drag-and-drop widget positioning
- Resize widgets
- Add/remove widgets from library
- Save layout presets
- Mobile-responsive (stack vertically)

---

## 7. ACTIONABLE FEATURE ROADMAP

### Phase 1: Foundation (Immediate)
- [ ] Module toggle system in settings
- [ ] Life Areas CRUD operations
- [ ] Context tagging for tasks
- [ ] Basic weekly review checklist
- [ ] Daily reflection prompts (morning/evening)

### Phase 2: Planning & Reviews (Short-term)
- [ ] Time-blocking interface on weekly planner
- [ ] Eisenhower matrix task view
- [ ] Monthly review template
- [ ] Quarterly goal setting (OKR structure)
- [ ] Projects with deadlines (PARA)

### Phase 3: Advanced Productivity (Medium-term)
- [ ] Energy tracking and analytics
- [ ] Interstitial journaling integration
- [ ] Someday/Maybe list with review prompts
- [ ] Life roles framework
- [ ] Custom review schedules per life area

### Phase 4: Intelligence & Insights (Long-term)
- [ ] Smart task suggestions based on context/energy
- [ ] Habit-goal correlation analytics
- [ ] Weekly compass auto-generation
- [ ] Progressive summarization for memos
- [ ] Custom dashboard widget system

---

## 8. IMPLEMENTATION PATTERNS FOR NEXT.JS/TRPC

### Module System Architecture

```typescript
// src/lib/modules.ts
export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  routes: string[];
  dependencies?: string[]; // Required modules
  widgets?: string[];      // Available dashboard widgets
  defaultEnabled: boolean;
}

export const MODULE_REGISTRY: Record<string, Module> = {
  tasks: {
    id: "tasks",
    name: "Tasks & Projects",
    description: "GTD-style task management with projects and next actions",
    icon: "CheckSquare",
    routes: ["/dashboard/tasks", "/dashboard/planner"],
    widgets: ["quick-capture", "upcoming-deadlines"],
    defaultEnabled: true,
  },
  goals: {
    id: "goals",
    name: "Goals & OKRs",
    description: "Set and track quarterly OKRs and annual goals",
    icon: "Target",
    routes: ["/dashboard/goals"],
    widgets: ["goal-progress", "quarterly-okrs"],
    dependencies: ["tasks"], // Goals link to tasks
    defaultEnabled: false,
  },
  // ... more modules
};

// Module guard for routes
export function useModuleAccess(moduleId: string) {
  const { data: preferences } = api.preferences.get.useQuery();
  const enabledModules = preferences?.enabledModules || [];

  return {
    hasAccess: enabledModules.includes(moduleId),
    module: MODULE_REGISTRY[moduleId],
  };
}
```

### tRPC Router Pattern for Reviews

```typescript
// src/server/api/routers/reviews.ts
export const reviewsRouter = createTRPCRouter({
  // Get current weekly review (or create if doesn't exist)
  getCurrentWeekly: protectedProcedure
    .query(async ({ ctx }) => {
      const weekStart = startOfWeek(new Date());

      let review = await ctx.db.weeklyReview.findFirst({
        where: {
          userId: ctx.session.user.id,
          weekStartDate: weekStart,
        },
      });

      if (!review) {
        review = await ctx.db.weeklyReview.create({
          data: {
            userId: ctx.session.user.id,
            weekStartDate: weekStart,
          },
        });
      }

      return review;
    }),

  // Update checklist item
  updateChecklistItem: protectedProcedure
    .input(z.object({
      reviewId: z.string(),
      field: z.enum([
        "inboxProcessed",
        "calendarReviewed",
        "waitingForReviewed",
        "tasksReviewed",
        "projectsReviewed",
        "statusesUpdated",
        "somedayReviewed",
        "intentionsSet",
        "weekPlanned",
      ]),
      value: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.weeklyReview.update({
        where: { id: input.reviewId },
        data: { [input.field]: input.value },
      });
    }),

  // Save reflections
  saveReflections: protectedProcedure
    .input(z.object({
      reviewId: z.string(),
      wins: z.string().optional(),
      challenges: z.string().optional(),
      lessons: z.string().optional(),
      nextWeekFocus: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { reviewId, ...reflections } = input;

      return ctx.db.weeklyReview.update({
        where: { id: reviewId },
        data: {
          ...reflections,
          completedAt: new Date(),
        },
      });
    }),

  // Get review stats (auto-populate)
  getWeeklyStats: protectedProcedure
    .input(z.object({ weekStartDate: z.date() }))
    .query(async ({ ctx, input }) => {
      const weekEnd = endOfWeek(input.weekStartDate);

      const tasksCompleted = await ctx.db.task.count({
        where: {
          userId: ctx.session.user.id,
          status: "DONE",
          updatedAt: {
            gte: input.weekStartDate,
            lte: weekEnd,
          },
        },
      });

      const habitsLogged = await ctx.db.habitLog.count({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: input.weekStartDate,
            lte: weekEnd,
          },
        },
      });

      return { tasksCompleted, habitsLogged };
    }),
});
```

### Conditional Sidebar Navigation

```typescript
// src/components/layout/sidebar.tsx
"use client";
import { api } from "@/lib/trpc";
import { MODULE_REGISTRY } from "@/lib/modules";

export function Sidebar() {
  const { data: preferences } = api.preferences.get.useQuery();
  const enabledModules = preferences?.enabledModules || [];

  const visibleModules = Object.values(MODULE_REGISTRY).filter((module) =>
    enabledModules.includes(module.id)
  );

  return (
    <nav>
      {visibleModules.map((module) => (
        <SidebarLink
          key={module.id}
          href={module.routes[0]}
          icon={module.icon}
          label={module.name}
        />
      ))}
    </nav>
  );
}
```

---

## 9. KEY TECHNICAL DECISIONS

### Database Design Principles

1. **User-scoped everything**: Every model has `userId` field with index
2. **Flexible JSON for customization**: Use `Json` type for user preferences, widget settings
3. **Soft deletes for archives**: Use `archivedAt` timestamp instead of hard deletes
4. **Timestamp everything**: `createdAt` and `updatedAt` on all models
5. **Denormalize for performance**: Cache computed values (e.g., goal progress)

### State Management Strategy

1. **Server state**: tRPC + React Query (queries, mutations)
2. **UI state**: React hooks (modals, forms, local UI)
3. **Persistent UI preferences**: Database (UserPreferences model)
4. **Real-time updates**: Optimistic updates + cache invalidation

### Mobile-First Responsive Design

1. **Dashboard widgets**: Grid on desktop, stack on mobile
2. **Time blocking**: Horizontal scroll on mobile
3. **Navigation**: Collapsible sidebar → bottom nav on mobile
4. **Forms**: Full-screen modals on mobile

---

## 10. COMPETITIVE ANALYSIS SUMMARY

### Strengths of Leading Systems

**Notion**:
- Extreme flexibility with blocks
- Templates marketplace
- Database views (table, board, calendar)

**Obsidian**:
- Local-first, markdown-based
- Graph view for connections
- Plugin ecosystem

**Todoist**:
- Simplicity and speed
- Natural language input
- Cross-platform sync

**OmniFocus**:
- Deep GTD implementation
- Powerful perspectives (custom views)
- Review system built-in

### Differentiation Opportunities for Digital Filofax

1. **Opinionated defaults with escape hatches**: Start with GTD + PARA, allow customization
2. **Review-first design**: Weekly reviews as core habit, not afterthought
3. **Life balance dashboard**: Visual health check across life areas
4. **Energy-aware scheduling**: Match tasks to energy levels
5. **Integrated reflection**: Journaling built into task system, not separate app

---

## Sources

### Modular Productivity Systems
- [I created an all-in-one productivity template for Obsidian](https://forum.obsidian.md/t/i-created-an-all-in-one-productivity-template-for-obsidian-task-management-gtd-para-goal-tracking-reviews-and-more/85792)
- [Obsidian Life OS](https://notionstack.so/templates/obsidian-life-os)
- [Notion vs Obsidian comparison](https://www.productivetemply.com/blog/notion-vs-obsidian)

### Time Blocking & Scheduling
- [Cal Newport's Time Blocking Method](https://www.todoist.com/productivity-methods/time-blocking)
- [Text File Time Blocking](https://calnewport.com/text-file-time-blocking/)
- [A Comprehensive Guide on Time Blocking](https://www.roxanamurariu.com/time-blocking/)

### Goal Setting Frameworks
- [SMART Goals vs OKRs](https://www.smartsheet.com/content/okr-vs-smart-goals)
- [OKR vs SMART Goals: Key Differences](https://www.thrivesparrow.com/blog/okr-vs-smart-goals)
- [SMART Goals & OKRs: Build Your Perfect Goal System](https://goalsandprogress.com/framework-hybridization-smart-goals-okrs/)

### Review & Reflection
- [The Weekly Review: A Productivity Ritual](https://www.todoist.com/productivity-methods/weekly-review)
- [The Ultimate Guide to GTD Weekly Review](https://www.asianefficiency.com/productivity/gtd-weekly-review/)
- [How to write weekly, monthly, and annual reviews](https://blog.rescuetime.com/weekly-monthly-annual-reviews/)

### Life Areas & Organization
- [The PARA Method](https://fortelabs.com/blog/para/)
- [How To Boost Productivity with a Personal Organization System](https://theremotejobcoach.com/blog/how-to-increase-your-productivity-in-life-and-be-better-at-organization)
- [Achieving Optimal Life Balance: 20 Areas](https://strategium.cc/life-balance-and-areas-of-life-for-personal-strategy/)

### Dashboard Widgets
- [10 Best Project Dashboards for 2026](https://thedigitalprojectmanager.com/tools/project-dashboard-software/)
- [The best personal dashboard apps](https://blog.adenin.com/best-personal-dashboards/)

### PARA Method Deep Dive
- [The PARA Method Implementation Guide](https://thomasjfrank.com/productivity/how-to-easily-organize-your-life-with-the-para-method/)
- [PARA Method in Workflowy](https://workflowy.com/systems/para-method/)

### Progressive Summarization
- [Progressive Summarization: A Practical Technique](https://fortelabs.com/blog/progressive-summarization-a-practical-technique-for-designing-discoverable-notes/)
- [Building a Second Brain Summary](https://www.samuelthomasdavies.com/book-summaries/business/building-a-second-brain/)

### Habit Tracking
- [Build Better Habits With Bullet Journal Tracking](https://www.rosebud.app/blog/habit-tracker-bullet-journal)
- [Intentional Habit Tracking](https://bulletjournal.com/blogs/bulletjournalist/intentional-habit-tracking)

### Life Roles Framework
- [Work-Life Balance: Toward an Integrated Framework](https://www.anzam.org/wp-content/uploads/pdf-manager/1294_HADDON_BARBARA-362.PDF)
- [Work-Life Harmony: A Fresh Look](https://www.positivepsych.edu.sg/work-life-harmony/)

### Energy Management
- [Energy Management vs Time Management](https://www.improvementsavvy.com/energy-management-vs-time-management/)
- [Managing Energy Not Time](https://www.lifehack.org/991281/managing-energy-not-time)
- [Find Your Most Productive Time](https://collegeinfogeek.com/track-body-energy-focus-levels/)

### GTD Contexts
- [GTD Contexts — Theoretical & Practical Guide](https://facilethings.com/blog/en/gtd-contexts)
- [GTD Next Actions Guide](https://super-productivity.com/blog/gtd-next-actions-guide/)
- [Best GTD Apps for 2026](https://toolfinder.co/best/gtd-task-management-apps)

### Someday/Maybe
- [Managing the Someday Maybes with GTD](https://facilethings.com/blog/en/someday-maybes)
- [The Someday/Maybe List: Your Personal Productivity Storage](https://facilethings.com/blog/en/the-someday-maybe-list)

### Interstitial Journaling
- [Interstitial journaling: combining notes, to-do & time tracking](https://nesslabs.com/interstitial-journaling)
- [Replace Your To-Do List With Interstitial Journaling](https://betterhumans.pub/replace-your-to-do-list-with-interstitial-journaling-to-increase-productivity-4e43109d15ef)
- [How to do Interstitial Journaling With Notion](https://goodhartphotographyva.com/interstitial-journaling-with-notion/)

### Feature Toggles
- [Feature Toggle: A Comprehensive Guide](https://dev.to/devcorner/feature-toggle-a-comprehensive-guide-1din)
- [The Digital Planning Guide](https://onplanners.com/digital-planning-guide)

---

## Conclusion

Modern productivity systems succeed through **modularity, multi-level reviews, and flexible organization**. The digital Filofax should:

1. **Start opinionated**: Default to GTD + PARA + weekly reviews
2. **Allow customization**: Module toggles, custom life areas, personal contexts
3. **Emphasize reviews**: Make weekly/monthly reviews delightful, not chores
4. **Match energy to work**: Smart scheduling based on energy patterns
5. **Integrate reflection**: Journaling as part of planning, not separate

The technical implementation leverages Next.js/tRPC patterns with user-scoped data, JSON flexibility for customization, and React Query for optimal UX.

**Next Step**: Prioritize Phase 1 features and begin implementation with module toggle system.
