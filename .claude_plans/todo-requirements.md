# TODO Requirements Analysis

## Executive Summary

Digital Filofax is a web-based personal organisation system that translates the structure and intentionality of a physical Filofax into a digital format, offering tasks, habits, calendars, memos, ideas, finance, contacts, goals, reflections, and collaboration across 42 pages backed by 31 tRPC routers. The 12 open TODO items represent the gap between the current feature set and a production-ready, daily-driver personal productivity system -- ranging from deployment infrastructure (the app has never been hosted) to broken collaboration features and missing organisational primitives that users expect from any modern planner.

### Implementation Clusters

The 12 items group naturally into three clusters, each with internal dependency chains:

1. **Hosting and Distribution Cluster (Items 1, 2, 3)**: Getting the app deployed and accessible. Item 1 (Vercel hosting) is the absolute prerequisite -- nothing else matters if the app cannot be reached. Item 2 (PWA/iOS) extends reach to mobile. Item 3 (OpenClaw integration) is forward-looking research with no immediate user impact.

2. **Project Management Cluster (Items 4, 5, 9)**: Building the missing "Projects" abstraction. Item 4 (Project model + kanban) is foundational -- Items 5 (TODO.md import) and 9 (custom checklists) both depend on it and extend it in different directions.

3. **UX Organisation Cluster (Items 6, 7, 11)**: Wiring up categories, tags, and sorting across the app. Item 6 (categories/tags in Ideas and Memos) is the keystone -- backend support largely exists but the frontend never exposed the controls. Item 7 (habit groups) reuses the same category pattern. Item 11 (sorting) depends on both.

### Cross-Cutting Items

Items 8, 10, and 12 do not form a cluster but are independent fixes:

- **Item 8** (shared list invites) and **Item 10** (inbox always empty) are **bugs/gaps in shipped features** -- code exists but does not work end-to-end.
- **Item 12** (weekly/monthly recurrence) is a **behavioural enhancement** to an incomplete feature path.

### Bugs vs New Features

| Type | Items | Count |
|------|-------|-------|
| Bug / gap in existing feature | 8, 10 | 2 |
| New feature | 1, 2, 3, 4, 5, 9 | 6 |
| Enhancement to existing feature | 6, 7, 11, 12 | 4 |

### Recommended Execution Order

**Sprint 1 (Foundation)**: 1 → 10 → 8 → 6 -- Deploy the app, fix the two broken features, wire up category/tag UX.

**Sprint 2 (Core Features)**: 4 → 9 → 7 → 5 -- Build the Project model, extend it with checklists, add habit groups, enable TODO.md import.

**Sprint 3 (Polish and Research)**: 11 → 12 → 2 → 3 -- Add sorting across pages, fix recurrence for planners, research PWA/iOS, research OpenClaw.

---

## Item 4: Project Management -- Trello Style

### Link to Original Use Case

A physical Filofax has a "Projects" tabbed section where multi-step initiatives live across several pages. In paper form you write the project name, its goals, and a list of next actions -- but you have no way to visualise the flow of work from "to do" through "in progress" to "done". Trello-style kanban boards give this visual pipeline, making the digital version strictly more capable than paper.

### Current State

The app has a **Task model** with a `status` enum (`TODO`, `IN_PROGRESS`, `DONE`) and the tasks page already offers a toggle between `list` and `kanban` view modes (`src/app/dashboard/tasks/page.tsx`). Tasks can be linked to a **Goal** (via `goalId`) and grouped by **Category**, and there is a `Subtask` model for simple checklists. A `TemplateType.PROJECT` enum value exists but is only used for reusable template content -- there is no first-class **Project** entity that groups tasks, tracks overall progress, or provides a dedicated kanban board per project.

The `SomedayItemType.PROJECT` enum in the Someday model is a label only; it has no relation to actual task grouping.

### Problem Statement

Users cannot group related tasks into a named project with its own kanban board, progress tracking, and lifecycle, which means multi-step initiatives are scattered across the flat task list with no cohesive view of overall project health.

### Proposed Solution

1. **New `Project` Prisma model**: `id`, `name`, `description`, `status` (enum: `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`), `color`, `icon`, `dueDate`, `progress` (computed or stored), `userId`, timestamps. Add `projectId` optional FK on `Task`.
2. **New `projects` tRPC router**: CRUD operations, `getAll` (with status filter), `getById` (includes tasks grouped by status), `updateProgress` (recompute from child task completion).
3. **Dashboard page** `/dashboard/projects` -- card grid showing each project with progress bar and task counts.
4. **Project detail page** `/dashboard/projects/[id]` -- a Trello-style kanban board (reuse dnd-kit already in the project from Phase 2.4) with columns for each `TaskStatus`. Allow creating tasks directly into the project context.
5. **Wire Task model**: add optional `projectId` to `Task`, update the tasks router `create`/`update` to accept `projectId`, update task form dialog.
6. **Module toggle**: add `projects` to `modules.ts` so users can enable/disable.

### Success Criteria

1. User can create a project with name, description, colour, and optional due date.
2. User can view all their projects as cards with visual progress bars on `/dashboard/projects`.
3. User can open a project and see its tasks in a drag-and-drop kanban board (TODO / IN_PROGRESS / DONE columns).
4. User can create a new task directly within a project, and existing tasks can be assigned to a project via the task form.
5. Project progress percentage auto-updates when tasks are completed.

### Effort

**L** -- New Prisma model, new tRPC router, two new pages (list + detail/kanban), modifications to existing Task model/router/form, dnd-kit kanban integration per project. Estimate 3-5 days of focused work.

### Priority

