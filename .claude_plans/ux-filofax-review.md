# UX Review: Digital Filofax Metaphor Assessment

**Date**: 2026-02-21
**Reviewer**: Claude (Automated UX Audit)
**Method**: Playwright browser navigation of all 21+ pages at http://localhost:5173
**Viewport tested**: Desktop (1200x800) and Mobile (375x812 iPhone)

---

## 1. PAGE-BY-PAGE OBSERVATIONS

### /dashboard (Main Dashboard)
- **What it shows**: Welcome heading, 4 stat cards (Tasks Due Today, Active Habits, Events This Week, Notes Created), "Needs Attention" urgency section, a Weekly Review prompt banner, then a 2x3 grid of widget cards: Today's Agenda, Tasks (Due Soon), Today's Habits, Recent Ideas, Goals, Focus Timer.
- **Filofax feel**: This is more of a "command center" or "productivity dashboard" than a filofax opening page. A physical filofax opens to today's daily page, not a metrics dashboard. The stat cards (0, 3, 0, 3) feel like a SaaS analytics panel, not a personal planner.
- **What works**: The "Customize" button hints at personalization. The habits checklist and today's agenda widgets are filofax-appropriate. The Focus Timer (Pomodoro) is a nice touch.
- **What does not work**: The "Welcome back! Here's your personal command center" tagline is corporate, not personal. A filofax does not greet you with KPIs.

### /dashboard/daily (Daily Planner)
- **What it shows**: Date navigation (arrows + date button), a time-block grid (7 AM - 4 PM visible) on the left, and a right sidebar with Today's Priorities (0/3), Tasks (0), Habits (0/3 with checkboxes for "check finances", "eat", "Morning Exercise"), and Recent Notes (Test Journal Entry, Holiday ideas).
- **Filofax feel**: This is the STRONGEST filofax page. The time-block grid on the left with priorities and tasks on the right closely mirrors a "day per page" filofax layout (Franklincovey-style). The date navigation arrows simulate flipping pages.
- **What works**: The layout naturally mirrors a physical daily planner page. Time blocks, priorities, tasks, and notes all visible on one "page" is excellent.
- **What could improve**: The time blocks are empty and lack the "ruled line" feeling of a physical page. Adding subtle horizontal rules or a slight paper texture would reinforce the metaphor.

### /dashboard/planner/weekly (Weekly Planner)
- **What it shows**: A "Weekly Compass" section (prompting life roles creation), then a full 7-day calendar grid (Mon-Sun with hourly time slots from 7 AM onward), with an "Unscheduled Tasks" sidebar on the left showing a draggable "monthly task" card.
- **Filofax feel**: Moderate. The drag-and-drop scheduling is nice but the UI is closer to Google Calendar than a filofax weekly spread. A physical filofax weekly spread shows 7 days across two facing pages, often with a notes column.
- **What works**: The unscheduled tasks sidebar for drag-to-schedule is a good physical-to-digital translation. The Weekly Compass concept (tying life roles to weekly planning) is thoughtful.
- **What could improve**: The hourly grid is too granular for a weekly overview. Physical filofax weekly spreads show morning/afternoon/evening blocks, not hourly slots.

### /dashboard/planner/monthly (Monthly Planner)
- **What it shows**: A standard month calendar grid (February 2026), with events shown as colored pills on specific dates (e.g., "test" and "Team Meeting" on Feb 4). Today (Feb 21) is highlighted with a blue border. Legend shows Events (blue) and Tasks (gray).
- **Filofax feel**: Good. This is a classic "month at a glance" view that maps directly to a filofax month tab. Clean, scannable.
- **What works**: Simple, clean calendar grid. Color-coded events and tasks. Today highlighting.
- **What could improve**: Physical filofax monthly pages often have a notes section beside the calendar. The page feels sparse.

