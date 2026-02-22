# Digital Filofax: Prioritized Transformation Roadmap

**Date**: 2026-02-19
**Synthesized from**: Competitive audit (9 competitors), UX filofax-metaphor review (21 pages), app review report (4-agent team)
**Codebase snapshot**: 30 tRPC routers, 213 procedures, 38 Prisma models, 17 toggleable modules, 38 pages, 320 tests

---

## 1. Executive Summary

The Digital Filofax is a technically sound full-stack application with exceptional feature breadth -- 17 toggleable modules covering tasks, habits, calendar, goals, finance, contacts, journal, reflections, and more. Its planning and review depth (daily planner, 7-step weekly review, yearly goals, life roles) exceeds every competitor analyzed. However, the app currently feels like a well-organized SaaS productivity dashboard that happens to be named "Filofax." Mobile is completely broken (sidebar consumes 65% of screen width), the visual design is generic shadcn/ui defaults with no planner aesthetics, and critical integration points (calendar sync, NLP input, offline) are absent. The opportunity is clear: fix the foundation, then invest the filofax metaphor into every pixel and interaction -- colored section tabs, paper textures, page-flip navigation, daily planner as the landing page -- to occupy the unique market position of "physical planner feel, digital power." No competitor owns this space. GoodNotes replicates paper but lacks productivity logic. Todoist and Notion have the logic but no planner soul. The Digital Filofax can be both.

---

## 2. Strategic Pillars

All roadmap decisions are guided by four strategic pillars:

### Pillar 1: Filofax Identity
Every feature and design choice should reinforce the ring-binder planner metaphor. The app should look, feel, and behave like a personal planner -- not a project management tool or analytics dashboard. Colored section tabs, paper textures, page transitions, personal language, and the daily planner as the front page.

### Pillar 2: Capture Speed
A planner lives or dies by how quickly you can write something down. Every interaction that adds friction to capture (extra clicks, form fields, page navigation) is a failure. NLP input, keyboard shortcuts, command palette, and inbox-first capture must reduce the current 2-click minimum to zero-click flow.

### Pillar 3: Always Available
A filofax is inherently portable and always accessible. The digital version must work on phones (responsive mobile), work without internet (offline/PWA), and sync with the user's existing calendar (Google Calendar integration). A planner that requires a desktop browser and internet connection is less reliable than paper.

### Pillar 4: Planning Depth as Differentiator
The app's competitive moat is its planning and review system (daily planner, weekly review, yearly goals, life roles, GTD contexts, Eisenhower urgency). Rather than chasing feature parity with Notion's flexibility or Obsidian's knowledge graph, double down on structured planning workflows that guide users from vision to daily action.

---

## 3. Phased Roadmap

### Phase 1: Foundation Fixes (Week 1-2)

**Theme**: Fix what is broken, make the app usable on mobile, resolve all critical and high-severity bugs.

#### 1.1 Fix `/dashboard/reflect` infinite query loop
- **What**: The reflections overview page enters an infinite loop of `reflections.getDailyRange` tRPC calls. The page never finishes loading.
- **Why**: Critical bug -- the page is unusable. Likely caused by a cascading `useQuery` hook where each result changes query parameters, triggering a re-render cycle.
- **Effort**: 2-4 hours
- **Files**:
  - `src/app/dashboard/reflect/page.tsx` -- fix the query dependency cycle
  - `tests/routers/reflections.test.ts` -- verify fix

#### 1.2 Fix `suggestions.ts` task ownership bypass
- **What**: The `applySuggestion` helper updates tasks by `suggestion.taskId` without verifying the current user owns the task. A user could theoretically modify another user's task via a suggestion.
- **Why**: High-severity security issue -- violates the user-scoping principle.
- **Effort**: 1-2 hours
- **Files**:
  - `src/server/api/routers/suggestions.ts` (lines ~231-316) -- add `userId: ctx.session.user.id` to where clauses in all task updates

#### 1.3 Fix `templates.ts` duplicate OR clause
- **What**: When both `includePublic` and `search` are provided in `getAll`, the second `OR` overwrites the first at the same object level, producing incorrect query results.
- **Why**: High-severity bug -- template search returns wrong results when filtering by public + search simultaneously.
- **Effort**: 1 hour
- **Files**:
  - `src/server/api/routers/templates.ts` (lines ~18-30) -- wrap in `AND` to combine conditions

#### 1.4 Mobile responsive layout (sidebar collapse)
- **What**: Implement a collapsible sidebar that transforms into a hamburger menu on mobile viewports (<768px). The sidebar currently renders at full desktop width (~240px), consuming 65% of a 375px mobile screen, making every page unusable.
- **Why**: Critical blocker -- mobile is the primary use case for a personal planner. Every competitor has working mobile. The UX review rated this as "UNUSABLE."
- **Effort**: 8-12 hours
- **Files**:
  - `src/app/dashboard/layout.tsx` -- add responsive container, mobile detection, overlay state
  - `src/components/layout/sidebar.tsx` -- add mobile drawer mode, hamburger toggle, backdrop overlay, touch-swipe gesture
  - `src/components/layout/header.tsx` -- add hamburger button for mobile
  - `src/components/ui/` -- may need a `sheet.tsx` or `drawer.tsx` component (`npx shadcn@latest add sheet`)
- **Implementation notes**:
  - Use a `Sheet` component (slide-in drawer) for mobile sidebar
  - Add `useState` for mobile sidebar open/close state
  - Use CSS `@media (max-width: 768px)` to hide desktop sidebar
  - Add hamburger icon button to Header on mobile
  - Auto-close sidebar on route change (listen to `usePathname`)
  - Add backdrop overlay when mobile sidebar is open

