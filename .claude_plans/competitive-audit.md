# Competitive Audit: Digital Filofax Gap Analysis

**Date**: 2026-02-19
**Scope**: Feature comparison across 9 competitors + Digital Filofax codebase audit
**Codebase snapshot**: 213 tRPC procedures, 29 routers, 38 Prisma models, 17 toggleable modules, 38 pages

---

## 1. Feature Comparison Matrix

### Rating Scale

| Rating | Definition |
|--------|-----------|
| **---** | Missing - Not implemented at all |
| **Basic** | Minimal implementation, not competitive |
| **Good** | Solid implementation, competitive with market |
| **Best** | Equal to or better than best-in-class competitor |
| **N/A** | Not applicable to that product's scope |

### 1.1 Task Management

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| Task CRUD | Good | Good | Best | Basic | Good | Good | Basic | Basic | --- | N/A |
| Recurring Tasks | Good | --- | Best | Basic (plugin) | Good | Good | --- | Basic | --- | N/A |
| Subtasks | Good | Good | Good | Basic | Good | Basic | Basic | Basic | --- | N/A |
| Bulk Operations | Good | Good | Good | --- | Basic | --- | --- | --- | --- | N/A |
| NLP / Natural Language Input | --- | Basic | Best | --- | Good | Basic | --- | --- | --- | N/A |
| Cursor Pagination | Good | Good | --- | N/A | --- | --- | N/A | N/A | N/A | N/A |
| Time Blocking on Tasks | Good | Basic | Basic | --- | Basic | Best | --- | --- | --- | N/A |
| Priority System | Good | Good | Good | --- | Best (Eisenhower) | Basic | --- | --- | --- | N/A |
| Urgency Calculation | Good | --- | Basic | --- | Good | --- | --- | --- | --- | N/A |
| GTD Contexts | Good | Basic (manual) | Basic (labels) | Basic (plugin) | --- | --- | --- | Basic | --- | N/A |
| Someday/Maybe | Good | Basic (manual) | --- | Basic (plugin) | --- | --- | --- | Basic | --- | Good |

**Summary**: Digital Filofax has strong task management breadth. The main gap is **NLP/natural language input** -- Todoist's ability to parse "Buy groceries tomorrow at 3pm #shopping p2" is a significant UX advantage. TickTick's Eisenhower matrix view is also notable.

### 1.2 Calendar & Scheduling

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| Monthly Calendar View | Good | Good | Basic | Basic (plugin) | Good | Good | --- | --- | Good (PDF) | N/A |
| Weekly Calendar View | Good | Good | --- | Basic (plugin) | Good | Best | --- | --- | Good (PDF) | N/A |
| Daily Planner View | Good | Basic | Basic | Basic (plugin) | Good | Best | --- | Good (journal) | Good (PDF) | N/A |
| Time Blocking | Good | Basic | --- | --- | Good | Best | --- | --- | --- | N/A |
| External Calendar Sync | --- | Good | Good | --- | Good | Best (16+ integrations) | Good (Outlook) | --- | --- | N/A |
| Combined Agenda | Good | Good | Good | --- | Good | Best | --- | --- | --- | N/A |
| Multi-Source Events | Basic | Good | Good | --- | Good | Best | Good | --- | --- | N/A |
| Drag-to-Schedule | Good | Good | --- | --- | Good | Good | --- | --- | --- | N/A |

**Summary**: Digital Filofax has solid calendar views. The critical gap is **external calendar sync** (Google Calendar, Outlook). Sunsama's 16+ integrations and guided daily planning ritual are the gold standard. Without external sync, users must maintain two calendars.

### 1.3 Habit Tracking

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| Daily Habit Tracking | Good | Basic (manual) | --- | Basic (plugin) | Good | --- | --- | Basic | Basic (PDF) | N/A |
| Streak Tracking | Good | --- | --- | Basic (plugin) | Good | --- | --- | --- | --- | N/A |
| Heatmap Visualization | Good | --- | --- | --- | Good | --- | --- | --- | --- | N/A |
| Statistics & Analytics | Good | --- | --- | --- | Good | --- | --- | --- | --- | N/A |
| Archive/Pause | Good | --- | --- | --- | Good | --- | --- | --- | --- | N/A |
| Habit-Goal Linking | Basic | --- | --- | --- | --- | --- | --- | --- | --- | N/A |

**Summary**: Habit tracking is a **competitive strength**. The Digital Filofax and TickTick are the only two products with comprehensive built-in habit tracking. Notion, Todoist, Obsidian, and Sunsama all require workarounds or plugins.