**P1** -- Project management is the single most-requested organisational feature in personal productivity tools. Items 5 and 9 both depend on this model existing first. It also addresses the biggest structural gap: the app has tasks, goals, and habits, but no intermediate "project" container to bridge individual tasks to larger goals.

### Dependencies

- None (foundational -- items 5 and 9 depend on this).
- dnd-kit is already installed (used in sidebar reordering).

---

## Item 5: Project Management from _projects Folder TODO.md Files and Import

### Link to Original Use Case

The user is a developer who maintains TODO.md files inside project directories on their local filesystem (`_projects/` folder). In a physical Filofax, you would manually copy project statuses from scattered notes into a central "Projects" section. The digital version should be able to pull in these external TODO files automatically, eliminating the manual transcription step that paper requires.

### Current State

The app has an **import router** (`src/server/api/routers/import.ts`) that supports CSV, Todoist JSON, Apple Reminders JSON, and internal JSON import -- all as flat task lists. There is no mechanism to:
- Parse markdown TODO.md files.
- Map a file-system project folder to a Digital Filofax project entity.
- Re-sync or poll for changes after initial import.

The `ImportSource` enum has values `CSV`, `TODOIST`, `APPLE_REMINDERS`, `JSON` -- no `MARKDOWN` or `TODO_MD` source.

### Problem Statement

Users cannot import TODO.md files from their local development projects into the app, which means they must manually re-enter tasks that already exist in markdown files, causing duplication of effort and drift between the two systems.

### Proposed Solution

1. **Markdown TODO parser** (`src/lib/import-markdown.ts`): Parse standard markdown checkbox syntax (`- [ ] task`, `- [x] done task`), extract headings as project/section names, and support nested indentation as subtasks. Use a simple regex-based parser (no heavy dependency needed).
2. **New `ImportSource.MARKDOWN` enum value** in Prisma schema.
3. **New import procedure** `import.fromMarkdown` in the import router: accepts markdown content + filename, parses it, creates/updates a Project (from item 4) and its child tasks.
4. **Batch import UI**: A page or dialog at `/dashboard/projects/import` where the user can paste or upload one or more TODO.md files. Each file maps to one project (project name derived from filename or first heading).
5. **Re-import / sync**: Store a `sourceFile` field on Project so that re-importing the same filename updates existing tasks rather than duplicating them (match by title within project).
6. **Future enhancement (not MVP)**: A local file watcher or CLI tool that pushes TODO.md changes to the API -- out of scope for initial implementation since the app runs in a browser with no filesystem access.

### Success Criteria

1. User can upload/paste a TODO.md file and see it parsed into a project with tasks and subtasks.
2. Checkbox state (`- [x]`) is correctly mapped to `TaskStatus.DONE` vs `TaskStatus.TODO`.
3. Nested items (indented `- [ ]` under a parent) are created as subtasks.
4. Re-importing the same file updates existing tasks rather than creating duplicates.
5. Import log records the operation with `ImportSource.MARKDOWN`.

### Effort

**M** -- The parser is straightforward (regex over markdown lines), the import router pattern already exists to follow, and the UI is a single upload/paste dialog. The tricky part is the update-on-reimport logic. Estimate 2-3 days.

### Priority

**P2** -- Valuable for the specific user (developer with TODO.md files), but niche compared to general project management. Depends on item 4 being built first so that imported content maps to a Project entity. Without item 4, this would just create flat tasks, which the existing CSV import already does.

### Dependencies

- **Item 4** (Project model) -- imported TODO.md files need a Project to attach to.
- Existing import router infrastructure (`src/server/api/routers/import.ts`, `src/lib/import.ts`).

---

## Item 9: Custom To-Do List with Tracking, Progress, Subtasks, Projects, and Status

### Link to Original Use Case

In a physical Filofax, people create custom checklists for everything: packing lists, shopping lists, reading lists, home renovation steps, learning tracks. These are distinct from the main "Tasks" section -- they are purpose-built lists with their own tracking. Paper lists have no progress bars, no percentage complete, no way to link to a broader project. The digital version should provide custom to-do lists that go beyond what paper offers.

### Current State

The app has:
- **Tasks** with `Subtask[]` for simple checklists, linked optionally to a `Goal`.
- **SharedList** for collaboration (but these are sharing containers, not custom to-do lists).
- **Template** with `TemplateType.CHECKLIST` for reusable content, but templates are blueprints, not live trackable lists.
- **Categories** for grouping tasks.
- Tasks have `status` (TODO/IN_PROGRESS/DONE) and `priority`, but no "custom list" container that shows aggregate progress.

The gap: there is no way to create a named, standalone checklist (e.g., "Home Renovation Checklist") that shows progress (12/20 items done, 60%), links to a project, and supports rich subtask hierarchies.

### Problem Statement

Users cannot create custom, named to-do lists with aggregate progress tracking and project linkage, which means purpose-specific checklists (packing, learning, renovation) are either crammed into the flat task list or tracked outside the app entirely.

### Proposed Solution

This item overlaps significantly with **Item 4** (Project Management). The recommended approach is to unify them:

1. **Extend the Project model** (from item 4) to support a `projectType` field: `KANBAN` (Trello-style, item 4) vs `CHECKLIST` (custom to-do list, item 9). This avoids creating a separate model that would duplicate task-grouping logic.
2. **Checklist view** for projects with `projectType = CHECKLIST`: a simple ordered list of tasks with checkboxes, a progress bar at the top (X/Y completed, percentage), and inline subtask expansion.
3. **Progress computation**: Stored `progress` field on Project, updated via a Prisma middleware or explicit recomputation in the tasks router when a task status changes. Progress = (completed tasks / total tasks) * 100.
4. **Project linkage**: Tasks in a checklist-type project inherit the `projectId`. The Project itself can optionally link to a `Goal` (add `goalId` FK on Project).
5. **Status tracking**: Each task already has `TODO`/`IN_PROGRESS`/`DONE`. The checklist view surfaces this with visual indicators (unchecked, in-progress spinner, checked).
6. **Dashboard widget**: A "My Lists" widget showing active checklist-type projects with progress bars.