#### 1.5 Responsive content layouts
- **What**: Fix content grids, stat cards, modals, and form layouts to work on mobile viewports. Currently stat cards overflow, modals are full-width, and filter buttons are untappable.
- **Why**: Even with a collapsible sidebar, the content areas need responsive treatment to be usable on phones.
- **Effort**: 8-12 hours
- **Files** (high-priority pages first):
  - `src/app/dashboard/daily/page.tsx` -- stack time grid above priorities on mobile
  - `src/app/dashboard/page.tsx` -- responsive stat card grid (2-col on mobile vs 4-col desktop)
  - `src/app/dashboard/tasks/page.tsx` -- responsive task list, touch-friendly checkboxes
  - `src/app/dashboard/habits/page.tsx` -- stack habit cards vertically
  - `src/app/dashboard/memos/page.tsx` -- single-column card grid on mobile
  - `src/app/dashboard/planner/weekly/page.tsx` -- horizontal scroll or day-at-a-time mobile view
  - `src/app/dashboard/planner/monthly/page.tsx` -- compact month grid for mobile

#### 1.6 Add Zod `.max()` bounds to remaining inputs
- **What**: ~25 string inputs and ~10 array inputs across 10 routers lack `.max()` bounds, allowing arbitrarily large payloads.
- **Why**: Medium-severity security hardening -- prevents abuse via oversized inputs.
- **Effort**: 3-4 hours
- **Files**:
  - `src/server/api/routers/review.ts`
  - `src/server/api/routers/yearly.ts`
  - `src/server/api/routers/contacts.ts`
  - `src/server/api/routers/someday.ts`
  - `src/server/api/routers/ideas.ts`
  - `src/server/api/routers/memos.ts`
  - `src/server/api/routers/templates.ts`
  - `src/server/api/routers/github.ts`
  - `src/server/api/routers/finance.ts`
  - `src/server/api/routers/search.ts`

#### 1.7 Add `--turbopack` to dev script
- **What**: Standard webpack mode has persistent `MODULE_NOT_FOUND` errors after cache clearing. Turbopack works reliably.
- **Why**: Low effort, eliminates dev friction.
- **Effort**: 5 minutes
- **Files**:
  - `package.json` -- change dev script to `next dev --turbopack`

#### 1.8 Add module IDs for Analytics, Suggestions, Templates, Vision
- **What**: These 4 modules are defined in `src/lib/modules.ts` with IDs but their sidebar nav items in `src/components/layout/sidebar.tsx` are missing the `module` property, so they cannot be toggled off.
- **Why**: Medium -- users cannot hide these sections even when the modules are disabled.
- **Effort**: 30 minutes
- **Files**:
  - `src/components/layout/sidebar.tsx` -- add `module: "analytics"`, `module: "suggestions"`, `module: "templates"`, `module: "vision"` to the respective `NavItem` entries (lines ~158, ~192-200)

**Phase 1 Total Effort**: ~30-40 hours

---

### Phase 2: Filofax Identity (Week 3-6)

**Theme**: Transform the visual design, navigation, and language to embody the ring-binder planner metaphor. This is where the app stops feeling like "another productivity SaaS" and starts feeling like "my personal planner."