### 1.4 Note Taking / Knowledge Management

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| Quick Capture | Good | Basic | Basic | Good | Basic | --- | Best (Quick Notes) | Good (daily journal) | --- | Good |
| Rich Text Editing | Basic | Best | --- | Good (Markdown) | Basic | --- | Good | Good (Markdown) | Best (handwriting) | N/A |
| Free-Form Canvas | --- | --- | --- | Good (Canvas) | --- | --- | Best | --- | Best | N/A |
| Tags / Labels | Good | Good | Good | Best | Good | --- | Good (To-Do tags) | Good | --- | N/A |
| Full-Text Search | Basic | Good | Good | Best (local) | Basic | --- | Good (incl. OCR) | Good | Basic (OCR) | N/A |
| Backlinks / Bi-Directional Links | --- | Basic | --- | Best | --- | --- | --- | Best | --- | N/A |
| Graph View | --- | --- | --- | Best | --- | --- | --- | Good | --- | N/A |
| Block References | --- | Good | --- | Good | --- | --- | --- | Best | --- | N/A |
| Note Types (categorized) | Good | Good | --- | --- | --- | --- | Good (sections) | --- | --- | N/A |
| Handwriting / Drawing | --- | --- | --- | --- | --- | --- | Good | --- | Best | N/A |
| PDF Annotation | --- | --- | --- | Basic (plugin) | --- | --- | Good | --- | Best | N/A |

**Summary**: Note-taking is the **largest functional gap**. The Digital Filofax has memos with type categories, but lacks rich text editing, free-form canvas, backlinks, and graph views. Obsidian and Logseq dominate knowledge management. OneNote's free-form canvas and Quick Notes global hotkey are particularly relevant to the filofax metaphor.

### 1.5 Goal Setting & Tracking

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| Goal Hierarchy | Good | Good (relations) | --- | Basic (plugin) | --- | --- | --- | --- | --- | Good |
| Milestones | Good | Good | --- | --- | --- | --- | --- | --- | --- | N/A |
| Task-Goal Linking | Good | Good (relations) | --- | Basic | --- | --- | --- | --- | --- | Good |
| Progress Tracking | Good | Good | --- | --- | --- | --- | --- | --- | --- | N/A |
| Vision Board | Good | Basic | --- | --- | --- | --- | --- | --- | --- | N/A |
| Annual Goals | Good | Basic | --- | --- | --- | --- | --- | --- | --- | N/A |
| Life Roles | Good | --- | --- | --- | --- | --- | --- | --- | --- | N/A |
| OKR Framework | Basic | Good | --- | --- | --- | --- | --- | --- | --- | N/A |

**Summary**: Goal setting is a **competitive strength**. The hierarchy system (yearly > quarterly > monthly goals with milestone linking) is more structured than most competitors. Only Notion offers comparable depth through its relations/rollups system, but that requires manual configuration.

### 1.6 Planning & Reviews

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| Daily Planning Ritual | Good | --- | --- | Basic (plugin) | Basic | Best (5-step) | --- | Good (daily journal) | --- | N/A |
| Weekly Review (GTD) | Good | --- | --- | Basic (plugin) | --- | Good | --- | --- | --- | Good |
| Monthly Review | Good | --- | --- | Basic (plugin) | --- | --- | --- | --- | --- | Good |
| Yearly Review | Good | --- | --- | --- | --- | --- | --- | --- | --- | N/A |
| Guided Review Process | Good | --- | --- | --- | --- | Best | --- | --- | --- | N/A |
| Big Rocks / Priorities | Good | --- | --- | --- | --- | Good | --- | --- | --- | N/A |
| Life Roles in Planning | Good | --- | --- | --- | --- | --- | --- | --- | --- | N/A |

**Summary**: Planning and reviews are a **significant strength**. The 7-step weekly review, daily planner with top 3 priorities, and life roles integration exceed most competitors. Only Sunsama's guided daily planning ritual is more structured.

### 1.7 Financial Tracking

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| Transactions | Good | --- | --- | --- | --- | --- | --- | --- | --- | N/A |
| Budgets | Good | --- | --- | --- | --- | --- | --- | --- | --- | N/A |
| Savings Goals | Good | --- | --- | --- | --- | --- | --- | --- | --- | N/A |
| Finance Categories | Good | --- | --- | --- | --- | --- | --- | --- | --- | N/A |

**Summary**: Financial tracking is a **unique differentiator**. No competitor in this analysis includes built-in financial tracking. This mirrors the classic filofax "finance section" and is a genuine competitive advantage.

### 1.8 Collaboration

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| Shared Lists | Good | Best | Good | --- | Good | Good | Good | --- | --- | N/A |
| Role-Based Access | Good | Best | Good | --- | Basic | Good | Good | --- | --- | N/A |
| Real-Time Collaboration | --- | Best | Basic | --- | Basic | --- | Good | --- | --- | N/A |
| Comments / Discussion | --- | Best | Good | --- | Basic | --- | --- | --- | --- | N/A |
| Invites | Good | Good | Good | --- | Good | Good | Good | --- | --- | N/A |

**Summary**: Collaboration is **basic but functional**. Notion dominates with real-time collaboration, comments, and granular permissions. The Digital Filofax supports shared lists with roles, which covers the core use case for a personal planner.