### /dashboard/monthly (Monthly Tasks)
- **What it shows**: "February 2026" header with 0/1 tasks completed progress bar. A single category card ("Uncategorized") with one task ("monthly task") and an "Add task" button.
- **Filofax feel**: Moderate. This is like a "monthly goals" section in a planner, which is common in physical planners. The category grouping is useful.
- **What works**: Clear progress tracking. Category-based organization.
- **What could improve**: The distinction between "Monthly Planner" (calendar) and "Monthly Tasks" (task list) in the navigation is confusing. Users may not understand why these are separate.

### /dashboard/tasks (Task Management)
- **What it shows**: Full task list with search, filter (by status/priority/category/context), and list/grid toggle views. Shows 6 tasks with checkboxes, priority badges (Medium/High), due dates, and 3-dot menus.
- **Filofax feel**: Low. This is a standard task management UI (Todoist/Asana style), not a planner page. Physical filofax task lists are typically simple checkbox lists.
- **What works**: Search, filtering, and the ability to toggle between list and grid view. Priority badges are clear.
- **What could improve**: The task list lacks the "page" feel. It feels like a database view. Consider adding a more lined/ruled aesthetic.

### /dashboard/habits (Habit Tracker)
- **What it shows**: GitHub-style contribution heatmap at the top, three stat cards (Best Current Streak: 0, Longest Streak Ever: 2, Total Completions: 6), Today's Progress card (0 of 3, with avg completion 6%), and individual habit cards with weekly day circles.
- **Filofax feel**: Low. The heatmap and analytics are very "app-like." Physical habit trackers are simple grids or checkbox rows.
- **What works**: The individual habit cards with Mon-Sun day circles do resemble physical habit tracker inserts. The streak data is motivating.
- **What could improve**: The heatmap is unnecessary overhead for a personal planner. A simpler monthly grid (like popular bullet journal habit trackers) would feel more filofax-appropriate.

### /dashboard/memos (Memos/Notes)
- **What it shows**: Search bar, type filter buttons (All, Note, Anecdote, Journal, Meeting, Quick Thought), and 3 memo cards in a grid layout. Each card has a type badge, title, preview text, and date.
- **Filofax feel**: Moderate. The card grid layout is like sticky notes or index cards attached to a planner. The type categorization (Note, Anecdote, Journal, Meeting, Quick Thought) is excellent and mirrors physical filofax inserts.
- **What works**: Clean card layout. Multiple memo types are very filofax-like (different colored paper for different types). Date stamps.
- **What could improve**: The cards could have slightly different background colors per type to visually distinguish them, mimicking colored paper inserts.

### /dashboard/ideas (Idea Capture)
- **What it shows**: Kanban board with three columns: New (1 item), Exploring (0), In Progress (0). One idea card showing "Automated Testing Framework" with star rating and description.
- **Filofax feel**: Low. Kanban boards are a project management tool, not a planner concept. A filofax "ideas" section would be more like a brainstorm page or list.
- **What works**: The idea pipeline concept is useful for tracking idea maturity.
- **What could improve**: Consider offering both a kanban view and a simpler "capture list" view, where the list view is the default (more planner-like).

### /dashboard/calendar
- **Status**: 404 PAGE NOT FOUND
- **Note**: The route `/dashboard/calendar` does not exist. Calendar functionality is split between `/dashboard/planner/weekly` and `/dashboard/planner/monthly`. This is actually fine since the planner pages serve this purpose, but the URL listed in the task does not work.

### /dashboard/finance (Finance)
- **What it shows**: 4 stat cards (Monthly Income, Monthly Expenses, Net This Month, Savings Goals all at $0), and a tabbed interface (Transactions, Categories, Savings Goals, Budgets) with empty state.
- **Filofax feel**: Moderate. Many physical filofaxes include a finance section with expense tracking. The tabbed layout is a reasonable digital translation.
- **What works**: Clean layout, multiple sub-sections via tabs.
- **What could improve**: Physical finance inserts are often ledger-style. A ledger aesthetic would reinforce the metaphor.