#### 2.1 Make Daily Planner the default landing page
- **What**: When a user navigates to `/dashboard`, redirect to `/dashboard/daily` (today's daily planner page). Keep the current dashboard page accessible via a "Planner Overview" or "Dashboard" link.
- **Why**: A physical filofax opens to today's page, not a KPI dashboard. The UX review identified this as a P0 recommendation. The daily planner page already has the strongest filofax feel in the app.
- **Effort**: 2-3 hours
- **Files**:
  - `src/app/dashboard/page.tsx` -- either redirect to `/dashboard/daily` or add a user preference toggle
  - `src/server/api/routers/preferences.ts` -- add `defaultLandingPage` preference (optional, for user choice)
  - `src/components/layout/sidebar.tsx` -- rename "Dashboard" to "Overview" or "At a Glance"

#### 2.2 Colored section tabs in sidebar
- **What**: Add a colored left-border strip (6px wide) to each sidebar navigation group. Each section group (Planners, Capture, Goals, etc.) gets a distinct color. The active section's color is more prominent. Individual module items inherit their group color.
- **Why**: OneNote's colored section tabs are the closest digital analog to physical tab dividers. This single change transforms the sidebar from a flat link list into a tabbed binder. UX review P1 recommendation.
- **Effort**: 4-6 hours
- **Files**:
  - `src/components/layout/sidebar.tsx` -- add color configuration per nav group, render colored border
  - `src/lib/modules.ts` -- add `color` field to `ModuleConfig`
  - `src/server/api/routers/preferences.ts` -- store user-customized section colors
  - `prisma/schema.prisma` -- add `sectionColors` JSON field to `UserPreferences` (optional)
- **Default colors**: Planners (blue-500), Capture (emerald-500), Goals (amber-500), Collaborate (violet-500), Insights (sky-500), Review (rose-500)

#### 2.3 Collapsible sidebar sections (accordion navigation)
- **What**: Make sidebar section groups collapsible. Clicking a section header (e.g., "PLANNERS") toggles its children visible/hidden. Only the active section is expanded by default. Persist collapsed state in localStorage.
- **Why**: Physical filofaxes have 6-10 tab dividers. The current sidebar shows 20+ links simultaneously, which is overwhelming. Accordion navigation lets users focus on one section at a time. UX review P1 recommendation.
- **Effort**: 3-4 hours
- **Files**:
  - `src/components/layout/sidebar.tsx` -- add accordion state per group, persist in localStorage
  - May need `npx shadcn@latest add collapsible` or `accordion`

#### 2.4 Module reordering (drag-and-drop sidebar)
- **What**: Allow users to drag sidebar section groups to rearrange their order, like rearranging tabbed dividers in a ring binder. Persist order in user preferences.
- **Why**: Core filofax interaction -- rearranging sections. Both the competitive audit and UX review flagged this as missing. OneNote supports drag-to-reorder sections.
- **Effort**: 6-8 hours
- **Files**:
  - `src/components/layout/sidebar.tsx` -- add drag handles, reorder logic
  - `src/server/api/routers/preferences.ts` -- add `moduleOrder` preference
  - `prisma/schema.prisma` -- add `moduleOrder` JSON field to `UserPreferences`
  - `src/app/dashboard/settings/modules/page.tsx` -- add reordering UI to module management page
- **Library**: `@hello-pangea/dnd` (or `dnd-kit`) for drag-and-drop

#### 2.5 Paper-like visual design treatment
- **What**: Apply subtle design touches that evoke a physical planner without making it look skeuomorphic:
  - Very light paper texture on content area background (CSS background-image with subtle noise pattern)
  - Slightly off-white (`#faf9f6` or similar) background for content "pages" instead of pure white
  - Soft drop shadow on content cards to make them feel like pages
  - Subtle horizontal ruled lines on text-heavy pages (daily planner time grid, memos)
  - Ring-binding dots along the left edge of the main content area (a thin column of evenly spaced dots)
- **Why**: The UX review scored filofax metaphor at 5/10. Visual design is the most impactful lever to increase this. The goal is not GoodNotes-level replication but a warm, personal, planner-like aesthetic.
- **Effort**: 6-8 hours
- **Files**:
  - `src/app/globals.css` or `src/app/dashboard/layout.tsx` -- add CSS custom properties for paper colors, texture
  - `src/components/ui/card.tsx` -- adjust shadow, border-radius for page-like feel
  - `src/app/dashboard/daily/page.tsx` -- add ruled-line CSS to time grid
  - `src/app/dashboard/memos/page.tsx` -- memo cards with subtle type-based background tints
  - `public/` -- add paper texture SVG or CSS pattern (no external dependency)

#### 2.6 Page transition animations
- **What**: Add a subtle horizontal slide animation (200-300ms) when navigating between dashboard sections. This evokes the physical act of flipping to a different tab divider.
- **Why**: Navigation currently has no transition -- content just swaps. Even a minimal slide reinforces the page-turning metaphor. UX review P2 recommendation.
- **Effort**: 3-4 hours
- **Files**:
  - `src/app/dashboard/layout.tsx` -- wrap `{children}` in animation container
  - Consider using `framer-motion` `AnimatePresence` with `motion.div` for route-based transitions
  - Or use CSS `@view-transition` (experimental but lightweight)

#### 2.7 Soften language throughout the app
- **What**: Replace corporate/tech jargon with personal, warm planner language:
  - "Welcome back! Here's your personal command center" -> "Your planner for today"
  - "Cascade your vision into actionable objectives" -> "Set and track your goals"
  - "GTD style" references -> "Review your week"
  - "Needs Attention" urgency section -> "Don't forget"
  - Various button/label copy adjustments
- **Why**: The UX review noted that language breaks the filofax feel. A personal planner should talk like a supportive friend, not a SaaS onboarding flow.
- **Effort**: 2-3 hours
- **Files**:
  - `src/app/dashboard/page.tsx` -- dashboard heading and widget titles
  - `src/app/dashboard/goals/page.tsx` -- goals section copy
  - `src/app/dashboard/review/page.tsx` -- review section labels
  - Various other page.tsx files -- scan for corporate language

#### 2.8 Quick Capture keyboard shortcut with instant input
- **What**: Add a global keyboard shortcut (Cmd+Shift+N or Cmd+J) that immediately opens the Quick Capture dialog with cursor in the text field. Support a single-input mode where the user types first and categorizes after (task/note/idea selection is secondary, not blocking).
- **Why**: Current capture requires 2 clicks minimum. Todoist achieves 1-click NLP capture. OneNote has a system-wide hotkey. The competitive audit ranked quick capture speed as a top-10 gap.
- **Effort**: 4-6 hours
- **Files**:
  - `src/components/layout/header.tsx` -- modify quick capture flow, add keyboard listener
  - Create `src/components/quick-capture-dialog.tsx` -- dedicated capture component with auto-focus input, type selector as secondary action, Enter to save

#### 2.9 Alphabetical index for Contacts
- **What**: Add an A-Z letter strip along the right side of the contacts page. Clicking a letter scrolls/filters to contacts starting with that letter. This replicates the classic filofax alphabetical tab dividers.
- **Why**: The UX review rated the contacts page as having "High" filofax feel and recommended an alphabetical index to reinforce the address-book metaphor.
- **Effort**: 3-4 hours
- **Files**:
  - `src/app/dashboard/contacts/page.tsx` -- add A-Z letter strip component, scroll-to-letter logic

#### 2.10 Ideas page: add simple list view (default)
- **What**: Add a toggle between "List view" (default, simple capture list) and "Board view" (existing kanban). List view shows ideas as a simple bulleted/checkbox list, which is more planner-like.
- **Why**: The UX review noted that a kanban board feels like a project management tool, not a planner page. Offering a simpler default view maintains the planning metaphor while preserving the kanban for power users.
- **Effort**: 3-4 hours
- **Files**:
  - `src/app/dashboard/ideas/page.tsx` -- add list view component, view toggle

**Phase 2 Total Effort**: ~45-60 hours

---

### Phase 3: Competitive Parity (Week 7-12)

**Theme**: Close the most impactful feature gaps identified in the competitive audit. These are features that users of Todoist, TickTick, and Sunsama expect from a personal planner.

#### 3.1 Natural Language Task Input (NLP)
- **What**: Parse a single text input like "Call dentist tomorrow at 2pm #health !high" into a structured task with title, due date, time, category, and priority. Integrate this into the Quick Capture dialog and the task creation form.
- **Why**: Ranked #1 in the competitive audit. Todoist's NLP input is their defining feature. This is the single highest-impact UX improvement for capture speed -- reducing task creation from 5+ form fields to 1 text input.
- **Effort**: 16-24 hours
- **Files**:
  - Create `src/lib/nlp-parser.ts` -- parsing logic for dates ("tomorrow", "next monday", "feb 25"), times ("at 2pm", "3:00"), priorities ("!high", "!urgent", "p1"), categories ("#health", "#work"), and context ("@office", "@phone")
  - `src/components/quick-capture-dialog.tsx` -- integrate NLP parser into capture input, show parsed preview
  - `src/app/dashboard/tasks/page.tsx` -- integrate NLP into inline task creation
  - `tests/lib/nlp-parser.test.ts` -- comprehensive parsing tests
- **Libraries**: Consider `chrono-node` for natural language date parsing

#### 3.2 Command Palette (Cmd+K)
- **What**: A keyboard-triggered command palette that allows instant navigation ("Go to Habits"), quick capture ("New task: Buy milk"), and command execution ("Toggle dark mode"). Accessible via Cmd+K.
- **Why**: Ranked #6 in competitive audit. Obsidian, Notion, and Todoist all have command palettes. This is the digital equivalent of quickly flipping to the right page in a filofax.
- **Effort**: 8-12 hours
- **Files**:
  - Create `src/components/command-palette.tsx` -- cmdk-style component
  - `src/components/layout/header.tsx` -- existing Cmd+K search can be upgraded to full command palette
  - `src/app/dashboard/layout.tsx` -- mount command palette at layout level
- **Library**: `cmdk` (https://cmdk.paco.me/) -- small, well-maintained
- **Commands to register**: Navigate to all 17 modules, create new (task/note/idea/contact/event), toggle theme, open settings, start focus timer

#### 3.3 Guided Daily Planning Ritual
- **What**: A structured 5-step morning routine wizard:
  1. Review yesterday's unfinished tasks (pull from tasks router)
  2. Check today's calendar (pull from calendar router)
  3. Select today's top 3 priorities (from tasks or manual entry)
  4. Time-block the day (drag tasks into time slots on daily planner)
  5. Set a daily intention (free text, stored in journal)
- **Why**: Ranked #7 in competitive audit. Sunsama's daily planning ritual is their primary differentiator and drives daily active usage. The Daily Planner page exists but lacks a guided flow. This builds the habit of opening the app every morning.
- **Effort**: 16-20 hours
- **Files**:
  - Create `src/app/dashboard/daily/planning-ritual.tsx` -- multi-step wizard component
  - `src/app/dashboard/daily/page.tsx` -- add "Start Planning" button, show ritual on first visit of the day
  - `src/server/api/routers/daily.ts` -- add `startPlanningRitual` and `completePlanningRitual` procedures
  - `src/server/api/routers/tasks.ts` -- add `getYesterdaysUnfinished` procedure if not existing

#### 3.4 Eisenhower Matrix View
- **What**: A 2x2 grid view that plots tasks by urgency (x-axis) and importance (y-axis). Four quadrants: Q1 Do Now (urgent + important), Q2 Schedule (important, not urgent), Q3 Delegate (urgent, not important), Q4 Eliminate (neither). Drag tasks between quadrants to change their priority/urgency.
- **Why**: Ranked #8 in competitive audit. The app already has urgency calculation (`src/lib/urgency.ts`) and priority fields -- the data exists, only the view is missing. TickTick has this natively.
- **Effort**: 8-12 hours
- **Files**:
  - Create `src/app/dashboard/tasks/matrix/page.tsx` -- Eisenhower matrix page
  - `src/lib/urgency.ts` -- reuse existing urgency scoring
  - `src/components/layout/sidebar.tsx` -- add "Priority Matrix" nav item under Tasks module
  - `src/lib/modules.ts` -- add route to tasks module routes

#### 3.5 Rich Text Editor for Memos
- **What**: Replace the plain text textarea in memo creation/editing with a rich text editor supporting headings, bold/italic, bullet/numbered lists, code blocks, and basic tables. Store content as JSON (Tiptap format) in the existing memo `content` field.
- **Why**: Ranked #5 in competitive audit. The memos module stores plain text, which cannot compete with Notion's blocks or Obsidian's Markdown. For a section called "Notes," users expect structured formatting.
- **Effort**: 12-16 hours
- **Files**:
  - Create `src/components/rich-text-editor.tsx` -- Tiptap editor component
  - `src/app/dashboard/memos/page.tsx` -- replace textarea with rich text editor
  - `src/server/api/routers/memos.ts` -- update content validation (JSON instead of plain string)
  - `prisma/schema.prisma` -- may need to change memo `content` field type to `Json`
- **Library**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`

#### 3.6 PDF Export / Print-Friendly Pages
- **What**: Add print-friendly CSS and PDF export for daily, weekly, and monthly planner pages. Users can print physical planner pages from their digital content. Include a "Print" button on each planner page.
- **Why**: Ranked #9 in competitive audit. This is the unique "hybrid digital-physical planner" opportunity. No competitor does this well. It creates a category-defining feature: plan digitally, print for offline use.
- **Effort**: 8-12 hours
- **Files**:
  - Create `src/styles/print.css` -- `@media print` styles for clean printed output
  - `src/app/dashboard/daily/page.tsx` -- add Print/Export button, print layout
  - `src/app/dashboard/planner/weekly/page.tsx` -- weekly print layout
  - `src/app/dashboard/planner/monthly/page.tsx` -- monthly print layout
  - Consider `react-pdf` or browser `window.print()` for simplicity

#### 3.7 OneNote-style Quick Notes Inbox
- **What**: Implement a unified Inbox that collects all quick captures. Show a badge count on the sidebar. The weekly review process includes a step to "Process your Inbox" where users route items to the appropriate module. Quick captures from Cmd+Shift+N go here by default.
- **Why**: OneNote's Quick Notes and PARA's Inbox-first capture are proven patterns. Without an inbox, quick captures scatter across modules. A central inbox with periodic processing is core GTD methodology.
- **Effort**: 10-14 hours
- **Files**:
  - `prisma/schema.prisma` -- add `InboxItem` model (title, content, type hint, processed boolean, userId)
  - Create `src/server/api/routers/inbox.ts` -- CRUD for inbox items, `processItem` (convert to task/memo/idea)
  - `src/server/api/root.ts` -- register inbox router
  - Create `src/app/dashboard/inbox/page.tsx` -- inbox list with "Route to..." action per item
  - `src/components/layout/sidebar.tsx` -- add Inbox nav item with badge count
  - `src/components/quick-capture-dialog.tsx` -- save to inbox by default
  - `src/app/dashboard/review/page.tsx` -- add "Process Inbox" step to weekly review

#### 3.8 Tag Summary View (cross-module aggregation)
- **What**: A new page at `/dashboard/tags` that shows all tagged items across all modules (tasks, memos, ideas, goals) grouped by tag. Click a tag to see everything tagged with it, regardless of which module it lives in.
- **Why**: OneNote's Tag Summary pane is a powerful cross-section navigation tool. The tag system already exists (8 tRPC procedures in `src/server/api/routers/tags.ts`). Only the aggregation view is missing.
- **Effort**: 6-8 hours
- **Files**:
  - Create `src/app/dashboard/tags/page.tsx` -- tag listing page
  - Create `src/app/dashboard/tags/[tagId]/page.tsx` -- tag detail page with cross-module items
  - `src/server/api/routers/tags.ts` -- add `getTagSummary` procedure that queries across models
  - `src/components/layout/sidebar.tsx` -- add "Tags" nav item

**Phase 3 Total Effort**: ~95-130 hours

---

### Phase 4: Differentiation (Month 4+)

**Theme**: Features that create a unique market position no competitor occupies. These are longer-term investments that transform the Digital Filofax from "competitive" to "category-defining."

#### 4.1 External Calendar Sync (Google Calendar)
- **What**: Bi-directional sync with Google Calendar. Import external events into the filofax calendar views. Optionally export filofax events to Google Calendar. Support OAuth flow for Google account connection.
- **Why**: Ranked #2 in competitive audit. Without calendar sync, users maintain two calendars. Sunsama's 16+ integrations show this is table stakes for a personal planner.
- **Effort**: 30-40 hours
- **Files**:
  - `prisma/schema.prisma` -- add `CalendarSync`, `ExternalCalendarAccount` models
  - Create `src/server/api/routers/calendar-sync.ts` -- sync procedures
  - `src/app/dashboard/settings/page.tsx` -- Google Calendar connection UI (already has placeholder for "Google Calendar available")
  - `src/server/api/routers/calendar.ts` -- merge external events into existing calendar queries
  - Create `src/app/api/auth/google-calendar/route.ts` -- OAuth callback handler
- **Dependencies**: Google Calendar API credentials, OAuth2 setup

#### 4.2 Offline-First / PWA Architecture
- **What**: Make the app installable as a PWA with service worker caching, IndexedDB for local data storage, and a sync queue for pending mutations when offline.
- **Why**: Ranked #4 in competitive audit. Obsidian and Logseq are local-first. A planner that requires internet is less reliable than paper.
- **Effort**: 40-60 hours
- **Files**:
  - Create `public/manifest.json` -- PWA manifest
  - Create `public/sw.js` -- service worker for cache-first strategy
  - Create `src/lib/offline-store.ts` -- IndexedDB wrapper for local data
  - Create `src/lib/sync-queue.ts` -- queue mutations when offline, replay when online
  - `src/app/layout.tsx` -- register service worker
  - `next.config.ts` -- PWA configuration (consider `next-pwa` or `@serwist/next`)

#### 4.3 AI-Powered Suggestions Upgrade
- **What**: Replace the rule-based suggestions system (`src/lib/ai-suggestions.ts`) with an LLM-powered engine. Capabilities: auto-categorize new captures, suggest time estimates for tasks, generate weekly review summaries, recommend daily priorities based on deadlines and patterns.
- **Why**: Ranked in competitive audit's AI gap. Notion AI agents and Copilot in OneNote are setting 2026 expectations. The existing suggestions infrastructure (`src/server/api/routers/suggestions.ts`) provides the plumbing.
- **Effort**: 20-30 hours
- **Files**:
  - `src/lib/ai-suggestions.ts` -- replace or augment with LLM API calls
  - `src/server/api/routers/suggestions.ts` -- add LLM-powered suggestion generation
  - Create `src/lib/ai-client.ts` -- OpenAI/Anthropic API wrapper
  - `src/app/dashboard/suggestions/page.tsx` -- enhanced suggestions UI

#### 4.4 Email-to-Inbox Capture
- **What**: A dedicated email address (e.g., `capture@[app-domain]`) that users can forward emails to, creating inbox items. Parse email subject as title, body as content.
- **Why**: Ranked #10 in competitive audit. Todoist, Sunsama, and TickTick support email capture. Capture must happen where ideas occur -- in email, browsing, reading.
- **Effort**: 16-24 hours
- **Files**:
  - Create `src/app/api/webhooks/email/route.ts` -- email webhook receiver
  - `src/server/api/routers/inbox.ts` -- create items from parsed emails
  - `src/app/dashboard/settings/page.tsx` -- show user's capture email address
- **Dependencies**: Email parsing service (SendGrid Inbound Parse, Mailgun, or Postmark)

#### 4.5 Voice Capture
- **What**: Add a microphone button to Quick Capture that uses the Web Speech API (or Whisper API) to transcribe voice input into text, then process through the NLP parser.
- **Why**: No competitor in the analysis has voice capture built in. This is a genuine differentiator, especially on mobile where typing is slower.
- **Effort**: 8-12 hours
- **Files**:
  - `src/components/quick-capture-dialog.tsx` -- add microphone button, Web Speech API integration
  - Create `src/lib/voice-capture.ts` -- speech recognition wrapper

#### 4.6 Section Templates Auto-Apply
- **What**: Allow templates to be auto-applied per module type. When creating a new memo of type "Meeting," auto-populate with a meeting notes template. When creating a daily reflection, auto-populate with configured prompts.
- **Why**: OneNote's section templates reduce friction for repetitive page creation. The templates system exists (8 tRPC procedures in `src/server/api/routers/templates.ts`). Only the auto-apply mapping is missing.
- **Effort**: 4-6 hours
- **Files**:
  - `src/server/api/routers/templates.ts` -- add `getDefaultForType` procedure
  - `src/server/api/routers/preferences.ts` -- store template-to-type mappings
  - `src/app/dashboard/memos/page.tsx` -- auto-populate on create
  - `src/app/dashboard/reflect/daily/page.tsx` -- auto-populate on create

#### 4.7 Free-Form Canvas for Vision Board
- **What**: Enhance the Vision Board module with a canvas that supports freehand drawing, image placement, and text blocks. This becomes the "creative pages" section of the filofax.
- **Why**: OneNote's free-form canvas and GoodNotes' drawing are high-engagement features. The Vision Board already supports boards (15 tRPC procedures in `src/server/api/routers/vision.ts`). Adding a canvas layer creates a unique creative planning space.
- **Effort**: 24-32 hours
- **Files**:
  - `src/app/dashboard/vision/page.tsx` -- integrate canvas
  - Create `src/components/vision/canvas.tsx` -- canvas component
- **Library**: `@excalidraw/excalidraw` or `tldraw`

#### 4.8 Commercial Template Marketplace
- **What**: A curated library of pre-built planning templates (GTD Weekly Review, Bullet Journal Habit Grid, OKR Goal Tree, Eisenhower Matrix, etc.) that users can browse and add to their binder with one click.
- **Why**: Physical filofax inserts are a revenue stream (Filofax sells refill packs). A template marketplace drives engagement and could enable community contributions.
- **Effort**: 20-30 hours
- **Files**:
  - `src/server/api/routers/templates.ts` -- add `marketplace` procedures
  - Create `src/app/dashboard/templates/marketplace/page.tsx` -- template browser
  - `prisma/schema.prisma` -- add `TemplateCategory`, `TemplateFeatured` models

**Phase 4 Total Effort**: ~170-240 hours

---

## 4. UX Transformation Checklist

Consolidated from the UX review, organized by priority.

### P0: Critical (must fix for basic usability)

- [ ] **UX-01**: Fix mobile sidebar -- collapse into hamburger menu / drawer on viewports < 768px
- [ ] **UX-02**: Make Daily Planner (`/dashboard/daily`) the default landing page instead of the dashboard

### P1: High (significantly strengthens filofax metaphor)

- [ ] **UX-03**: Add colored left-border strips to sidebar section groups (6px wide, per-section color)
- [ ] **UX-04**: Enable drag-and-drop reordering of sidebar modules
- [ ] **UX-05**: Make sidebar sections collapsible (accordion-style, persist collapsed state)
- [ ] **UX-06**: Add A-Z alphabetical index strip to Contacts page
- [ ] **UX-07**: Add global keyboard shortcut for Quick Capture (Cmd+Shift+N), auto-focus text input
- [ ] **UX-08**: Responsive content grids for mobile (stat cards, task lists, habit cards, calendar views)

### P2: Medium (enhances the planner feeling)

- [ ] **UX-09**: Add subtle paper texture to content area background (off-white, slight noise)
- [ ] **UX-10**: Add page transition animations (200ms horizontal slide on section change)
- [ ] **UX-11**: Soften dashboard language ("your planner" not "command center," "don't forget" not "needs attention")
- [ ] **UX-12**: Add simple list view as default for Ideas page (kanban as secondary toggle)
- [ ] **UX-13**: Add monthly grid view for Habits (bullet-journal style, alternative to GitHub heatmap)
- [ ] **UX-14**: Color-code memo cards by type (subtle background tint: Note=blue-50, Meeting=amber-50, Journal=green-50)
- [ ] **UX-15**: Add ruled-line aesthetic to Daily Planner time grid

### P3: Polish (nice to have)

- [ ] **UX-16**: Add "Today" floating action button on mobile (always returns to daily planner)
- [ ] **UX-17**: Add ring-binding dots visual along left edge of content area
- [ ] **UX-18**: Add user-customizable section colors via Settings > Modules
- [ ] **UX-19**: Add print-friendly CSS for planner pages (`@media print`)
- [ ] **UX-20**: Change cursor to pen icon when hovering over editable areas (CSS `cursor: url(...)`)
- [ ] **UX-21**: Add page background tint per active section (very subtle, matches section color)

---

## 5. OneNote-Inspired Feature Specifications

### 5.1 Colored Section Tabs

- **OneNote equivalent**: Colored section tabs in the notebook sidebar
- **Filofax metaphor**: Colored tab dividers that stick out from the pages
- **Implementation**: Add a `color` CSS custom property per nav group in `src/components/layout/sidebar.tsx`. Render a `border-left: 6px solid var(--section-color)` on each nav item. Store default colors in `src/lib/modules.ts` and user overrides in `UserPreferences.sectionColors` (JSON field).
- **User story**: "As a user, I want each section of my sidebar to have a distinct color so I can instantly recognize which section I am in, like colored tab dividers in my physical planner."

### 5.2 Module Reordering

- **OneNote equivalent**: Drag-to-reorder sections in the notebook sidebar
- **Filofax metaphor**: Rearranging tabbed divider sections in the ring binder
- **Implementation**: Add `@hello-pangea/dnd` to `src/components/layout/sidebar.tsx` wrapping nav groups. On drag end, persist the new order to `UserPreferences.moduleOrder` (JSON array of ModuleId strings). On sidebar render, sort nav groups by the stored order.
- **User story**: "As a user, I want to drag sidebar sections into my preferred order so my most-used sections are always at the top, like rearranging dividers in my binder."

### 5.3 Quick Notes Inbox

- **OneNote equivalent**: Quick Notes global hotkey (Win+N) that captures to a Quick Notes section
- **Filofax metaphor**: The slip pocket or "inbox" section where you toss loose papers for later filing
- **Implementation**: New `InboxItem` Prisma model. New `inbox` tRPC router with `create`, `getAll`, `processItem` (converts to task/memo/idea and deletes inbox item). Keyboard shortcut (Cmd+Shift+N) opens a minimal dialog that saves to inbox. Badge count on sidebar "Inbox" nav item. Weekly review includes "Process Inbox" step.
- **Files to create**: `prisma/schema.prisma` (InboxItem model), `src/server/api/routers/inbox.ts`, `src/app/dashboard/inbox/page.tsx`
- **User story**: "As a user, I want to capture a thought instantly with a keyboard shortcut and route it to the right section later, so I never lose an idea because I was too busy to categorize it."

### 5.4 Tag Summary View

- **OneNote equivalent**: Tag Summary pane that aggregates tagged items across all notebooks/sections
- **Filofax metaphor**: A cross-reference index card at the back of the binder
- **Implementation**: New `getTagSummary` procedure in `src/server/api/routers/tags.ts` that queries tasks, memos, ideas, and goals by tagId and returns grouped results. New page at `src/app/dashboard/tags/[tagId]/page.tsx` rendering the grouped items with module-type badges.
- **User story**: "As a user, I want to see everything tagged with 'Project Alpha' regardless of whether it is a task, note, idea, or goal, so I can get a complete picture of a topic across my entire planner."

### 5.5 Section Templates Auto-Apply

- **OneNote equivalent**: Default page templates per section
- **Filofax metaphor**: Pre-printed inserts that appear automatically when you add a new page to a section
- **Implementation**: Add `defaultTemplateId` mapping in `UserPreferences` keyed by module+type (e.g., `memos:meeting` -> template ID). When creating a new item, check for a default template and pre-populate the form fields. Add a "Set as default for this type" action on template cards.
- **User story**: "As a user, I want my meeting notes to automatically start with a pre-filled template (Date, Attendees, Agenda, Action Items) so I do not have to set up the structure every time."

### 5.6 Page Background Tint

- **OneNote equivalent**: Page background color tinted by the section's color
- **Filofax metaphor**: Different colored paper for different sections
- **Implementation**: Read the active module's color from preferences. Apply `background-color: hsl(var(--section-hue), 50%, 98%)` to the main content area in `src/app/dashboard/layout.tsx` based on the current route's module.
- **User story**: "As a user, I want a subtle background color shift when I navigate to different sections so I have an ambient visual cue of where I am in my planner."

---

## 6. Metrics and Success Criteria

### Phase 1: Foundation (Week 1-2)

| Metric | Target |
|--------|--------|
| Critical bugs fixed | 3/3 (reflect loop, suggestion ownership, template OR) |
| Mobile usability | Sidebar collapses on < 768px, all pages render on 375px viewport |
| Test suite | All 320 tests passing |
| Build | `npm run lint && npm run build` both pass |
| Zod bounds | All string/array inputs have `.max()` constraints |

### Phase 2: Filofax Identity (Week 3-6)

| Metric | Target |
|--------|--------|
| Filofax metaphor score (subjective) | Improve from 5/10 to 7/10 |
| Default landing page | Daily Planner loads on `/dashboard` |
| Sidebar colored tabs | All 6+ section groups have distinct colors |
| Module reordering | Users can drag to rearrange sidebar order |
| Quick capture speed | 1 keyboard shortcut + typing = capture complete (down from 2 clicks + form) |
| Visual design | Paper texture, page shadows, off-white backgrounds applied |

### Phase 3: Competitive Parity (Week 7-12)

| Metric | Target |
|--------|--------|
| NLP parser accuracy | Correctly parses dates, times, priorities, categories from natural text (>90% of common patterns) |
| Command palette | Cmd+K opens palette with all 17 module navigation + quick create commands |
| Daily planning ritual | 5-step guided flow functional with real data from tasks/calendar/habits |
| Eisenhower matrix | Visual 2x2 grid with drag-to-reclassify |
| Rich text editor | Tiptap editor in memo creation with headings, lists, bold/italic |
| PDF export | Daily/weekly/monthly pages print cleanly via browser print |
| Inbox | Quick captures land in inbox, weekly review includes inbox processing |
| Tag summary | Cross-module tag aggregation page functional |

### Phase 4: Differentiation (Month 4+)

| Metric | Target |
|--------|--------|
| Calendar sync | Google Calendar events appear in filofax calendar views |
| Offline capability | App loads and renders cached data without internet |
| AI suggestions | LLM-generated task recommendations and review summaries |
| Unique market position | No competitor combines planner metaphor + planning depth + hybrid print |

---

## 7. Technical Debt Items

These should be addressed alongside feature work, not deferred indefinitely.

### 7.1 Test Coverage Expansion (HIGH priority)

| Router | Procedures | Current Tests | Status |
|--------|-----------|---------------|--------|
| `finance.ts` | 16 | 25 | Covered |
| `contacts.ts` | 10 | 21 | Covered |
| `reflections.ts` | 10 | 19 | Covered |
| `calendar.ts` | ~10 | 21 | Covered |
| `vision.ts` | 14 | 0 | **Needs tests** |
| `import.ts` | 6 | 37 | Covered |
| `export.ts` | ~5 | 22 | Covered |
| `memos.ts` | ~8 | 0 | **Needs tests** |
| `ideas.ts` | ~8 | 0 | **Needs tests** |
| `journal.ts` | ~6 | 0 | **Needs tests** |
| `roles.ts` | ~6 | 0 | **Needs tests** |
| `review.ts` | ~8 | 0 | **Needs tests** |
| `yearly.ts` | ~10 | 0 | **Needs tests** |
| `someday.ts` | ~8 | 0 | **Needs tests** |
| `templates.ts` | ~8 | 0 | **Needs tests** |
| `preferences.ts` | ~4 | 0 | **Needs tests** |
| `search.ts` | ~4 | 0 | **Needs tests** |
| `tags.ts` | ~8 | 0 | **Needs tests** |
| `suggestions.ts` | ~10 | 0 | **Needs tests** |
| `categories.ts` | ~6 | 0 | **Needs tests** |
| `contexts.ts` | ~6 | 0 | **Needs tests** |
| `focus.ts` | ~4 | 0 | **Needs tests** |
| `analytics.ts` | ~6 | 0 | **Needs tests** |

**Target**: Expand from 320 tests / 9 router test files to 500+ tests / 22+ router test files.
**Files**: `tests/routers/` -- create new test files following the pattern in `tests/helpers.ts`

### 7.2 Performance Optimizations

- **Parallelize `yearly.getYearStats` queries**: Currently executes sequential Prisma queries. Use `Promise.all()` for independent queries.
  - File: `src/server/api/routers/yearly.ts`
  - Effort: 1-2 hours

- **Extract shared streak calculation utility**: Streak calculation logic is duplicated across habits and reflections routers.
  - Files: `src/server/api/routers/habits.ts`, `src/server/api/routers/reflections.ts`
  - Create: `src/lib/streak-utils.ts`
  - Effort: 2-3 hours

### 7.3 Security Hardening

- **Fix suggestion task ownership bypass** (covered in Phase 1, item 1.2)
- **Fix template OR clause bug** (covered in Phase 1, item 1.3)
- **Add Zod bounds** (covered in Phase 1, item 1.6)
- **Vision board image storage**: Base64 images stored directly in PostgreSQL. Move to cloud storage (S3/Cloudflare R2) to prevent database bloat.
  - Files: `src/server/api/routers/vision.ts`, create `src/lib/storage.ts`
  - Effort: 8-12 hours

### 7.4 Code Cleanup

- **Remove or complete GitHub integration**: Currently returns hardcoded mock data from `getIssues`, `getPullRequests`, `getStats`. Either complete the OAuth integration or remove the module entirely to avoid showing fake data.
  - File: `src/server/api/routers/github.ts`
  - Effort: 2 hours (remove) or 16-24 hours (complete)

- **Remove dead `saveSearch` procedure**: Returns `{success: true}` without persisting. Either implement search history or remove the procedure.
  - File: `src/server/api/routers/search.ts`
  - Effort: 1 hour (remove) or 3-4 hours (implement)

- **Clean up legacy Python test files**: `tests/e2e-pages-test.py` appears to be legacy.
  - Effort: 5 minutes

- **Implement collaboration email notifications**: `inviteToList` has a TODO for email notification.
  - File: `src/server/api/routers/collaboration.ts`
  - Effort: 4-6 hours

---

## 8. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| **R1** | **Scope creep in filofax visual design** -- The paper texture, page transitions, and planner aesthetics could become an endless rabbit hole of tweaks | High | Medium | Timebox Phase 2 visual work to 15 hours max. Define "good enough" upfront: paper texture + colored tabs + off-white = done. Do not pursue GoodNotes-level fidelity. |
| **R2** | **Mobile responsiveness takes longer than estimated** -- Responsive layout for 38 pages across multiple viewport sizes is a large surface area | High | High | Prioritize the 5 most-used pages first (daily planner, tasks, habits, memos, dashboard). Test at exactly 2 breakpoints (375px mobile, 768px tablet). Other pages can be mobile-functional without being mobile-optimized. |
| **R3** | **NLP parser edge cases** -- Natural language parsing is inherently ambiguous ("next Friday" when today is Friday, timezone handling, international date formats) | Medium | Medium | Start with a constrained set of patterns (English only, US date conventions). Use `chrono-node` for date parsing rather than building from scratch. Ship with "80% accuracy" and iterate based on actual usage. |
| **R4** | **External calendar sync complexity** -- Google Calendar API OAuth, webhook management, conflict resolution, and rate limiting are each significant challenges | High | High | Start with one-way import only (Google -> Filofax). Defer bi-directional sync to a later phase. Use polling (cron) before webhooks. Consider a mature library like `googleapis` rather than raw HTTP. |
| **R5** | **Offline/PWA breaks existing tRPC patterns** -- The entire data layer assumes server-side rendering and tRPC queries. Offline-first requires IndexedDB, optimistic updates, and a sync queue | Medium | High | Defer PWA to Phase 4 as planned. When implementing, start with read-only offline (cache existing data) before write-offline (queue mutations). Do not attempt to refactor all 30 routers at once. |
| **R6** | **Feature breadth dilutes focus** -- With 17 modules and a long roadmap, there is a risk of spreading effort too thin and not finishing any phase thoroughly | Medium | High | Complete each phase fully before starting the next. Ship Phase 1+2 first (foundation + identity) and validate with real usage before investing in Phase 3+4. Cut scope aggressively from later phases if earlier phases take longer. |
| **R7** | **Rich text editor storage migration** -- Changing memo content from plain text to Tiptap JSON requires migrating existing data | Low | Medium | Make the Tiptap editor backwards-compatible: detect whether content is JSON (new format) or plain string (old format) and render accordingly. No bulk migration needed. |
| **R8** | **Performance degradation with visual enhancements** -- Paper textures, animations, and page transitions could slow down page loads, especially on low-end mobile devices | Low | Medium | Use CSS-only textures (no image files > 10KB). Keep animations under 300ms with `will-change` optimization. Test on a throttled (4x CPU slowdown) Chrome DevTools profile before shipping. Provide a "reduced motion" preference that disables transitions. |

---

## Appendix A: Roadmap Summary Table

| Phase | Theme | Duration | Items | Total Effort |
|-------|-------|----------|-------|-------------|
| 1 | Foundation Fixes | Week 1-2 | 8 items | 30-40 hours |
| 2 | Filofax Identity | Week 3-6 | 10 items | 45-60 hours |
| 3 | Competitive Parity | Week 7-12 | 8 items | 95-130 hours |
| 4 | Differentiation | Month 4+ | 8 items | 170-240 hours |
| **Total** | | **~4 months** | **34 items** | **340-470 hours** |

## Appendix B: Quick Reference -- Files Most Frequently Modified

These files appear across multiple roadmap items and are the highest-change-frequency targets:

| File | Roadmap Items |
|------|---------------|
| `src/components/layout/sidebar.tsx` | 1.4, 1.8, 2.2, 2.3, 2.4, 3.7, 3.8 |
| `src/app/dashboard/layout.tsx` | 1.4, 2.5, 2.6, 3.2, 5.6 |
| `src/components/layout/header.tsx` | 1.4, 2.8, 3.2 |
| `src/app/dashboard/daily/page.tsx` | 1.5, 2.5, 3.3, 3.6 |
| `src/app/dashboard/page.tsx` | 1.5, 2.1, 2.7 |
| `src/server/api/routers/preferences.ts` | 2.1, 2.2, 2.4, 4.6 |
| `prisma/schema.prisma` | 2.2, 2.4, 3.5, 3.7, 4.1, 4.8 |
| `src/lib/modules.ts` | 2.2, 3.4 |
| `src/app/dashboard/memos/page.tsx` | 1.5, 2.5, 3.5 |
| `src/components/quick-capture-dialog.tsx` | 2.8, 3.1, 3.7, 4.5 |

---

*Generated: 2026-02-19*
*Methodology: Synthesized findings from competitive audit (9 products, 14 feature categories), UX review (21 pages, 18 improvement recommendations), and app review report (4-agent team, 17 issues). All file paths verified against current codebase.*