### 1.9 AI / Smart Features

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| AI Writing / Generation | --- | Best (Notion AI) | --- | Basic (plugin) | --- | --- | Good (Copilot) | --- | --- | N/A |
| Smart Suggestions | Good (rule-based) | Good (AI) | Good | --- | --- | Good | --- | --- | --- | N/A |
| NLP Task Parsing | --- | --- | Best | --- | Good | Basic | --- | --- | --- | N/A |
| AI Agents / Automation | --- | Best (AI agents) | --- | --- | --- | --- | --- | --- | --- | N/A |
| Smart Scheduling | --- | --- | --- | --- | Good | Best | --- | --- | --- | N/A |
| Workflow Automation | --- | Good | Good (Zapier) | --- | --- | Good (integrations) | Good (Power Automate) | --- | --- | N/A |

**Summary**: AI features are a **significant gap**. Notion's AI agents, Todoist's NLP parsing, and Sunsama's smart scheduling are table stakes for 2026. The Digital Filofax has rule-based suggestions but no AI/LLM integration or natural language processing.

### 1.10 Import / Export & Integrations

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| JSON Export | Good | Good | Good | N/A (local files) | Basic | --- | --- | N/A | --- | N/A |
| CSV Import | Good | Good | Good | --- | Good | --- | --- | --- | --- | N/A |
| Todoist Import | Good | --- | N/A | --- | --- | Good | --- | --- | --- | N/A |
| Apple Reminders Import | Good | --- | Good | --- | --- | --- | --- | --- | --- | N/A |
| API / Integrations | --- | Good (API) | Best (60+) | Best (1500+ plugins) | Good | Best (16+ native) | Good (Microsoft 365) | Basic | --- | N/A |
| PDF Export | --- | Good | --- | Good (plugin) | --- | --- | Good | --- | Best | N/A |
| Calendar Sync (ICS/CalDAV) | --- | Good | Good | --- | Good | Best | Good | --- | --- | N/A |
| Email-to-Inbox | --- | --- | Good | --- | Good | Best | Good | --- | --- | N/A |
| Zapier/Make | --- | Good | Best | --- | Basic | Good | Good | --- | --- | N/A |
| GitHub Integration | Basic (OAuth pending) | --- | --- | Basic (plugin) | --- | Good | --- | --- | --- | N/A |

**Summary**: Import has good coverage for initial migration, but **ongoing integrations are a major gap**. No API for external tools, no calendar sync, no email-to-inbox, no Zapier/Make connectors. The GitHub integration is partially implemented. For a tool that aims to be a personal hub, the inability to pull in data from other tools is limiting.

### 1.11 Customization & Modularity

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| Module Toggle (sections) | Best | N/A | --- | Best (plugins) | --- | --- | --- | Good (plugins) | --- | N/A |
| Theme / Appearance | Basic | Good | Good | Best (CSS) | Basic | Basic | Good | Good | --- | N/A |
| Custom Dashboard Layout | Basic | Best (blocks) | --- | Good (plugin) | --- | --- | --- | --- | --- | N/A |
| Widget System | Good | Best | --- | Good (plugin) | --- | --- | --- | --- | --- | N/A |
| Template System | Good | Best | Good | Best (community) | --- | --- | Good | Good | --- | N/A |
| Custom Views / Filters | Good | Best (6 view types) | Good (saved filters) | Good (Dataview) | Basic | Basic | --- | Good (queries) | --- | N/A |
| Plugin / Extension System | --- | --- | --- | Best (1500+) | --- | --- | --- | Good | --- | N/A |
| Module Reordering | --- | Best (drag blocks) | --- | N/A | --- | --- | Good (drag sections) | --- | --- | N/A |

**Summary**: Module toggle is a **best-in-class feature** that directly maps to the filofax metaphor of adding/removing ring binder sections. However, **module reordering** (drag to rearrange sidebar order) is missing. Notion's database views and Obsidian's plugin system offer deeper customization.

### 1.12 Filofax Metaphor Fidelity

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| Tabbed Section Navigation | Basic | --- | --- | --- | --- | --- | Good (section tabs) | --- | Best (hyperlinked tabs) | N/A |
| Page Reordering / Arrangement | --- | Good (drag blocks) | --- | Good (file explorer) | --- | --- | Good (drag pages) | Good (outliner) | Good (drag pages) | N/A |
| Ring Binder / Notebook Feel | --- | --- | --- | --- | --- | --- | Good (notebook/section/page) | --- | Best (physical replica) | N/A |
| Paper-Like Aesthetics | --- | --- | --- | --- | --- | --- | --- | --- | Best | N/A |
| Day-Per-Page View | Good | --- | --- | Good (daily notes) | Good | Best | --- | Best (daily journal) | Good | N/A |
| Cross-Section Index | --- | --- | --- | --- | --- | --- | Good (Tag Summary) | --- | --- | N/A |
| Print / PDF Export for Offline | --- | Good | --- | Good | --- | --- | Good | --- | Best | N/A |
| A-Z Contacts Index | --- | --- | --- | --- | --- | --- | --- | --- | --- | N/A |
| Section Color Coding | Basic | --- | --- | --- | --- | --- | Good (section colors) | --- | Good (tab colors) | N/A |
| Custom Page Sizes / Layouts | --- | Best (any block combo) | --- | --- | --- | --- | Good (free-form) | --- | Best (PDF template sizes) | N/A |