### /dashboard/contacts (Contacts)
- **What it shows**: Search bar, tabbed filter (All, Favorites, Uncategorized), and an empty state with "No contacts found" and "Add Contact" button.
- **Filofax feel**: High. An address book section is one of the most iconic filofax features. The alphabetical organization (via search) maps well.
- **What works**: Simple, recognizable layout. Favorites and categories.
- **What could improve**: Physical filofax contact sections use alphabetical tab dividers (A, B, C...). Adding an alphabetical index along the side would strongly reinforce the metaphor.

### /dashboard/goals (Goals)
- **What it shows**: 5 stat cards (Total, In Progress, Completed, Lifetime, Annual), Hierarchy/Grid view toggle, type/status filters, and empty state.
- **Filofax feel**: Moderate. Goal-setting sections exist in many premium planners. The hierarchy view concept is more like an OKR tool.
- **What works**: Clean layout, multiple views.
- **What could improve**: The "Cascade your vision into actionable objectives" tagline is corporate/OKR language. Simpler language would feel more personal.

### /dashboard/reflect (Reflections)
- **What it shows**: 3 stat cards (Total Reflections, Day Streak, Completion Rate), two card sections (Daily Reflections and Monthly Reflections) each with call-to-action buttons, and an encouraging info banner about building a reflection practice.
- **Filofax feel**: Moderate. Journaling and reflection pages are common in premium planners. The daily/monthly split is appropriate.
- **What works**: The encouragement to start a reflection practice. Clear separation of daily vs. monthly.
- **What could improve**: Could feel more like journal pages with lined/ruled aesthetic.

### /dashboard/review (Weekly Review)
- **What it shows**: Tabbed interface (New Review, History, Stats), week navigation, a 7-step guided review process with progress bar. Step 1 shows "This Week's Accomplishments" with completed tasks and habit performance data (check finances 0/7, eat 0/7, Morning Exercise 0/7).
- **Filofax feel**: Moderate-High. Weekly review pages are a staple of GTD-style planners and many filofax inserts. The guided step process is thoughtful.
- **What works**: Structured review process. Shows actual data from the week. Progress bar for completion.
- **What could improve**: The 7-step process could feel heavy. Consider making steps collapsible/skippable.

### /dashboard/settings (Settings)
- **What it shows**: Grid of setting category cards (Profile, Modules, Appearance, Notifications, Integrations, Privacy & Security, Data Export), Categories section with color-coded categories (Work, Personal, Learning, Health), Connected Services (GitHub connected, Google Calendar available), and Danger Zone.
- **Filofax feel**: N/A (settings page). But the Categories section with colored dots is visually similar to filofax colored tab dividers.
- **What works**: Clean organization. Categories with colors are excellent.

### /dashboard/settings/modules (Module Toggle)
- **What it shows**: A grid of module cards, each with icon, name, description, toggle switch, and affected routes. 17 modules total: Tasks, Habits, Memos, Ideas, Calendar, Goals, Contacts, Finance, Someday/Maybe, Journal, Planning & Reviews, GitHub, Collaboration, Analytics, Smart Suggestions, Templates, Vision Board.
- **Filofax feel**: This is the DIGITAL EQUIVALENT of adding/removing sections from a ring binder. This is one of the most filofax-appropriate features in the entire app. Toggle modules on/off = add/remove tabbed sections.
- **What works**: Toggle switches, clear descriptions, affected routes listed. Note at bottom: "Disabled modules will hide their navigation items and dashboard widgets. Your data is preserved and will reappear when you re-enable the module." This is exactly right.
- **What could improve**: The module cards could use drag-and-drop reordering to let users arrange their "binder sections" in preferred order, just like rearranging physical filofax tabs.

