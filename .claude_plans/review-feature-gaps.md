# Feature Gap Analysis - Digital Filofax

**Date**: 2026-02-08
**Analyst**: Feature Gap Agent (Task #4)
**Scope**: All 30 tRPC routers, 38 Prisma models, 33 dashboard pages, module system, sidebar navigation

---

## 1. Feature Assessment Matrix

| # | Feature Area | Status | What Works | What's Missing / Issues |
|---|---|---|---|---|
| 1 | **Tasks** | **Complete** | CRUD, subtasks, reorder, bulk ops (status/delete/category/priority), moveToDate, scheduling, weekly/monthly views, dueSoon, urgentCount | - |
| 2 | **Habits** | **Complete** | CRUD, logCompletion/removeLog, getLogs, todayStatus, streakInfo, heatmapData, streakStats | - |
| 3 | **Calendar** | **Complete** | CRUD, reschedule, today/thisWeek/thisMonth/upcoming views, getCombinedAgenda (tasks+events) | - |
| 4 | **Memos** | **Complete** | CRUD, togglePin, archive/unarchive, quickCapture, getRecent, search | - |
| 5 | **Ideas** | **Complete** | CRUD, updateStatus, updatePriority, kanban (getByStatus), archived, quickCapture | - |
| 6 | **Goals** | **Complete** | CRUD, 4-level hierarchy (getHierarchy), milestones CRUD, linkTask/unlinkTask, getStats | - |
| 7 | **Daily Planner** | **Complete** | getDailyView (tasks+events+habits+memos), setDailyPriorities, scheduleTask/unscheduleTask, toggleDailyPriority | - |
| 8 | **Contacts** | **Complete** | CRUD, toggleFavorite, category CRUD (with counts) | - |
| 9 | **Finance** | **Complete** | Transaction CRUD, category CRUD (with budgetLimit), savings goals CRUD (with addToSavingsGoal), monthlyStats, spendingByCategory, budgetStatus | - |
| 10 | **Journal** | **Complete** | Gratitude CRUD, mood CRUD, getTodayJournal, getStats (avgMood, total entries, current streak) | - |
| 11 | **Reflections** | **Complete** | Daily reflection CRUD (with range query), monthly reflection CRUD (with list), streaks, random prompts (hardcoded list of 20) | Prompts are hardcoded, not user-customizable |
| 12 | **Weekly Review** | **Complete** | CRUD, getStats, getWeeklySummary (tasks/habits/events/memos/ideas counts), inboxCount, staleTasksCount, needsReview | - |
| 13 | **Yearly** | **Complete** | Nested sub-routers (goals.*, reflection.*), getYearStats, getMonthlyActivity, getAvailableYears | - |
| 14 | **Templates** | **Complete** | CRUD, duplicate, applyTemplate (6 template types: TASK_LIST, PROJECT, DAILY_ROUTINE, WEEKLY_PLAN, MEETING_NOTES, CHECKLIST), getPublicTemplates | - |
| 15 | **Search** | **Partial** | globalSearch across tasks/memos/ideas/habits/events/contacts works | `saveSearch` is a **stub** - returns `{success: true}` with comment suggesting localStorage; no server-side search history |
| 16 | **Export** | **Complete** | exportAll (31 parallel queries), per-model exports: tasks, habits, memos, ideas, contacts, goals, finance, journal | - |
| 17 | **Import** | **Complete** | importFromCSV, importFromTodoist, importFromAppleReminders, importFromJSON, importHistory, importStats | - |
| 18 | **Analytics** | **Complete** | taskStats, habitStats, productivityScore, timeDistribution, focusStats, weeklyTrends, summaryStats | - |
| 19 | **Collaboration** | **Complete** | Shared lists CRUD, inviteToList, acceptInvite, removeFromList, updateMemberRole, add/removeTaskFromList, leaveList, pendingInvites | Email notification is a `// TODO` in inviteToList |
| 20 | **AI Suggestions** | **Partial** | getAll, getCount, regenerate, accept, dismiss, dismissAll all work | Rule-based heuristics only (not actual AI/LLM); `AISuggestionService` uses pattern matching, not ML |
| 21 | **GitHub** | **Stub** | Repo CRUD (create/getAll/getById/update/delete) works with real DB | `getIssues`, `getPullRequests`, `getStats` return **hardcoded mock data** with comments "Placeholder: Return mock data for now" |
| 22 | **Vision Boards** | **Complete** | Board CRUD, item CRUD, updatePosition, updateSize, getRandomInspiration | `uploadImage` stores base64 directly in DB (needs cloud storage for production) |
| 23 | **Someday/Maybe** | **Complete** | CRUD, getReviewDue, promoteToTask, promoteToGoal, getStats | - |
| 24 | **Life Roles** | **Complete** | Roles CRUD, reorderRoles, weekly big rocks CRUD, toggleBigRockComplete, getWeeklyCompass | - |
| 25 | **GTD Contexts** | **Complete** | CRUD, getTasksByContext, getWithTaskCounts | - |
| 26 | **Focus Timer** | **Complete** | startSession, completeSession, cancelSession, todayStats, weeklyStats, recentSessions, getSettings | - |
| 27 | **Preferences** | **Complete** | get, update, updateEnabledModules, toggleModule, updateEnabledWidgets, updatePomodoroSettings | - |

**Summary**: 23 Complete, 2 Partial, 1 Stub, 0 Missing (out of 27 assessed areas)

---

## 2. Stubs & Mock Data

### Critical Stubs

| Location | Type | Details |
|---|---|---|
| `src/server/api/routers/github.ts` - `getIssues` | **Mock Data** | Returns hardcoded array of 2 fake issues. Comment: "Placeholder: Return mock data for now" |
| `src/server/api/routers/github.ts` - `getPullRequests` | **Mock Data** | Returns hardcoded array of 2 fake PRs. Comment: "Placeholder: Return mock data for now" |
| `src/server/api/routers/github.ts` - `getStats` | **Mock Data** | Returns hardcoded stats object `{totalRepos: 5, openIssues: 12, ...}`. Comment: "In the future, this would call GitHub API" |
| `src/server/api/routers/search.ts` - `saveSearch` | **Stub** | Returns `{success: true}` without persisting. Comment suggests using localStorage instead |

### Acknowledged Limitations

| Location | Type | Details |
|---|---|---|
| `src/server/api/routers/vision.ts` - `uploadImage` | **Technical Debt** | Stores base64 directly in DB. Works but not production-scalable. Needs S3/Cloudinary. |
| `src/server/api/routers/suggestions.ts` | **Design Choice** | `AISuggestionService` uses rule-based heuristics, not actual AI/LLM. Named "AI" but is pattern matching. |
| `src/server/api/routers/reflections.ts` - `getRandomPrompts` | **Hardcoded** | Returns from a static list of 20 prompts. Not user-customizable or extensible. |
| `src/server/api/routers/collaboration.ts` - `inviteToList` | **TODO** | Has `// TODO: Send email notification` comment. Invite works but no notification sent. |

---

## 3. Integration Gaps

### Module System Coverage

The module system (`src/lib/modules.ts`) defines 13 module IDs. Several features exist as pages/routers but have **no module ID**, meaning they cannot be toggled on/off:

| Feature | Has Router | Has Page(s) | Has Module ID | Issue |
|---|---|---|---|---|
| Analytics | Yes | Yes (`/dashboard/analytics`) | **No** | Always visible, cannot be disabled |
| Suggestions | Yes | Yes (`/dashboard/suggestions`) | **No** | Always visible, cannot be disabled |
| Templates | Yes | Yes (`/dashboard/templates`) | **No** | Always visible, cannot be disabled |
| Vision Boards | Yes | Yes (`/dashboard/vision`) | **No** | Always visible, cannot be disabled |
| Yearly | Yes | Yes (`/dashboard/yearly`) | **No** (covered under "planning" module routes) | Grouped under planning, which is correct |
| Reflect | Yes | Yes (`/dashboard/reflect/*`) | **No** (covered under "planning" module routes) | Grouped under planning, which is correct |
| Focus Timer | Yes | No standalone page (widget only) | **No** (widget in "calendar" module) | Widget-only, tied to calendar module |

**Verdict**: Analytics, Suggestions, Templates, and Vision Boards should ideally have module IDs if users want to hide them. However, this is a minor UX gap, not a functional issue.

### Sidebar Navigation Completeness

The sidebar (`src/components/layout/sidebar.tsx`) organizes navigation into sections. Cross-referencing with existing pages:

| Page | In Sidebar | Notes |
|---|---|---|
| `/dashboard/vision` | Yes (under Goals) | Properly linked |
| `/dashboard/yearly` | Yes (under Review) | Properly linked |
| `/dashboard/reflect` | Yes (under Review) | Properly linked |
| `/dashboard/templates` | Yes (under Insights) | Properly linked |
| `/dashboard/analytics` | Yes (under Insights) | Properly linked |
| `/dashboard/suggestions` | Yes (under Insights) | Shows count badge |
| `/dashboard/contexts` | Yes (under Main) | Properly linked |

**Verdict**: All pages are reachable from the sidebar. No orphaned pages found.

### Dashboard Widget System

Dashboard widgets are controlled by the module system and preferences router. The `isWidgetEnabled()` function filters widgets based on enabled modules. Widget types mapped:

- tasks, habits, streaks, quick-capture, ideas, agenda, calendar, focus, goals, finance, someday-review, journal, weekly-review, github

All widget types have corresponding module mappings. No orphaned widgets found.

---

## 4. Top 10 Priority Recommendations

| # | Recommendation | Rationale | Scope |
|---|---|---|---|
| 1 | **Remove or complete GitHub integration** | 3 procedures return hardcoded mock data. Users see fake data. Either implement real GitHub API calls (OAuth + REST/GraphQL) or remove the feature entirely to avoid confusion. | **Large** (OAuth flow, API integration, rate limiting) or **Small** (removal) |
| 2 | **Implement search history persistence** | `saveSearch` is a stub returning `{success: true}`. Either implement server-side storage (add SearchHistory model to Prisma) or implement client-side localStorage properly in the frontend. | **Small** (localStorage) or **Medium** (server-side) |
| 3 | **Add collaboration email notifications** | `inviteToList` has a TODO for email notifications. Users get invited but never notified. Integrate a transactional email service (Resend, SendGrid, or Supabase email). | **Medium** (email service setup + templates) |
| 4 | **Move vision board images to cloud storage** | `uploadImage` stores base64 directly in PostgreSQL. This will cause DB bloat and slow queries. Migrate to S3/Cloudinary/Supabase Storage with URL references. | **Medium** (storage service + migration) |
| 5 | **Add module IDs for Analytics, Suggestions, Templates, Vision** | These 4 features have no module ID, so users cannot disable them in settings. Add them to the module system for consistent UX. | **Small** (add 4 entries to MODULE_IDS and MODULES config) |
| 6 | **Add real AI/LLM integration for suggestions** | Current "AI" suggestions are rule-based heuristics. Consider integrating OpenAI/Anthropic API for genuinely intelligent suggestions, or rename the feature to "Smart Suggestions" to set correct expectations. | **Large** (API integration, prompt engineering, cost management) or **Small** (rename only) |
| 7 | **Make reflection prompts configurable** | The 20 reflection prompts are hardcoded in the router. Add a ReflectionPrompt model to Prisma so users can add/edit/delete their own prompts. | **Small** (new model + CRUD router + UI) |
| 8 | **Add comprehensive test coverage for untested routers** | Only 5 routers have tests (tasks, habits, goals, daily, collaboration). The remaining 25 routers (finance, contacts, roles, journal, reflections, yearly, vision, etc.) have no test coverage. | **Large** (25 routers to test) |
| 9 | **Add input validation for search queries** | The `globalSearch` procedure accepts any string without length bounds on the `query` field. Add `.min(1).max(500)` to prevent empty searches and excessively long queries. | **Small** (one-line Zod change) |
| 10 | **Add recurring transaction support** | Finance router has `isRecurring` and `recurringRule` fields on transactions but no logic to automatically generate recurring transactions. Either implement a cron/scheduled job or remove the fields. | **Medium** (scheduled job + generation logic) |

---

## 5. Overall Assessment

### Strengths
- **Comprehensive feature set**: 27 distinct feature areas with 30 routers
- **Consistent patterns**: All routers use `protectedProcedure`, user-scoped queries, `TRPCError`
- **Strong security**: Zod validation with `.max()` bounds on all string inputs across 18+ routers
- **Module system**: Clean separation allowing users to enable/disable features
- **Bulk operations**: Tasks support bulk status/delete/category/priority changes

### Weaknesses
- **Test coverage**: Only 5 of 30 routers have tests (17% router coverage)
- **GitHub integration is non-functional**: Returns mock data, misleading to users
- **No email/notification system**: Collaboration invites have no notification delivery
- **Image storage in DB**: Vision boards store base64 in PostgreSQL

### Risk Areas
- **Database performance**: Vision board base64 images in PostgreSQL will degrade performance at scale
- **GitHub mock data**: Users may report bugs about "stale" GitHub data that never updates
- **No rate limiting**: All routers are unprotected against excessive API calls (typical for early-stage apps)

---

*Generated by Feature Gap Analysis Agent - Task #4*