**Summary**: The filofax metaphor is **partially realized**. The module toggle system and daily planner page are strong anchors, but visual design is generic SaaS. OneNote and GoodNotes have the highest metaphor fidelity among competitors. OneNote's notebook/section/page hierarchy and colored section tabs are the closest digital analog to a physical ring binder.

### 1.13 Mobile & Offline

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| Responsive Design | --- (broken) | Good | Best | Good | Best | Good | Good | Good | Best (native) | N/A |
| Native Mobile App | --- | Good | Best | Good | Best | Good | Good | Basic | Best (iPad) | N/A |
| PWA / Installable | --- | --- | --- | --- | --- | --- | --- | --- | N/A | N/A |
| Offline Access | --- | Basic | Good | Best (local-first) | Good | --- | Good | Best (local-first) | Best (local) | N/A |
| Sync Across Devices | --- | Good | Best | Good (paid) | Best | Good | Good | Good (Git) | Good (iCloud) | N/A |

**Summary**: Mobile and offline are **critical weaknesses**. The UX review confirmed that mobile is completely broken (sidebar does not collapse, consuming 65% of screen width). No offline capability exists. For a tool positioned as a personal planner -- inherently a portable, always-accessible object -- this is a fundamental gap.

### 1.14 Quick Capture & Entry Speed

| Feature | Digital Filofax | Notion | Todoist | Obsidian | TickTick | Sunsama | OneNote | Logseq | GoodNotes | PARA Method |
|---------|----------------|--------|---------|----------|----------|---------|---------|--------|-----------|-------------|
| Global Keyboard Shortcut | --- | Good | Best | Good | Good | --- | Best (Quick Notes) | Good | --- | N/A |
| Command Palette | --- | Good | Good | Best | --- | --- | --- | Good | --- | N/A |
| Quick Add (minimal friction) | Basic (2 clicks) | Good | Best (1 click + NLP) | Good | Good | Good | Best (0 clicks for Quick Notes) | Best (just type in daily journal) | --- | N/A |
| Voice Input | --- | --- | --- | --- | --- | --- | --- | --- | --- | N/A |
| Email-to-Inbox | --- | Good | Good | --- | Good | Best | Good | --- | --- | Good |
| Browser Extension | --- | Good | Good | --- | Good | --- | Good | --- | --- | N/A |
| Widget (Mobile Home Screen) | --- | --- | Good | --- | Good | --- | Good | --- | --- | N/A |

**Summary**: Quick capture is **below market standard**. The current flow requires 2 clicks minimum to capture anything. Todoist's single-input NLP, OneNote's global Quick Notes hotkey (captures from anywhere in the OS), and Logseq's "just start typing in today's journal" all offer significantly lower friction.

---

## 2. TOP 10 Missing Features (Ranked by Impact)

### #1: Natural Language Task Input (NLP)
**Competitors**: Todoist (best-in-class), TickTick, Sunsama
**What it is**: Parse "Call dentist tomorrow at 2pm #health !high" into a fully structured task with due date, time, category, and priority -- all from a single text input.
**Why it matters**: Reduces task capture from 5+ form fields to 1 text input. This is the single highest-impact UX improvement for a planner. Paper planners win on capture speed; NLP is the digital answer.
**Complexity**: Medium (parsing logic + UI integration)
**Filofax alignment**: High -- mimics the speed of scribbling in a physical planner

### #2: External Calendar Sync (Google Calendar, Outlook, CalDAV)
**Competitors**: Sunsama (16+ integrations), TickTick, Todoist, Notion, OneNote
**What it is**: Bi-directional sync with Google Calendar and Outlook so events appear in the Digital Filofax calendar views, and filofax events appear in external calendars.
**Why it matters**: Without calendar sync, users must maintain two systems. A filofax that does not show your meetings is incomplete. This is the #1 feature request for any personal planner.
**Complexity**: Large (OAuth flows, webhook listeners, conflict resolution, CalDAV protocol)
**Filofax alignment**: Critical -- a physical filofax's calendar IS the single source of truth

### #3: Mobile Responsive Layout (Fix Broken Mobile)
**Competitors**: All (every competitor has working mobile)
**What it is**: Collapsible sidebar (hamburger menu on mobile), responsive grids, bottom sheet modals, touch-friendly targets.
**Why it matters**: The UX audit rated mobile as "UNUSABLE" -- sidebar consumes 65% of screen width, content is truncated. A personal planner must work on a phone. This is a blocking defect.
**Complexity**: Medium (CSS breakpoints, sidebar state management, Drawer components)
**Filofax alignment**: Critical -- a filofax is inherently portable

### #4: Offline-First / PWA Architecture
**Competitors**: Obsidian (best, local-first), Logseq (local-first), TickTick, GoodNotes
**What it is**: Service worker caching, IndexedDB for local data, sync queue for pending mutations, installable PWA.
**Why it matters**: Planners are used in transit, on flights, in areas with poor connectivity. A planner that requires internet is less reliable than paper.
**Complexity**: Large (service workers, IndexedDB schema, conflict resolution, sync logic)
**Filofax alignment**: Critical -- a physical filofax never has a loading spinner