### Success Criteria

1. User can create a checklist-type project with a name and ordered list of items.
2. Checking off items updates the progress bar in real-time (e.g., "8/12 complete -- 67%").
3. Each checklist item supports subtasks (expandable inline).
4. A checklist can be linked to a goal (e.g., "Q1 Fitness" goal links to "Gym Equipment Checklist").
5. The project detail page shows the correct view (kanban vs checklist) based on `projectType`.

### Effort

**M** -- If item 4 is built first, this is an incremental addition: one new enum value, one alternative view component for the project detail page, and progress computation logic. Estimate 2 days. If built standalone (without item 4), it becomes **L** because a new model and router are needed from scratch.

### Priority

**P2** -- Important for the "personal OS" vision (custom lists are a daily-use feature), but the core task management (item 4) must land first. This is a natural Phase 2 after item 4 ships.

### Dependencies

- **Item 4** (Project Management) -- the Project model is the foundation. Building this as a separate model would create confusing overlap.
- Existing Subtask model for nested items.

---

## Cross-Item Analysis: Items 4, 5, and 9

These three items form a **Project Management cluster** with a clear dependency chain:

```
Item 4 (Project model + Kanban)
  |
  +-- Item 9 (Checklist view + progress tracking)  [extends Item 4]
  |
  +-- Item 5 (TODO.md import into Projects)         [depends on Item 4]
```

**Recommended implementation order**: 4 -> 9 -> 5

**Unified data model**: A single `Project` entity with a `projectType` field (`KANBAN` | `CHECKLIST`) avoids model proliferation and keeps the architecture clean. Both kanban and checklist views operate on the same underlying `Project + Task[]` structure, differing only in presentation.

**Total estimated effort**: L (4) + M (9) + M (5) = approximately 7-10 days for the full cluster.

---

## Item 8: Test Invite to Shared List

### Link to Original Use Case

A physical Filofax is inherently personal -- you cannot share a page with a family member or colleague without photocopying it. The collaboration module was built to solve exactly this: shared grocery lists, household chores, team project tasks. However, if the invite flow is broken or untested, the feature is effectively unusable, and users fall back to separate tools (Reminders, Todoist) for shared work.

### Current State

The backend infrastructure is fully built:
- `SharedList`, `SharedListMember`, `ListInvite` Prisma models exist with proper indexes and constraints (`prisma/schema.prisma` lines 1079-1152).
- `collaboration.ts` router implements: `createSharedList`, `inviteToList`, `acceptInvite`, `getMyPendingInvites`, `removeFromList`, `updateMemberRole`, `addTaskToList`, `removeTaskFromList`, `leaveList`, `deleteSharedList`, `updateSharedList` (full CRUD with 11 procedures).
- `inviteToList` generates a 32-byte hex token, sets 7-day expiry, but has a `// TODO: Send email notification` comment (line 358) -- meaning there is **no delivery mechanism** for the invite token.
- `acceptInvite` validates token, checks expiry, verifies email matches the logged-in user, then creates the `SharedListMember` record.
- UI exists at `/dashboard/shared` (list view) and `/dashboard/shared/[id]` (detail view with invite dialog, task management, role changes).

**Gap**: The invite token is generated and stored in the database, but there is no way for the invited user to receive or use it. No email is sent, no in-app notification appears, and there is no `/invite/[token]` page or route to accept invites. The `getMyPendingInvites` procedure exists but is not visibly surfaced in the shared list UI, so pending invites are invisible to recipients.

### Problem Statement

Users cannot invite others to shared lists because the invite token has no delivery mechanism (no email, no shareable link, no in-app notification), which means the entire collaboration feature is non-functional for multi-user scenarios.

### Proposed Solution

1. **Shareable invite link**: After `inviteToList` succeeds, display the generated token as a URL (e.g., `/invite/[token]`) that the list owner can copy and share manually via any channel (lowest-effort delivery mechanism).
2. **Accept invite page**: Create `src/app/invite/[token]/page.tsx` that calls `collaboration.acceptInvite` when the logged-in user visits. Redirect unauthenticated visitors to sign-in first, then back to the accept flow.
3. **Pending invites UI**: Surface `getMyPendingInvites` results on the `/dashboard/shared` page (or as a notification badge in the sidebar) so registered users see their pending invitations without needing the link.
4. **Copy-to-clipboard button**: In the invite dialog on `/dashboard/shared/[id]`, after creating an invite, show the link and a "Copy Link" button instead of the current silent success.
5. **Optional email delivery (deferred)**: Integrate a transactional email service (Resend, SendGrid) to send the invite link. This can be a follow-up enhancement.

### Success Criteria

1. Owner can create an invite and immediately see a shareable link with a copy-to-clipboard button.
2. A registered user visiting the invite link is added to the shared list with the correct role and redirected to the list detail page.
3. An unauthenticated visitor to the invite link is redirected to sign-in first, then back to the invite acceptance flow.
4. Expired tokens (>7 days) show a clear error message, not a generic 404.
5. Pending invites are visible on the shared lists page for the recipient.

### Effort

**M (Medium)** -- The backend is complete. This requires one new page (`/invite/[token]`), modifications to the invite dialog UI, and surfacing pending invites. No schema changes needed.