### /dashboard/templates (Templates)
- **What it shows**: Search, type filter dropdown, My Templates/Built-in Templates tabs. Empty state with "Create your first template!" prompt.
- **Filofax feel**: Moderate. Templates are like pre-printed filofax inserts you can buy and add to your binder.
- **What works**: The concept maps well to physical inserts.
- **What could improve**: Pre-loading some useful built-in templates would make this feel more like buying a filofax starter pack.

### /dashboard/vision (Vision Board)
- **What it shows**: Empty state with "Welcome to Vision Boards" and "Create your first vision board" prompt.
- **Filofax feel**: Low-Moderate. Vision boards are more of a Pinterest/mood-board concept than a filofax feature, but some premium planners include vision/goals visualization pages.
- **What works**: The concept of visual goal representation.

### /dashboard/someday (Someday/Maybe)
- **What it shows**: 4 stat cards (Total Items, Review Due, Tasks, Projects), search with type/category filters, and empty state.
- **Filofax feel**: Moderate. This is a GTD (Getting Things Done) concept. Many filofax users are GTD practitioners and have a "someday/maybe" section.
- **What works**: Clean layout, clear purpose.

### /dashboard/roles (Life Roles)
- **What it shows**: Empty state with "No life roles yet" explanation, "Load Default Roles" and "Create Your First Role" buttons.
- **Filofax feel**: Moderate-High. Defining life roles (Parent, Professional, Partner, etc.) and tying them to weekly planning is a Franklin Planner concept that maps well to the filofax tradition.
- **What works**: The "Load Defaults" option for quick setup.

---

## 2. QUICK CAPTURE ASSESSMENT

The "Quick Capture" button in the top header bar opens a modal dialog with three options: Task, Note, or Idea. Each is a large clickable button.

**Speed assessment**: Two clicks minimum to capture anything (1: click Quick Capture, 2: select type), then a form appears. This is slower than scribbling in a physical planner (zero-click: just write).

**Recommendation**: Consider a keyboard shortcut (Cmd+K already exists for search - maybe Cmd+N for new capture) and a single-input mode where you type first and categorize after, like a "scratchpad" that auto-classifies. The current flow adds friction that a physical planner does not have.

---

## 3. NAVIGATION ASSESSMENT (Tabbed Binder Sections)

### Sidebar Structure
The left sidebar is organized into labeled groups:
- **Ungrouped top**: Dashboard, Tasks, Weekly Tasks, Monthly Tasks
- **PLANNERS**: Life Roles, Daily Planner, Weekly Planner, Monthly Planner
- **CAPTURE**: Habits, Memos, Ideas, Contacts, Journal, Finance, GitHub, Templates
- **GOALS**: Goals, Contexts, Someday/Maybe
- **Collaborate**: Shared Lists
- **INSIGHTS**: AI Suggestions, Analytics
- **REVIEW**: Weekly Review
- **Bottom**: Settings, Collapse

### Filofax tab analogy
The grouped sidebar sections somewhat simulate filofax tab dividers. The section headers (PLANNERS, CAPTURE, GOALS, etc.) serve as section labels on tabs.

**What works**:
- Active page is highlighted with a blue background, like a tab sticking out.
- The collapse button lets users minimize the sidebar.
- Grouped navigation makes logical sense.

**What does not work**:
- The sidebar is ALWAYS visible (on desktop), creating a persistent navigation chrome. A physical filofax's tabs are visible only at the edge; the content area is the focus.
- There are too many items in the sidebar (20+ links). Physical filofaxes have 6-10 tab dividers max. The navigation is overwhelming.
- The section headers (PLANNERS, CAPTURE, GOALS, etc.) are plain text. Physical filofax tabs have distinct visual treatment (colored edges, protruding tabs).
- No visual differentiation between section groups beyond the tiny gray label text.

**Recommendation**:
- Implement collapsible sidebar sections (accordion-style) so users only see the section they are working in.
- Add colored left borders or tab-like visual indicators for each section group.
- Consider an icon-only collapsed mode (like VS Code sidebar) as the default, expanding on hover.