### #5: Rich Text / Markdown Editor for Notes
**Competitors**: Notion (blocks), Obsidian (Markdown), Logseq (outliner Markdown), OneNote (free-form)
**What it is**: Replace plain text memo fields with a rich text editor supporting headings, bold/italic, lists, code blocks, tables, inline images.
**Why it matters**: The memos module currently stores plain text. For a section called "Notes" to compete, it needs at minimum Markdown support. Knowledge workers expect structured note-taking.
**Complexity**: Medium (integrate Tiptap/ProseMirror or similar editor, update Prisma schema for rich content)
**Filofax alignment**: High -- physical filofax notes pages support free-form writing; digital notes should support free-form structured text

### #6: Command Palette / Global Quick Actions
**Competitors**: Obsidian (Cmd+P), Notion (Cmd+K), Todoist (Cmd+K), Logseq
**What it is**: A keyboard-triggered command palette (cmdk) that allows instant navigation ("go to habits"), quick capture ("new task Buy milk"), and command execution ("toggle dark mode") from a single input.
**Why it matters**: Power users and accessibility users rely on keyboard-first workflows. The command palette is the digital equivalent of quickly flipping to the right page in a filofax.
**Complexity**: Small (cmdk library, route mapping, action registry)
**Filofax alignment**: High -- replaces the physical act of flipping to a tab

### #7: Guided Daily Planning Ritual
**Competitors**: Sunsama (best-in-class 5-step process), Logseq (daily journal)
**What it is**: A structured morning routine that walks the user through: (1) review yesterday's unfinished tasks, (2) check calendar for today, (3) select today's top 3 priorities, (4) time-block the day, (5) set an intention. Takes 5-10 minutes.
**Why it matters**: The Daily Planner page exists but lacks a guided "morning ritual" flow. Sunsama's daily planning ritual is their primary differentiator and drives daily active usage. This builds the habit of opening the app every morning.
**Complexity**: Medium (wizard UI, data aggregation from multiple modules, time estimation)
**Filofax alignment**: Best -- the morning planning ritual is the core habit of filofax power users

### #8: Eisenhower Matrix View (Urgent/Important Quadrants)
**Competitors**: TickTick (native), Notion (template), Obsidian (plugin)
**What it is**: A 2x2 grid view that plots tasks by urgency (x-axis) and importance (y-axis). Q1 = Do Now, Q2 = Schedule, Q3 = Delegate, Q4 = Eliminate. Drag tasks between quadrants.
**Why it matters**: The app has urgency calculation but no visual quadrant view. The Eisenhower matrix is one of the most recognized productivity frameworks and particularly relevant for the Franklin Planner heritage of filofax users.
**Complexity**: Small (new view component, reuse existing priority/urgency fields)
**Filofax alignment**: High -- many premium filofax inserts include an Eisenhower matrix page

### #9: PDF Export / Print-Friendly Pages
**Competitors**: GoodNotes (native PDF), Notion (PDF export), OneNote (print), Obsidian (PDF plugin)
**What it is**: Export daily/weekly/monthly planner pages as print-ready PDFs. Print-friendly CSS media queries for direct printing.
**Why it matters**: Bridges digital and physical. Users who love paper planners want to print specific pages for offline reference. This is the unique "hybrid planner" opportunity no competitor fully exploits.
**Complexity**: Small-Medium (CSS @media print, PDF generation via Puppeteer or react-pdf)
**Filofax alignment**: Best -- literally creates physical filofax pages from digital content

### #10: Email-to-Inbox / External Capture
**Competitors**: Todoist (email forwarding), Sunsama (channel-based), TickTick, OneNote (Quick Notes)
**What it is**: A dedicated email address (or browser extension, or share sheet) that creates tasks/notes from external sources. Forward an email to capture@myfilofax.app and it becomes a task.
**Why it matters**: Capture must happen where ideas occur -- in email, browsing, reading. If capture only works inside the app, users lose items. This is a core GTD principle.
**Complexity**: Medium-Large (email parsing service, browser extension, share API)
**Filofax alignment**: Medium -- physical filofaxes have a "slip pocket" for capturing loose papers

---

## 3. Competitive Position Assessment

### 3.1 Where the Digital Filofax Excels

1. **Planning & Review Depth**: The combination of daily planner, weekly review (7-step guided process), monthly review, yearly goals, and life roles creates the most comprehensive planning system among the competitors. Only Sunsama comes close in daily planning, but lacks the yearly/role-based dimensions.

2. **Module Toggle System**: The ability to enable/disable 17 modules is the purest digital translation of a ring binder's customizability. No competitor matches this exact metaphor. Obsidian's plugin system is more powerful but less curated; Notion's block system is more flexible but less opinionated.

3. **Habit Tracking (Built-In)**: Among the 9 competitors, only TickTick has comparable built-in habit tracking. The streak tracking, heatmap visualization, and archive features are competitive.

4. **Financial Tracking**: No competitor includes built-in financial tracking. This mirrors the classic filofax "finance section" and is a genuine unique feature.

5. **Goal Hierarchy with Task Linking**: The goals > milestones > tasks > subtasks chain, combined with life roles and yearly goals, creates a vertical integration from vision to daily action that requires significant manual setup in Notion and does not exist in Todoist/TickTick.