### Priority

**P1** -- Without this fix, the entire collaboration module (5 models, 11 router procedures, 2 UI pages, 23 tests) is effectively dead code. This is a blocking bug for a shipped feature.

### Dependencies

- None. All backend procedures already exist and are tested.

---

## Item 10: Inbox Always Appears Empty

### Link to Original Use Case

The Quick Notes Inbox (Phase 3.7) was built to replicate the GTD "capture everything" principle -- the Filofax equivalent of jotting something on the first blank page you can find. If the inbox appears empty despite items being captured, the user loses trust in the system. Items captured via Cmd+J (Quick Capture) would vanish into a void, and the user reverts to paper or a separate app for quick capture.

### Current State

- `InboxItem` model exists in the schema (lines 1154-1168) with `title`, `content`, `sourceHint`, `processed`, `userId`.
- `inbox.ts` router has: `getAll` (filters `processed: false`), `getCount`, `create`, `processAsTask`, `processAsMemo`, `processAsIdea`, `delete`.
- The Quick Capture dialog (`src/components/quick-capture-dialog.tsx`) defaults to "inbox" capture type and creates items via `api.inbox.create`.
- The inbox page (`src/app/dashboard/inbox/page.tsx`) queries `api.inbox.getAll` and displays items with process/delete actions.
- The sidebar shows an inbox count badge via `api.inbox.getCount`.

**Potential root causes of "always empty"**:

1. **Quick Capture type mismatch**: If the user selects "task", "memo", or "idea" (not "inbox") in the Quick Capture dialog, items go directly to those respective models, bypassing `InboxItem` entirely. The default is "inbox" but the user may habitually switch to another type, expecting all captures to appear in the inbox regardless.
2. **Cache invalidation gap**: The Quick Capture dialog's `inbox.create` mutation may not be invalidating `inbox.getAll` and `inbox.getCount`. If the inbox page is already open, it would show stale (empty) data until a manual refresh.
3. **User scoping alignment**: If the `DEV_AUTH_BYPASS` session user ID does not match the `userId` on created items this would cause a mismatch, though this is unlikely since the router always uses `ctx.session.user.id` for both reads and writes.
4. **Processing race**: Items may be created and immediately processed by another flow, marking `processed: true` and hiding them from `getAll`.

The most likely cause is **#1 or #2**: either the user expects all Quick Capture items to land in the inbox regardless of type selection, or the inbox page cache is not refreshed after capture.

### Problem Statement

Users cannot see items they captured via Quick Capture in the inbox, which means the GTD "capture and process later" workflow is broken, undermining trust in the system as a reliable collection point.

### Proposed Solution

1. **Verify and fix cache invalidation**: Audit the Quick Capture dialog's `inbox.create` mutation `onSuccess` callback to ensure it calls `utils.inbox.getAll.invalidate()` and `utils.inbox.getCount.invalidate()`.
2. **Toast confirmation**: Show a brief toast notification ("Added to Inbox") when an inbox item is created, giving the user immediate feedback that the capture succeeded.
3. **UX clarification on capture types**: When the user selects "task" type in Quick Capture, add a subtitle like "Goes directly to Tasks" vs "inbox" showing "Process later from your Inbox". This eliminates the expectation mismatch.
4. **Improved empty state**: The inbox page should distinguish between "no items captured yet" (show onboarding prompt with Cmd+J shortcut) and "all items processed" (show a congratulatory message). Currently it likely shows the same empty state for both.
5. **Debug path**: If the above UX changes do not resolve the report, add a `getAll` variant that includes recently processed items (last 24h) to help the user see that items were captured but already processed.

### Success Criteria

1. Creating an inbox item via Quick Capture (Cmd+J with "inbox" selected) immediately appears on `/dashboard/inbox` without a page refresh.
2. The sidebar inbox badge count increments in real-time after capture.
3. The inbox page shows a helpful empty state that distinguishes "no items captured yet" from "all items processed", with a prompt to use Cmd+J.
4. Quick Capture type labels clearly indicate destination (e.g., "Inbox (process later)" vs "Task (add directly)").

### Effort

**S (Small)** -- This is likely a cache invalidation fix in the Quick Capture dialog's mutation `onSuccess` callback, plus minor UX copy improvements. If the issue is purely expectation-based (user captures as "task" but looks in inbox), the fix is UI copy improvement only.

### Priority

**P1** -- The inbox is the entry point for the GTD capture workflow, which is a core daily interaction. If it appears broken, users abandon the app's capture system entirely. The fix is small and the impact is high.

### Dependencies

- None. All infrastructure exists; this is a bug fix / UX clarification.

---

## Item 12: Weekly and Monthly Tasks Should Automatically Be Recurring and Appear in Future Weeks/Months

### Link to Original Use Case

In a physical Filofax, recurring tasks (weekly grocery run, monthly rent payment, quarterly review) are typically written on a recurring template page or manually copied forward week after week. This is one of the most tedious aspects of paper planning -- you forget to copy a task, and it silently disappears from your system. The digital version should eliminate this friction entirely: tasks assigned to "this week" should automatically roll forward or regenerate for next week when marked as recurring.

### Current State