---

## 4. MODULE CUSTOMIZATION ASSESSMENT

The Settings > Modules page (at `/dashboard/settings/modules`) provides excellent binder customization:

- 17 toggleable modules
- Each module controls which nav items and dashboard widgets appear
- Data is preserved when modules are disabled
- Clear descriptions and affected routes for each module

**Verdict**: This is one of the app's strongest filofax features. It directly maps to the physical act of adding/removing tabbed sections from a ring binder.

**Missing capability**: Module ORDERING. In a physical filofax, you can rearrange the tab order. The app should allow drag-and-drop reordering of modules, which would change the sidebar navigation order.

---

## 5. MOBILE RESPONSIVENESS ASSESSMENT

### Critical Issue: Sidebar Does Not Collapse on Mobile

Tested at 375x812 (iPhone viewport) on three pages:

**Dashboard (mobile)**: The sidebar remains fully expanded at its desktop width (~240px), consuming roughly 65% of the 375px screen. The main content is pushed to the right edge and truncated, showing only partial text ("Dashb...", stat card icons with truncated numbers). The page is essentially UNUSABLE.

**Daily Planner (mobile)**: Same issue. The sidebar takes up the left 65%, and only a sliver of the time-block grid is visible on the right. The date navigation is not visible. UNUSABLE.

**Tasks (mobile)**: Same issue. Only the word "Tasks" and truncated description text are visible next to the sidebar. Filter buttons are partially visible but not tappable. UNUSABLE.

**Verdict**: Mobile responsiveness is BROKEN. The sidebar must collapse into a hamburger menu on mobile. This is a critical blocker for any user who wants to use their "digital filofax" on a phone -- which is one of the primary use cases for a personal planner.

---

## 6. OVERALL FILOFAX METAPHOR ASSESSMENT

### Does this FEEL like a digital filofax?

**Score: 5/10 -- It feels like a well-organized productivity app that is NAMED "Filofax" but does not viscerally FEEL like one.**

The name "Filofax" is used in the branding (logo, title), and many of the features map to filofax sections (daily planner, contacts, finance, notes). However, the visual design is a standard SaaS dashboard with shadcn/ui components. Nothing about the typography, spacing, color palette, or interaction patterns evokes the tactile experience of a ring binder.

### What creates filofax feeling (strengths):
1. **Daily Planner page** -- The strongest page. Time blocks + priorities + tasks mirrors a day-per-page layout.
2. **Module toggle system** -- Adding/removing sections = adding/removing tabbed inserts. Excellent.
3. **Monthly calendar grid** -- Classic "month at a glance" insert.
4. **Memo types** -- Note, Anecdote, Journal, Meeting, Quick Thought categories mirror different colored paper inserts.
5. **Life Roles + Weekly Compass** -- Franklin Planner methodology in digital form.
6. **Weekly Review guided process** -- Structured reflection is a planner tradition.
7. **Contacts page** -- Classic filofax section.

### What breaks the filofax feeling (weaknesses):
1. **Dashboard as landing page** -- Opens to KPI dashboard instead of today's daily planner page.
2. **Visual design is generic SaaS** -- No paper texture, no ring binding visual, no tab dividers, no pen/ink aesthetic. White cards on gray background is Notion/Linear, not Filofax.
3. **Navigation is a flat sidebar** -- Not "tabbed sections of a binder." No visual tab indicators.
4. **Too many features** -- 17 modules, 20+ nav items. A physical filofax is deliberately constrained. Feature bloat undermines the simplicity that makes physical planners appealing.
5. **Corporate/tech language** -- "Personal command center," "cascade your vision into actionable objectives," "GTD style." This language is for productivity power users, not someone who wants a personal planner.
6. **Ideas as Kanban board** -- Project management tool, not a planner page.
7. **Analytics heatmaps and charts** -- Data visualization is not a planner activity.
8. **No page-turning interaction** -- Navigating between sections has no transition that evokes flipping through a binder.
9. **Mobile is completely broken** -- A filofax is inherently portable. The app fails at the most basic mobile use case.