6. **GTD Implementation Breadth**: Contexts, Someday/Maybe, Weekly Review, and Next Actions are all built in. Only OmniFocus (not in this analysis) has comparable GTD depth among mainstream tools.

7. **Feature Breadth at Zero Cost**: 213 procedures across 29 routers covering tasks, habits, calendar, notes, ideas, goals, finance, contacts, reflections, journal, templates, vision boards, analytics, and more. TickTick offers similar breadth at $36/year. Notion and Todoist charge for advanced features.

### 3.2 Where the Digital Filofax Falls Significantly Behind

1. **Mobile Experience (Critical)**: Broken. Every competitor has functional mobile. This alone disqualifies the app for daily use by most people.

2. **Integrations & Ecosystem**: Zero external integrations beyond a partially-implemented GitHub OAuth. Todoist has 60+, Sunsama has 16+, even TickTick has major calendar and email integrations. A personal hub that cannot talk to the user's other tools is an island.

3. **AI / Intelligence Layer**: No LLM integration, no NLP parsing, no smart scheduling. In 2026, Notion AI agents, Copilot in OneNote, and NLP in Todoist are setting user expectations. The rule-based suggestions system is a starting point but not competitive.

4. **Note-Taking / Knowledge Management**: Plain text memos cannot compete with Obsidian's bidirectional links and graph view, Notion's block-based editor, or even OneNote's free-form canvas. For a "digital filofax," the notes section needs to feel like actual note pages, not a database.

5. **Offline & Sync**: No offline capability, no cross-device sync strategy beyond server-side persistence. Obsidian and Logseq are local-first. Even Notion and TickTick have offline modes.

6. **Quick Capture Speed**: 2-click minimum to capture anything. Todoist, OneNote, and Logseq achieve capture in 0-1 clicks. For a planner, capture speed is existential.

7. **Visual Design / Filofax Feel**: The UX review scored the filofax metaphor at 5/10. The app looks like a standard SaaS dashboard (shadcn/ui defaults), not a planner. No paper textures, no tab dividers, no page-flip transitions, no ring binding visual cues.

### 3.3 Unique Value Proposition Opportunities

1. **"The All-in-One Personal Planner"**: No single competitor combines tasks + habits + calendar + goals + finance + contacts + journal + reflections + weekly review in one cohesive system. Notion can do all of this but requires extensive manual setup. TickTick comes close but lacks finance, contacts, goals hierarchy, and reviews.

2. **"Physical Planner Feel, Digital Power"**: If the filofax metaphor is strengthened (tabbed navigation, paper aesthetics, print-to-PDF, module reordering), the Digital Filofax occupies a unique position between GoodNotes (physical replica, no productivity logic) and Todoist/Notion (powerful but no planner feel).

3. **"Planning Methodology Hub"**: The built-in support for GTD (contexts, someday/maybe, weekly review), Franklin Covey (life roles, big rocks, priorities), and Passion Planner (vision board, goal hierarchy) makes the app uniquely methodology-agnostic. No competitor natively supports all three.

4. **"Hybrid Digital-Physical Planner"**: PDF export of daily/weekly/monthly pages creates a category-defining feature: plan digitally, print for offline use, then capture back into digital. No competitor does this well.

### 3.4 Closest Competitor & Differentiation

**Closest Match: TickTick** ($35.99/year)

TickTick is the nearest competitor in breadth: tasks, calendar, habits, Pomodoro timer, Eisenhower matrix. Both aim to be all-in-one personal productivity tools.

**Key Differentiators from TickTick**:

| Dimension | Digital Filofax Advantage | TickTick Advantage |
|-----------|--------------------------|-------------------|
| Planning & Reviews | Weekly review, life roles, yearly goals, big rocks | None |
| Finance | Built-in transactions, budgets, savings goals | None |
| Goals | Hierarchy with milestones, task linking | None |
| GTD | Contexts, Someday/Maybe, guided review | None |
| Journal & Reflections | Gratitude, mood tracking, daily/monthly reflections | None |
| Contacts | Built-in address book | None |
| Templates | Reusable task/project builders | None |
| Mobile | --- (broken) | Native iOS/Android, excellent |
| Integrations | --- (none) | Calendar sync, email, Siri, widgets |
| AI/NLP | --- (none) | Smart date parsing, natural language |
| Eisenhower Matrix | Has urgency calc, no visual view | Native quadrant view |
| Offline | --- (none) | Full offline support |

**Strategic position**: Digital Filofax has deeper planning/review features; TickTick has superior execution on the basics (mobile, offline, integrations, NLP). To win, the Digital Filofax must fix its foundational gaps (mobile, offline) while doubling down on its planning depth and filofax metaphor as differentiators.

---

## 4. OneNote-Specific Opportunities

Microsoft OneNote has the highest filofax metaphor fidelity among mainstream digital tools. Its notebook/section/page hierarchy literally mimics a ring binder with tabbed dividers. This section identifies specific OneNote features that would most enhance the Digital Filofax.