- The Task model has `weekOf` (DateTime? @db.Date) and `monthOf` (DateTime? @db.Date) fields for planning view assignment (schema lines 151-152), with indexes on both fields.
- The Task model has `recurrenceRule` (String?) for defining repeat patterns (schema line 145), with `parentTaskId` for linking recurrence chains.
- `src/lib/recurrence.ts` provides `parseRecurrenceRule`, `serializeRecurrenceRule`, and `getNextDueDate` for daily/weekly/monthly/yearly frequencies.
- The tasks router spawns a new occurrence when a recurring task is marked DONE (lines 174-202): it creates a child task with the next `dueDate`, copies `recurrenceRule`, title, description, priority, category, context, and goal.
- `tasks.getWeeklyTasks` (line 326) queries by exact `weekOf` match. `tasks.getMonthlyTasks` (line 343) queries by exact `monthOf` match.
- **The weekly planner page** uses `tasks.getScheduledTasks` (by `scheduledStart` date range) for time-blocked tasks, and `tasks.getAll` for unscheduled tasks. It does **not** use `getWeeklyTasks`.
- **The monthly planner page** fetches all tasks via `tasks.getAll` and filters client-side by `dueDate`. It does **not** use `getMonthlyTasks`.

**Gaps**:

1. **No auto-generation for future periods**: When a user assigns a task to "this week" via `weekOf`, there is no mechanism to create a copy for next week. The recurrence system only spawns on task completion (DONE status), and it only advances `dueDate`, not `weekOf`/`monthOf`.
2. **`getWeeklyTasks` / `getMonthlyTasks` are unused**: The planner pages do not call these procedures. The `weekOf`/`monthOf` fields appear to be an incomplete feature path -- the schema supports them, the router has queries for them, but the UI does not use them.
3. **No carry-forward for incomplete tasks**: If a task assigned to week X is not completed, it does not appear in week X+1. It stays attached to the old week and becomes invisible when the user navigates forward.
4. **Recurrence spawning requires DONE + dueDate**: The existing recurrence logic (lines 176-202) only triggers when `status` changes to DONE, and requires `dueDate` to compute the next occurrence via `getNextDueDate()`. Tasks with only `weekOf`/`monthOf` (no `dueDate`) are not handled by the recurrence system.

### Problem Statement

Users cannot create tasks that automatically appear in every future week or month, which means recurring obligations (weekly reviews, monthly bills, recurring chores) must be manually recreated each period, replicating the worst friction of paper Filofax planning.

### Proposed Solution

**Recommended: Extend recurrence system to weekOf/monthOf (lazy generation pattern)**

1. **Extend recurrence spawning in the tasks router**: When a recurring task with `weekOf` is marked DONE, the spawned child task should have its `weekOf` advanced to the next week (using `addWeeks` from date-fns). Same for `monthOf` with `addMonths`. This connects the existing `weekOf`/`monthOf` fields to the recurrence chain.
2. **Lazy generation for future periods**: Add a `tasks.ensureRecurringForPeriod` procedure. When the user navigates to a future week/month in the planner, call this procedure to check for recurring templates that should have instances in that period but do not yet. Generate instances on demand. This avoids creating unbounded future tasks.
3. **Carry forward incomplete tasks**: Modify `getWeeklyTasks` to optionally include incomplete tasks from previous weeks (tasks where `weekOf < currentWeek` and `status != DONE`). Display these with a visual "carried forward" indicator in the planner UI.
4. **Connect planner pages to the correct queries**: Refactor the weekly planner to use `getWeeklyTasks` (enhanced) and the monthly planner to use `getMonthlyTasks` (enhanced), or add a unified query that merges time-blocked tasks, week-assigned tasks, and carried-forward tasks.
5. **UI for setting recurrence on week/month assignment**: When a user creates a task in the weekly planner, provide a toggle/checkbox "Repeat every week". This sets `recurrenceRule: {"frequency":"weekly"}` on the task.

**Alternative: Template-based approach (simpler but less integrated)**

1. Allow users to define a "weekly template" (list of tasks auto-applied each week) using the existing `Template` model with `TemplateType.WEEKLY_PLAN`.
2. When navigating to a new week, prompt to apply the template or auto-apply.
3. Downside: does not integrate with the recurrence chain or carry-forward logic.

### Success Criteria

1. A task marked as "weekly recurring" and assigned to a specific week automatically has a new instance generated for the following week when the original is completed.
2. A task marked as "monthly recurring" assigned to a specific month auto-generates for the next month upon completion.
3. Navigating to a future week/month in the planner shows expected recurring task instances (lazy-generated).
4. Incomplete tasks from previous weeks are visible (with a "carried forward" indicator) in the current week's planner view.
5. Users can remove recurrence from a weekly/monthly task to stop future generation.

### Effort

**L (Large)** -- This requires changes across multiple layers: extending the recurrence spawning logic in the tasks router to advance `weekOf`/`monthOf`, adding lazy generation logic for future periods, refactoring both planner pages to use the `getWeeklyTasks`/`getMonthlyTasks` procedures (or enhanced replacements), adding carry-forward query logic for incomplete tasks, adding UI for setting recurrence on week/month task assignment, and thorough testing of recurrence edge cases (month boundaries, year transitions, DST changes).

### Priority

**P2** -- This is a significant quality-of-life improvement that directly addresses one of the key advantages of digital over paper. However, the current system is functional (users can manually create tasks each week), so it is an enhancement rather than a critical blocker. It should be addressed after P1 bug fixes (items 8 and 10) but before lower-priority feature additions.

### Dependencies

- Existing recurrence system (`src/lib/recurrence.ts`, task router spawning logic on DONE).
- The `weekOf`/`monthOf` fields and `getWeeklyTasks`/`getMonthlyTasks` router procedures need to be connected to the planner UIs -- this is a prerequisite refactoring step that is part of this item's scope.
- No dependency on other TODO items.

---

**Analyst**: analyst-ux
**Scope**: Items 6 (Categories/Tags in Ideas & Memos), 7 (Habit Groups), 11 (Sorting)

---