---

## 7. PRIORITIZED UX IMPROVEMENTS

### P0 (Critical -- must fix)
1. **Fix mobile responsiveness**: Collapse sidebar into hamburger menu on mobile viewports. This is a dealbreaker.
2. **Make Daily Planner the default landing page** instead of the dashboard. When you open a filofax, you see today's page. Offer the dashboard as a separate "overview" page.

### P1 (High -- significantly strengthens filofax metaphor)
3. **Add visual tab indicators to sidebar navigation**: Color-coded left borders or actual tab-shaped indicators for each section group (Planners = blue tab, Capture = green tab, etc.).
4. **Add module reordering**: Let users drag-and-drop to rearrange sidebar section order.
5. **Simplify the sidebar**: Make sections collapsible/accordion-style. Show icons only by default; expand labels on hover or click.
6. **Add an alphabetical index to Contacts**: Side-scroll A-Z tabs like a physical address book.
7. **Quick Capture keyboard shortcut**: Global hotkey (e.g., Cmd+Shift+N) that opens capture with cursor in a text field immediately. One-step capture.

### P2 (Medium -- enhances the feeling)
8. **Add subtle paper/texture treatment**: A very light paper texture background, slightly off-white content areas, and subtle drop shadows on "pages" would transform the visual feel without a major redesign.
9. **Page transition animations**: Add a subtle horizontal slide or "page flip" animation when navigating between sections. Even 200ms of horizontal slide would evoke page-turning.
10. **Soften the dashboard language**: Change "personal command center" to "your planner at a glance." Change "cascade your vision into actionable objectives" to "set and track your goals."
11. **Offer a simple list view for Ideas** (default) alongside the kanban view.
12. **Simplify the habit tracker**: Offer a monthly grid view (like a bullet journal habit tracker) as an alternative to the GitHub heatmap.
13. **Color-code memo cards by type**: Different subtle background colors for Note vs. Journal vs. Meeting memos.

### P3 (Nice to have -- polish)
14. **Add a "Today" floating action button** on mobile that always brings you back to today's daily planner page.
15. **Ring binding visual**: A subtle vertical line/dots pattern along the left edge of the content area evoking ring binding holes.
16. **Custom tab/section colors**: Let users pick colors for each module/section, like choosing tab divider colors.
17. **Print-friendly CSS**: Allow users to print daily/weekly pages for offline use -- bridging digital and physical.
18. **"Pen" cursor**: Change the cursor to a pen icon when hovering over editable areas.

---

## 8. BROKEN/MISSING PAGES

| Requested URL | Status |
|---|---|
| /dashboard/calendar | 404 - Route does not exist. Calendar is at /planner/weekly and /planner/monthly. |

All other requested pages loaded successfully.

---

## 9. SUMMARY

The Digital Filofax app has solid functionality across 20+ pages with a comprehensive feature set (tasks, habits, memos, ideas, finance, contacts, goals, reflections, reviews, templates, vision boards, life roles, and more). The module toggle system is an excellent digital translation of the physical binder's customizability.

However, the app currently feels like "a productivity app named Filofax" rather than "a digital filofax." The visual design, navigation patterns, and language are generic SaaS/productivity app conventions. To truly embody the filofax metaphor, the app needs:

1. **Daily Planner as the home page** (not a dashboard)
2. **Tab-like visual navigation** (not a flat sidebar)
3. **Paper-like visual design touches** (texture, softer colors, page metaphors)
4. **Working mobile experience** (critical -- currently broken)
5. **Simplified, personal language** (not corporate/tech jargon)

The strongest filofax pages are the Daily Planner and the Module Settings. Build outward from those design patterns.