### 4.1 OneNote Features Most Relevant to the Digital Filofax

#### 4.1.1 Notebook > Section > Page Hierarchy
**OneNote**: Organizes content in Notebooks (the binder) containing Sections (tabbed dividers with colors) containing Pages (individual pages within each section). Section Groups allow nested organization.

**Adaptation for Digital Filofax**:
The existing module system maps to "Sections." What is missing is the visual hierarchy:
- The **sidebar should visually resemble tabbed dividers**, not a flat list of links
- Each module/section should have a **user-selectable color** that appears as a colored tab edge or background tint
- **Section Groups** could group related modules (e.g., "Planning" groups Daily/Weekly/Monthly planners)
- Pages within a section could be **individual entries** (e.g., each memo is a "page" within the Notes section)
- Allow **drag-and-drop reordering** of sections in the sidebar, exactly like rearranging OneNote sections

**Implementation idea**:
```
Sidebar redesign:
[=] Dashboard (home icon, no tab)
[|||] PLANNING (section group header, collapsible)
  [blue tab] Daily Planner
  [blue tab] Weekly Planner
  [blue tab] Monthly Planner
[|||] CAPTURE (section group header)
  [green tab] Memos / Notes
  [green tab] Ideas
  [green tab] Journal
[|||] TRACKING (section group header)
  [orange tab] Habits
  [orange tab] Goals
  [orange tab] Finance
...
```
Each "tab" has a colored left border (8px wide) that matches the section color. Active tab is visually "raised" or highlighted. Sections are collapsible accordion-style.

#### 4.1.2 Quick Notes (Global Capture Hotkey)
**OneNote**: A system-wide hotkey (Win+N or Win+Alt+N) opens a small floating Quick Notes window from anywhere in the OS. Users can type a note, and it is automatically saved to a "Quick Notes" section. No need to open the app first.

**Adaptation for Digital Filofax**:
- Implement a **browser-level keyboard shortcut** (e.g., Cmd+Shift+F) that opens a minimal floating capture window
- The capture window should have:
  - A single text input (auto-focused)
  - Type selector: Task | Note | Idea (defaulting to Note)
  - Optional: Quick tags/category selector
  - Press Enter to save and close
- All Quick Notes are saved to a unified **"Inbox"** that appears as a badge count on the sidebar
- The weekly review process includes a step to **"Process your Inbox"** -- review quick captures and route them to the appropriate module
- For PWA: Register a **system shortcut** that brings the capture window into focus even when the app is minimized

**Implementation complexity**: Small-Medium (new Inbox model, capture modal, keyboard listener)

#### 4.1.3 Tag Summary View
**OneNote**: Users can tag any text with "To Do," "Important," "Question," "Remember for later," etc. The **Tag Summary** feature then creates a cross-section aggregation view showing all tagged items across all notebooks and sections, grouped by tag.

**Adaptation for Digital Filofax**:
The tag system already exists (8 tRPC procedures for tags). What is missing is a **Tag Summary page** that aggregates tagged content across all modules:
- Show all items tagged "urgent" regardless of whether they are tasks, memos, ideas, or goals
- Group by tag, with filters for module type and date range
- Include a **"To-Do tag" mode** where any tagged text can be converted into a task directly from the summary view
- Add an **"Important" tag indicator** that surfaces items in the daily planner sidebar

**Implementation idea**:
```
/dashboard/tags/[tagId] (or /dashboard/tags/summary)

Tag: "Project Alpha"
--------------------
Tasks (3):
  [ ] Review project spec (Due: Feb 25)
  [ ] Set up CI pipeline (Due: Mar 1)
  [x] Create repository (Done: Feb 15)

Memos (2):
  Meeting Notes - Feb 10
  Architecture Decision Record - Feb 8

Ideas (1):
  Automated deployment pipeline (Exploring)

Goals (1):
  Launch MVP by Q2 (45% complete)
```

**Implementation complexity**: Small (new query that aggregates across models by tag, new summary page component)

#### 4.1.4 Colored Section Tabs
**OneNote**: Each section (tab) has a user-selectable background color. This color appears on the tab itself and tints the page background within that section. Users instantly recognize which section they are in by color alone.

**Adaptation for Digital Filofax**:
- Add a `color` field to the module configuration (or UserPreferences)
- Apply the color as:
  - A **left border on the sidebar tab** (4-8px colored strip)
  - A **subtle page background tint** when viewing that section (e.g., if Habits is green, the habits page has a very faint green tint)
  - The **active tab highlight color** in the sidebar
- Provide a color picker in Settings > Modules for each module
- Default colors: Tasks (blue), Habits (green), Memos (amber), Ideas (purple), Finance (emerald), Contacts (rose), Calendar (sky), Goals (orange)

**Implementation complexity**: Small (CSS custom properties per module, color storage in preferences)

#### 4.1.5 Section Templates
**OneNote**: Each section can have a **default template** applied to new pages. When a user creates a new page in the "Meeting Notes" section, it automatically uses the meeting notes template with pre-filled headings (Date, Attendees, Agenda, Action Items).