## Item 6: Support Categories and Tags in Ideas & Memos

### Link to Original Use Case
In a physical Filofax, ideas and memos are organised with divider tabs and coloured stickers. Without digital equivalents, the Ideas and Memos sections become flat, unsearchable lists that grow unwieldy over time -- the exact problem the digital version should solve.

### Current State
- **Backend**: The Prisma schema already defines the relationships. `Idea` has a `categoryId` FK to `Category` and an M:N relation to `Tag` via `IdeaTags`. `Memo` has an M:N relation to `Tag` via `MemoTags` but **no category relation at all**.
- **Routers**: `ideas.ts` accepts `categoryId` and `tagIds` on create/update and filters by them in `getAll`. `memos.ts` accepts `tagIds` on create/update and filters by them in `getAll`.
- **Frontend gap**: Neither `ideas/page.tsx` nor `memos/page.tsx` renders any category or tag selector in the create/edit dialogs. Tags are **displayed** as read-only badges but cannot be assigned, edited, or created from these pages. The `categories.getAll` and `tags.getAll` queries are never called from either page.
- **Inline creation**: There is no inline "create new tag" or "create new category" flow from the Ideas or Memos pages. Users must navigate to a separate settings/management page first.

### Problem Statement
Users cannot assign categories or tags to their ideas and memos from the create/edit UI, which means their growing collection of notes and ideas has no meaningful organisation, defeating the purpose of digital over paper.

### Proposed Solution
1. **Memos schema**: Add an optional `categoryId` FK on the `Memo` model pointing to `Category` (mirroring the Idea model pattern). Run `db:generate` and `db:push`.
2. **Create/Edit dialogs**: In both `ideas/page.tsx` and `memos/page.tsx`, add a `<Select>` for category (fetched via `api.categories.getAll.useQuery()`) and a multi-select/combobox for tags (fetched via `api.tags.getAll.useQuery()`).
3. **Inline creation**: Add a "Create new..." option at the bottom of both the category and tag dropdowns. This calls `api.categories.create.useMutation()` or `api.tags.create.useMutation()` inline, then auto-selects the newly created item. Follow the pattern used in the Tasks page if one exists, otherwise use a simple inline input + confirm.
4. **Filter bar**: Extend the existing filter/search bar on both pages to include category and tag filter chips (the router already supports these filter parameters).
5. **Memos router**: Update `memos.ts` to accept `categoryId` on create/update and include `category` in query responses.

### Success Criteria
1. Users can select an existing category and one or more tags when creating or editing an Idea.
2. Users can select an existing category and one or more tags when creating or editing a Memo.
3. Users can create a new category or tag inline from the create/edit dialog without navigating away.
4. The Ideas and Memos list pages can be filtered by category and/or tags.
5. Newly created categories/tags are immediately available for selection (cache invalidation works).

### Effort
**M (Medium)** -- The backend plumbing largely exists. The work is primarily frontend: two create/edit dialogs need category + tag selectors with inline creation, plus filter bar updates. Schema change for Memo.categoryId is minor.

### Priority
**P1** -- This is a foundational organisational capability. Without it, Ideas and Memos are flat lists that become unusable at scale. Every other sorting/filtering feature (Item 11) depends on items having categories and tags to sort by.

### Dependencies
- None (standalone), but this unblocks **Item 11** (sorting by categories/tags).

---

## Item 7: Habit Groups and Sub-Habits

### Link to Original Use Case
In a physical Filofax habit tracker, habits are often grouped by theme on the same page -- a "Wellness" row might contain sub-items like "Vitamins", "8 glasses of water", "Meditate". The current flat list of habits does not mirror this hierarchical structure, making it harder to see thematic progress at a glance.

### Current State
- **Schema**: The `Habit` model has no `parentHabitId` or `groupId` field. All habits exist as a flat list with only `categoryId` as an optional grouping mechanism.
- **Router**: `habits.ts` has 12 procedures (getAll, getById, create, update, delete, logCompletion, removeLog, getLogs, getTodayStatus, getStreakInfo, getHeatmapData, getStreakStats). None support hierarchy.
- **Frontend**: `habits/page.tsx` renders a flat card-per-habit layout. No visual grouping, collapsible sections, or parent-child UI exists. Categories are available in the backend but not used for visual grouping in the UI.
- **Category workaround**: Habits have `categoryId` that could provide grouping, but the habits page does not query or display categories. The category selector is absent from the create/edit habit dialog.

### Problem Statement
Users cannot group related habits (e.g. "Supplements", "Exercise", "Wellness") into collapsible sections with aggregate progress, which means tracking 15+ daily habits becomes an overwhelming flat checklist rather than a structured health dashboard.

### Proposed Solution
**Option A -- Use existing Category model as groups (Recommended)**:
1. Surface the existing `categoryId` on habits as the grouping mechanism. Add a category selector to the habit create/edit dialog.
2. On the habits page, group habits by category. Render each category as a collapsible section with an aggregate completion badge (e.g. "3/5 done").
3. Uncategorised habits appear in a default "Other" group.
4. Allow inline category creation from the habit dialog (same pattern as Item 6).
5. This avoids schema changes entirely and reuses the existing `Category` model.