**Adaptation for Digital Filofax**:
The templates system exists (8 tRPC procedures). Enhancement: allow templates to be **auto-applied per module**:
- When creating a new memo in the "Meeting" type, auto-populate with a meeting notes template
- When creating a new daily reflection, auto-populate with the configured prompts
- When creating a new weekly review, auto-populate with the GTD checklist
- Store default template associations in UserPreferences

**Implementation complexity**: Small (template-to-module-type mapping, auto-populate on create)

#### 4.1.6 Free-Form Canvas (Partial Adaptation)
**OneNote**: Allows placing text boxes, images, and drawn content anywhere on an infinite canvas. Users can position elements freely, mimicking a physical desk or whiteboard.

**Adaptation for Digital Filofax**:
Full free-form canvas is complex, but a targeted version would enhance the Vision Board module:
- The Vision Board already supports drag-and-drop boards (15 tRPC procedures)
- Enhance with **image upload, text blocks, and freehand drawing** capabilities
- Consider using a library like Excalidraw or tldraw for the canvas
- This becomes the "creative pages" section of the filofax -- mood boards, brainstorming, visual planning

**Implementation complexity**: Large (canvas library integration, media storage)

### 4.2 OneNote-Inspired Implementation Roadmap

| Priority | Feature | Effort | Impact on Filofax Metaphor |
|----------|---------|--------|---------------------------|
| P0 | Colored Section Tabs in Sidebar | Small | High -- instant visual recognition |
| P0 | Module Reordering (drag sidebar items) | Small | High -- core ring binder interaction |
| P1 | Quick Notes / Inbox (Cmd+Shift+F capture) | Medium | High -- matches Quick Notes global hotkey |
| P1 | Tag Summary View (cross-section aggregation) | Small | Medium -- mirrors Tag Summary pane |
| P2 | Section Templates Auto-Apply | Small | Medium -- reduces friction per section |
| P2 | Page Background Tint by Section | Small | Medium -- visual section recognition |
| P3 | Section Groups (collapsible nav groups) | Small | Medium -- matches Section Groups |
| P3 | Free-Form Canvas for Vision Board | Large | Low -- niche use case |

---

## 5. Strategic Recommendations Summary

### Tier 1: Fix Foundations (Must-Do)
These are blocking defects that prevent the app from being usable as a daily planner.

1. **Fix mobile responsiveness** -- collapsible sidebar, responsive layouts
2. **Add external calendar sync** -- at minimum Google Calendar
3. **Implement NLP task input** -- single-line natural language parsing
4. **Add command palette** -- Cmd+K for navigation and quick capture

### Tier 2: Strengthen Differentiators (Should-Do)
These amplify what the Digital Filofax does better than anyone else.

5. **Add guided daily planning ritual** -- 5-step morning routine
6. **Add Eisenhower matrix view** -- visual quadrant for existing urgency data
7. **Implement PDF export** -- print daily/weekly pages for hybrid use
8. **Enhance the filofax visual metaphor** -- colored tabs, paper textures, page transitions

### Tier 3: Close Competitive Gaps (Could-Do)
These bring the app to parity with market expectations.

9. **Add offline/PWA support** -- IndexedDB cache, service worker
10. **Upgrade note editor** -- Tiptap or ProseMirror for rich text
11. **Implement OneNote-style Tag Summary** -- cross-module aggregation
12. **Add email-to-inbox capture** -- forward emails to create tasks/notes

### Tier 4: Future Differentiation (Nice-to-Have)
These create unique competitive advantages for the long term.

13. **AI integration** -- LLM-powered suggestions, auto-categorization, weekly review summaries
14. **Plugin/extension system** -- allow community contributions
15. **Cross-device sync with conflict resolution** -- real-time collaboration improvements
16. **Free-form canvas** -- Excalidraw-style visual planning pages

---

## Appendix: Competitor Quick Reference

| Competitor | Core Strength | Pricing | Best Feature for Filofax Inspiration |
|-----------|--------------|---------|--------------------------------------|
| Notion | Database flexibility, 6 view types | Free-$10/mo | Block-based custom layouts |
| Todoist | NLP task input, speed | Free-$5/mo | Natural language parsing |
| Obsidian | Local-first, graph view | Free-$50/yr sync | Plugin ecosystem, daily notes |
| TickTick | All-in-one breadth | Free-$36/yr | Eisenhower matrix, built-in habits |
| Sunsama | Daily planning ritual | $20/mo | 5-step guided daily planning |
| OneNote | Notebook/section/page hierarchy | Free (with Microsoft 365) | Section tabs, Quick Notes, Tag Summary |
| Logseq | Outliner daily journal | Free | Block references, journal-first capture |
| GoodNotes | Physical planner replica | $10 one-time | Hyperlinked PDF tabs, handwriting |
| PARA Method | Organizational framework | N/A (methodology) | Inbox-first capture, actionability sorting |

---

**Report generated**: 2026-02-19
**Data sources**: Codebase audit (213 procedures, 29 routers, 38 models), UX review (21 pages), competitor research (9 products), planning research documents
**Methodology**: Feature-by-feature comparison with ratings calibrated against market leaders in each category