**Option B -- Self-referential parent-child habits (More complex)**:
1. Add `parentHabitId String?` and self-relation on `Habit` model (similar to Task's `parentTaskId` pattern).
2. Parent habits aggregate their children's completion (e.g. "Supplements" is 3/4 when 3 of 4 sub-habits are done).
3. Logging a parent habit could auto-complete all children, or parent completion could be derived.
4. This requires schema migration, router changes, and significant frontend restructuring.

**Recommendation**: Start with Option A. It delivers 80% of the value (visual grouping, collapsible sections, aggregate stats) with 20% of the effort. Option B can be layered on later if true parent-child habit semantics (inherited logging, cascading archival) are needed.

### Success Criteria
1. Habits page renders habits grouped by category in collapsible sections.
2. Each group header shows aggregate completion count (e.g. "Supplements: 3/4 today").
3. Users can assign a category (group) to a habit from the create/edit dialog.
4. Users can create a new category inline from the habit dialog.
5. Uncategorised habits appear in a default section.

### Effort
**S (Small) for Option A** -- Frontend-only changes: add category selector to dialog, group habits by category in the list view, add collapsible section UI. No schema changes.
**L (Large) for Option B** -- Schema migration, router updates for parent-child CRUD, cascading logic, significant frontend restructuring.

### Priority
**P2** -- Improves usability for power users with many habits but is not a blocker for other features. Most users with fewer than 10 habits can manage a flat list. The category-based approach (Option A) can be shipped quickly as a quick win.

### Dependencies
- Benefits from **Item 6** (inline category creation pattern), but not strictly dependent -- categories already exist in the system.

---

## Item 11: Enable Sorting for Every Page

### Link to Original Use Case
A physical Filofax allows manual reordering of pages by pulling them out and reinserting them. The digital version should surpass this by offering instant sorting by any meaningful dimension -- date, category, priority, tag, status, name -- which paper cannot do.

### Current State
- **No sort UI**: None of the following pages have a sort dropdown or sort controls: Ideas, Memos, Habits, Contacts (beyond alphabetical grouping), Goals, Someday/Maybe, Finance transactions.
- **Server-side ordering**: Most tRPC routers use hardcoded `orderBy` (e.g. `createdAt: "desc"` in ideas.ts, `isPinned: "desc"` then `updatedAt: "desc"` in memos.ts). The sort criteria are not parameterised.
- **Client-side sorting**: No pages implement client-side sort logic.
- **Existing patterns**: The Tasks page has DnD reordering (dnd-kit) for manual ordering but no multi-criteria sort dropdown. Contacts use A-Z alphabetical grouping. No page has a proper "Sort by: [dropdown]" control.

### Problem Statement
Users cannot sort their lists by categories, tags, priority, date, or status, which means finding specific items in growing lists requires scrolling through unsorted content -- a regression from the physical Filofax's manual page ordering.

### Proposed Solution
1. **Reusable SortDropdown component**: Create a `<SortDropdown>` component in `src/components/ui/` that accepts a list of sort options (`{ label: string, value: string, direction: "asc" | "desc" }`) and renders a shadcn `<Select>` or `<DropdownMenu>`. Store the selected sort in `useState` (or localStorage for persistence).
2. **Client-side sorting**: Implement sorting client-side using `Array.sort()` on the already-fetched data. This avoids router changes and works with the existing `getAll` queries. Pages that fetch all data already (Ideas, Memos, Habits, Goals, Contacts, Someday) are good candidates.
3. **Sort options per page**:
   - **Tasks**: Priority, Due Date, Category, Status, Created Date, Alphabetical
   - **Ideas**: Priority, Status, Category, Tag, Created Date, Alphabetical
   - **Memos**: Type, Pinned, Category (after Item 6), Tag, Updated Date, Alphabetical
   - **Habits**: Category/Group (after Item 7), Streak Length, Completion Rate, Alphabetical
   - **Goals**: Status, Type, Deadline, Progress %, Category, Alphabetical
   - **Contacts**: Name (existing), Company, Category, Favourite, Recently Updated
   - **Someday/Maybe**: Type, Category, Review Date, Created Date
   - **Finance**: Date, Amount, Type, Category
4. **Group-by mode**: For category and tag sorting, consider a "Group by" variant that renders section headers rather than just reordering the flat list.
5. **Persist preference**: Store the selected sort per page in localStorage (key: `filofax-sort-{pageName}`), following the existing sidebar state persistence pattern.

### Success Criteria
1. A reusable `SortDropdown` component exists and is used on at least 5 pages.
2. Each applicable page offers at least 3 meaningful sort options.
3. Sort preference persists across page navigations (localStorage).
4. Sorting by category groups items visually under category headers.
5. Default sort order matches current behaviour (no regression).

### Effort
**M (Medium)** -- The SortDropdown component is straightforward. The main effort is integrating it into each page (8+ pages) and defining/testing the sort comparator functions for each page's data shape. No backend changes needed.

### Priority
**P2** -- Sorting is a quality-of-life improvement that becomes more valuable as data grows. It is not blocking any other feature, but it depends on categories and tags being assignable first (Item 6) to be fully useful. Ship after Item 6.

### Dependencies
- **Item 6** (categories/tags in Ideas & Memos) -- sorting by category/tag is only useful if items have categories and tags assigned.
- **Item 7** (habit groups) -- sorting habits by group is only useful once groups exist.

---

## Cross-Item Analysis: Items 6, 7, and 11

These three items form a **UX Organisation cluster** with a clear dependency chain:

```
Item 6 (Categories/Tags in Ideas & Memos)  [P1]
  |
  +-- Item 7 (Habit Groups via Category)    [P2, benefits from Item 6 pattern]
  |
  +-- Item 11 (Sorting for Every Page)      [P2, depends on Items 6 & 7]
```

**Recommended implementation order**: 6 -> 7 -> 11

**Key insight**: Item 6 is the keystone. The backend already supports categories and tags for both Ideas and Memos, but the frontend never wired up the selectors. This is largely a UI gap, not an architecture gap. Fixing it first makes Items 7 and 11 significantly more useful.

| Item | Title | Effort | Priority | Depends On |
|------|-------|--------|----------|------------|
| 6 | Categories/Tags in Ideas & Memos | M | P1 | None |
| 7 | Habit Groups (Option A) | S | P2 | Benefits from Item 6 pattern |
| 11 | Sorting for Every Page | M | P2 | Items 6, 7 |

**Total estimated effort**: M (6) + S (7) + M (11) = approximately 5-7 days for the full cluster.

---

## Priority Matrix

### Effort vs Priority Grid

|          | **S (Small)** | **M (Medium)** | **L (Large)** | **XL** |
|----------|:-------------:|:--------------:|:-------------:|:------:|
| **P1**   | 1, 10         | 6, 8           | 4             |        |
| **P2**   | 7             | 5, 9, 11       | 12            |        |
| **P3**   |               |                | 3             |        |

*Item 2 (iOS/PWA) is P2, M.*

### Full Item Summary Table

| Item | Title | Priority | Effort | Type | Cluster |
|------|-------|----------|--------|------|---------|
| 1 | Hosting (Vercel) | P1 | S | New feature | Hosting |
| 2 | iOS/PWA (Capacitor/PWA) | P2 | M | New feature | Hosting |
| 3 | OpenClaw integration | P3 | L | New feature (research) | Hosting |
| 4 | Project Management -- Trello Style | P1 | L | New feature | Project Mgmt |
| 5 | TODO.md Import | P2 | M | New feature | Project Mgmt |
| 6 | Categories/Tags in Ideas and Memos | P1 | M | Enhancement | UX Organisation |
| 7 | Habit Groups | P2 | S | Enhancement | UX Organisation |
| 8 | Shared List Invites | P1 | M | Bug fix | Independent |
| 9 | Custom To-Do Lists / Checklists | P2 | M | New feature | Project Mgmt |
| 10 | Inbox Always Empty | P1 | S | Bug fix | Independent |
| 11 | Sorting for Every Page | P2 | M | Enhancement | UX Organisation |
| 12 | Weekly/Monthly Recurrence | P2 | L | Enhancement | Independent |

### Recommended Sprint Order

**Sprint 1 -- Foundation and Fixes (target: 1 week)**

Quick wins and blockers. Deploy the app, fix broken features, unblock downstream work.

1. **Item 1** (Hosting) -- P1/S. Vercel deployment. Zero config beyond env vars. Everything else is useless without this.
2. **Item 10** (Inbox Empty) -- P1/S. Cache invalidation fix + UX copy. Restores trust in the capture system.
3. **Item 8** (Shared List Invites) -- P1/M. Accept-invite page + copy-link UI. Unblocks the entire collaboration module.
4. **Item 6** (Categories/Tags) -- P1/M. Wire frontend to existing backend. Unblocks Items 7 and 11.

**Sprint 2 -- Core Features (target: 2 weeks)**

Build the Project abstraction and extend organisational capabilities.

5. **Item 4** (Project Management) -- P1/L. New model, router, and two pages. Foundation for Items 5 and 9.
6. **Item 9** (Custom Checklists) -- P2/M. Extend Project with `projectType: CHECKLIST`. Natural follow-on to Item 4.
7. **Item 7** (Habit Groups) -- P2/S. Surface `categoryId` on habits page. Reuses pattern from Item 6.
8. **Item 5** (TODO.md Import) -- P2/M. Markdown parser + import dialog. Depends on Item 4.

**Sprint 3 -- Polish and Research (target: 2 weeks)**

Quality-of-life improvements and forward-looking research.

9. **Item 11** (Sorting) -- P2/M. Reusable SortDropdown across 8+ pages. Benefits from Items 6 and 7 being done.
10. **Item 12** (Recurrence) -- P2/L. Extend recurrence to weekOf/monthOf, carry-forward logic. Complex but self-contained.
11. **Item 2** (iOS/PWA) -- P2/M. PWA with next-pwa/serwist first, Capacitor native wrapper later. Depends on Item 1.
12. **Item 3** (OpenClaw) -- P3/L. REST API wrapper over tRPC. Research only; wait for ecosystem maturity.

### Dependency Graph

```
Item 1 (Hosting)
  |
  +---> Item 2 (PWA/iOS) -- cannot distribute without hosting
  |
  +---> Item 3 (OpenClaw) -- cannot expose API without hosting

Item 4 (Project Model)
  |
  +---> Item 5 (TODO.md Import) -- needs Project entity to import into
  |
  +---> Item 9 (Custom Checklists) -- extends Project with CHECKLIST type

Item 6 (Categories/Tags)
  |
  +---> Item 7 (Habit Groups) -- reuses inline category creation pattern
  |
  +---> Item 11 (Sorting) -- sorting by category/tag requires assignable categories

Item 7 (Habit Groups)
  |
  +---> Item 11 (Sorting) -- sorting habits by group requires groups to exist

Items with NO upstream dependencies: 1, 4, 6, 8, 10, 12
Items with NO downstream dependents: 2, 3, 5, 8, 10, 11, 12
Critical path (longest chain): 4 -> 9, 4 -> 5, 6 -> 7 -> 11
```

### Estimated Total Effort

| Sprint | Items | Combined Effort | Target Duration |
|--------|-------|-----------------|-----------------|
| Sprint 1 | 1, 10, 8, 6 | S + S + M + M | ~1 week |
| Sprint 2 | 4, 9, 7, 5 | L + M + S + M | ~2 weeks |
| Sprint 3 | 11, 12, 2, 3 | M + L + M + L | ~2 weeks |
| **Total** | **12 items** | | **~5 weeks** |
