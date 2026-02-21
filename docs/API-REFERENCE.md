# API Reference

> **Digital Filofax** tRPC API - 213 procedures across 30 routers
>
> All procedures use `protectedProcedure` (require authentication). All queries are user-scoped via `ctx.session.user.id`.

**Client usage**: `api.<router>.<procedure>.useQuery()` / `.useMutation()`

---

## Table of Contents

- [Analytics](#analytics) (7 queries)
- [Calendar](#calendar) (8 queries, 3 mutations)
- [Categories](#categories) (2 queries, 4 mutations)
- [Collaboration](#collaboration) (3 queries, 10 mutations)
- [Contacts](#contacts) (3 queries, 7 mutations)
- [Contexts](#contexts) (4 queries, 3 mutations)
- [Daily](#daily) (1 query, 4 mutations)
- [Export](#export) (9 queries)
- [Finance](#finance) (5 queries, 11 mutations)
- [Focus](#focus) (4 queries, 3 mutations)
- [GitHub](#github) (5 queries, 5 mutations)
- [Goals](#goals) (4 queries, 9 mutations)
- [Habits](#habits) (7 queries, 5 mutations)
- [Ideas](#ideas) (4 queries, 6 mutations)
- [Import](#import) (2 queries, 4 mutations)
- [Journal](#journal) (7 queries, 3 mutations)
- [Memos](#memos) (4 queries, 7 mutations)
- [Preferences](#preferences) (1 query, 5 mutations)
- [Reflections](#reflections) (6 queries, 4 mutations)
- [Review](#review) (6 queries, 3 mutations)
- [Roles](#roles) (4 queries, 8 mutations)
- [Search](#search) (1 query)
- [Someday](#someday) (4 queries, 5 mutations)
- [Suggestions](#suggestions) (2 queries, 4 mutations)
- [Tags](#tags) (4 queries, 4 mutations)
- [Tasks](#tasks) (9 queries, 12 mutations)
- [Templates](#templates) (3 queries, 5 mutations)
- [Vision](#vision) (5 queries, 10 mutations)
- [Yearly](#yearly) (6 queries, 5 mutations)

---

## Analytics

`src/server/api/routers/analytics.ts`

All analytics queries accept an optional date range via `preset` or explicit `startDate`/`endDate`.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getTaskStats` | Query | `startDate?`, `endDate?`, `preset?` (today\|week\|month\|last30\|last90\|custom) | Task completion stats by day, category, priority; completion rate |
| `getHabitStats` | Query | same as above | Habit completion rates, current/longest streaks, daily completion |
| `getProductivityScore` | Query | same as above | Productivity score by day (tasks + habits + focus weighted), average |
| `getTimeDistribution` | Query | same as above | Focus time grouped by category/context with hours |
| `getFocusStats` | Query | same as above | Session count, total/avg minutes, sessions by day |
| `getWeeklyTrends` | Query | `weeks` (1-12, default 4) | Week-by-week tasks/habits/focus comparison |
| `getSummaryStats` | Query | same as above | Total tasks, habit completion rate, current streak, focus hours |

---

## Calendar

`src/server/api/routers/calendar.ts`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getEvents` | Query | `startDate`, `endDate`, `sources?` (INTERNAL\|GOOGLE_CALENDAR\|GITHUB)[] | CalendarEvent[] within date range |
| `getById` | Query | `id` | CalendarEvent (404 if not found) |
| `create` | Mutation | `title`, `description?`, `startDate`, `endDate`, `allDay?`, `location?`, `color?` (#hex), `recurrenceRule?` | Created CalendarEvent (source: INTERNAL) |
| `update` | Mutation | `id`, `title?`, `description?`, `startDate?`, `endDate?`, `allDay?`, `location?`, `color?`, `recurrenceRule?` | Updated CalendarEvent (INTERNAL only) |
| `delete` | Mutation | `id` | `{success: true}` (INTERNAL only) |
| `reschedule` | Mutation | `id`, `startDate`, `endDate` | Rescheduled CalendarEvent (INTERNAL only) |
| `getToday` | Query | none | Today's events |
| `getThisWeek` | Query | `weekStartsOn?` (0-6, default 1) | This week's events |
| `getThisMonth` | Query | none | This month's events |
| `getUpcoming` | Query | `limit` (1-50, default 10) | Upcoming events sorted by date |
| `getCombinedAgenda` | Query | `startDate`, `endDate` | Unified items: events + tasks with due dates, sorted by date |

**Notes**: External source events (GOOGLE_CALENDAR, GITHUB) cannot be edited, deleted, or rescheduled.

---

## Categories

`src/server/api/routers/categories.ts`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | none | Categories with task/habit/idea counts |
| `getById` | Query | `id` | Single Category (404 if not found) |
| `create` | Mutation | `name`, `color?` (#hex), `icon?` | Created Category |
| `update` | Mutation | `id`, `name?`, `color?`, `icon?`, `order?` | Updated Category |
| `delete` | Mutation | `id` | `{success: true}` |
| `reorder` | Mutation | `categories`: `{id, order}[]` (max 100) | `{success: true}` |

---

## Collaboration

`src/server/api/routers/collaboration.ts`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getSharedLists` | Query | none | `{ownedLists, memberLists}` |
| `getSharedListById` | Query | `id` | SharedList with members, tasks, myRole |
| `getMyPendingInvites` | Query | none | Pending invites with list info |
| `createSharedList` | Mutation | `name`, `description?` | SharedList with members/tasks |
| `updateSharedList` | Mutation | `id`, `name?`, `description?` | Updated SharedList |
| `deleteSharedList` | Mutation | `id` | `{success: true}` (owner only) |
| `inviteToList` | Mutation | `listId`, `email`, `role` (OWNER\|EDITOR\|VIEWER) | Invite with token |
| `acceptInvite` | Mutation | `token` | SharedListMember |
| `removeFromList` | Mutation | `listId`, `userId` | `{success: true}` |
| `updateMemberRole` | Mutation | `listId`, `userId`, `role` | Updated member |
| `addTaskToList` | Mutation | `listId`, `taskId` | SharedTask |
| `removeTaskFromList` | Mutation | `listId`, `taskId` | `{success: true}` |
| `leaveList` | Mutation | `listId` | `{success: true}` |

---

## Contacts

`src/server/api/routers/contacts.ts`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | `search?`, `categoryId?`, `isFavorite?` | Contacts sorted by favorite then name |
| `getById` | Query | `id` | Contact with category (404 if not found) |
| `create` | Mutation | `name`, `email?`, `phone?`, `address?`, `company?`, `jobTitle?`, `birthday?`, `notes?`, `isFavorite?`, `categoryId?` | Created Contact |
| `update` | Mutation | `id`, (same fields as create, all optional) | Updated Contact |
| `delete` | Mutation | `id` | `{success: true}` |
| `toggleFavorite` | Mutation | `id` | Contact with isFavorite flipped |
| `getCategories` | Query | none | ContactCategories with contact count |
| `createCategory` | Mutation | `name`, `color?`, `icon?` | Created ContactCategory |
| `updateCategory` | Mutation | `id`, `name?`, `color?`, `icon?` | Updated ContactCategory |
| `deleteCategory` | Mutation | `id` | `{success: true}` |

---

## Contexts

`src/server/api/routers/contexts.ts`

GTD-style contexts for task organization (e.g., @home, @office, @phone).

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | none | Contexts with task count |
| `getById` | Query | `id` | Context with active tasks |
| `getTasksByContext` | Query | `contextId` | Tasks in context |
| `getWithTaskCounts` | Query | none | Contexts with activeTaskCount |
| `create` | Mutation | `name`, `icon?`, `color?` | Created Context |
| `update` | Mutation | `id`, `name?`, `icon?`, `color?` | Updated Context |
| `delete` | Mutation | `id` | `{success: true}` (nullifies task contextIds) |

---

## Daily

`src/server/api/routers/daily.ts`

Daily planner view combining tasks, events, and habits.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getDailyView` | Query | `date` | `{scheduledTasks, unscheduledTasks, priorityTasks, events, habits, recentMemos}` |
| `setDailyPriorities` | Mutation | `taskIds` (max 3) | `{success: true}` |
| `scheduleTask` | Mutation | `taskId`, `scheduledStart`, `scheduledEnd` | Updated task |
| `unscheduleTask` | Mutation | `taskId` | Task with cleared schedule |
| `toggleDailyPriority` | Mutation | `taskId` | Updated task (max 3 priorities enforced) |

---

## Export

`src/server/api/routers/export.ts`

All export procedures are queries that return the user's data.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `exportAll` | Query | none | Full user data export (32 collections) |
| `exportTasks` | Query | none | Tasks with categories, tags, subtasks |
| `exportHabits` | Query | none | Habits with logs |
| `exportMemos` | Query | none | Memos with tags |
| `exportIdeas` | Query | none | Ideas with category and tags |
| `exportContacts` | Query | none | Contacts with category |
| `exportGoals` | Query | none | Goals with milestones and tasks |
| `exportFinance` | Query | none | `{transactions, categories, savingsGoals}` |
| `exportJournal` | Query | none | `{gratitudeEntries, moodEntries, reflections}` |

---

## Finance

`src/server/api/routers/finance.ts`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAllTransactions` | Query | `startDate?`, `endDate?`, `type?` (INCOME\|EXPENSE), `categoryId?` | Transactions with category |
| `createTransaction` | Mutation | `amount`, `type`, `description`, `date`, `categoryId?`, `isRecurring?`, `recurringRule?` | Created Transaction |
| `updateTransaction` | Mutation | `id`, (same fields, all optional) | Updated Transaction |
| `deleteTransaction` | Mutation | `id` | `{success: true}` |
| `getAllCategories` | Query | `type?` | FinanceCategories with transaction count |
| `createCategory` | Mutation | `name`, `type`, `icon?`, `color?`, `budgetLimit?` | Created FinanceCategory |
| `updateCategory` | Mutation | `id`, `name?`, `icon?`, `color?`, `budgetLimit?` | Updated FinanceCategory |
| `deleteCategory` | Mutation | `id` | `{success: true}` |
| `getAllSavingsGoals` | Query | none | SavingsGoals sorted by deadline |
| `createSavingsGoal` | Mutation | `name`, `targetAmount`, `currentAmount?`, `deadline?`, `color?` | Created SavingsGoal |
| `updateSavingsGoal` | Mutation | `id`, `name?`, `targetAmount?`, `currentAmount?`, `deadline?`, `color?` | Updated SavingsGoal |
| `addToSavingsGoal` | Mutation | `id`, `amount` | Goal with updated amount |
| `deleteSavingsGoal` | Mutation | `id` | `{success: true}` |
| `getMonthlyStats` | Query | `year`, `month` (1-12) | `{income, expenses, net, transactionCount}` |
| `getSpendingByCategory` | Query | `startDate?`, `endDate?` | Categories sorted by amount spent |
| `getBudgetStatus` | Query | `year`, `month` | Budget categories with spent/limit/percentage |

---

## Focus

`src/server/api/routers/focus.ts`

Pomodoro-style focus timer sessions.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `startSession` | Mutation | `type` (WORK\|SHORT_BREAK\|LONG_BREAK), `duration` (1-120 min), `taskId?` | Created FocusSession |
| `completeSession` | Mutation | `sessionId` | Session with endTime set |
| `cancelSession` | Mutation | `sessionId` | Deleted session |
| `getTodayStats` | Query | none | `{totalWorkMinutes, totalSessions, sessions}` |
| `getWeeklyStats` | Query | none | `{totalMinutes, totalSessions, byDay}` |
| `getRecentSessions` | Query | `limit` (1-50, default 10) | Recent completed sessions |
| `getSettings` | Query | none | `{workMinutes, shortBreakMinutes, longBreakMinutes, sessionsUntilLong}` |

---

## GitHub

`src/server/api/routers/github.ts`

GitHub repository tracking. **Note**: `getIssues`, `getPullRequests`, and `getStats` return empty data with `integrationRequired: true` (awaiting OAuth integration).

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | `isActive?` | GitHubRepos |
| `getById` | Query | `id` | GitHubRepo (404 if not found) |
| `create` | Mutation | `owner`, `name`, `displayName?` | Created GitHubRepo |
| `update` | Mutation | `id`, `displayName?`, `isActive?`, `integrationType?` | Updated GitHubRepo |
| `delete` | Mutation | `id` | `{success: true}` |
| `toggleActive` | Mutation | `id` | GitHubRepo with isActive flipped |
| `syncRepo` | Mutation | `id` | Repo with updated lastSyncAt |
| `getIssues` | Query | `repoId`, `state` (open\|closed\|all) | `{repository, issues: [], totalCount: 0, integrationRequired: true}` |
| `getPullRequests` | Query | `repoId`, `state` | `{repository, pullRequests: [], totalCount: 0, integrationRequired: true}` |
| `getStats` | Query | `repoId` | `{...zeros, integrationRequired: true}` |

---

## Goals

`src/server/api/routers/goals.ts`

Hierarchical goal management with milestones and task linking.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | `status?`, `type?`, `categoryId?`, `includeChildren?` | Goals with hierarchy |
| `getHierarchy` | Query | `rootType?` | Root goals with nested children |
| `getById` | Query | `id` | Goal with milestones, tasks, children |
| `getStats` | Query | none | `{total, completed, inProgress, notStarted, byType, upcomingMilestones}` |
| `create` | Mutation | `title`, `description?`, `type?`, `targetDate?`, `deadline?`, `color?`, `categoryId?`, `parentGoalId?` | Created Goal |
| `update` | Mutation | `id`, (same fields + `status?`, `progress?`) | Updated Goal |
| `updateProgress` | Mutation | `id`, `progress` (0-100) | Updated Goal |
| `delete` | Mutation | `id` | Deleted Goal |
| `addMilestone` | Mutation | `goalId`, `title`, `date` | Created Milestone |
| `updateMilestone` | Mutation | `id`, `title?`, `date?`, `completed?` | Updated Milestone |
| `deleteMilestone` | Mutation | `id` | Deleted Milestone |
| `linkTask` | Mutation | `taskId`, `goalId` | Task with goalId set |
| `unlinkTask` | Mutation | `taskId` | Task with goalId cleared |

---

## Habits

`src/server/api/routers/habits.ts`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | `includeArchived?`, `habitType?`, `frequency?`, `categoryId?` | Habits with logs (90 days) |
| `getById` | Query | `id` | Habit with full log history |
| `getTodayStatus` | Query | none | Habits with `completedToday` flag |
| `getLogs` | Query | `habitId?`, `startDate`, `endDate` | HabitLogs with habit info |
| `getStreakInfo` | Query | `habitId` | `{currentStreak, longestStreak, completionRate, totalCompletions, lastCompleted}` |
| `getHeatmapData` | Query | `habitId?` | `{date, count, habits}[]` for past year |
| `getStreakStats` | Query | none | All habits with streak info |
| `create` | Mutation | `name`, `description?`, `habitType?`, `frequency?`, `targetValue?`, `unit?`, `icon?`, `color?`, `categoryId?` | Created Habit |
| `update` | Mutation | `id`, (same fields + `isArchived?`) | Updated Habit |
| `delete` | Mutation | `id` | `{success: true}` |
| `logCompletion` | Mutation | `habitId`, `date`, `value?`, `notes?` | Created/updated HabitLog |
| `removeLog` | Mutation | `habitId`, `date` | `{success: true}` |

---

## Ideas

`src/server/api/routers/ideas.ts`

Cursor-based pagination on list queries.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | `status?`, `categoryId?`, `tagIds?`, `search?`, `limit?`, `cursor?` | `{ideas, nextCursor}` |
| `getById` | Query | `id` | Idea (404 if not found) |
| `getByStatus` | Query | none | Ideas grouped by status (kanban view) |
| `getArchived` | Query | `limit` (1-100, default 20) | Archived ideas |
| `create` | Mutation | `title`, `description?`, `status?`, `priority?`, `categoryId?`, `tagIds?` | Created Idea |
| `update` | Mutation | `id`, (same fields) | Updated Idea |
| `delete` | Mutation | `id` | `{success: true}` |
| `updateStatus` | Mutation | `id`, `status` | Updated Idea |
| `updatePriority` | Mutation | `id`, `priority` (0-5) | Updated Idea |
| `quickCapture` | Mutation | `title`, `description?` | Created Idea (NEW status) |

---

## Import

`src/server/api/routers/import.ts`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `importFromCSV` | Mutation | `csvContent`, `filename` | `{success, recordsImported, errors, warnings}` |
| `importFromTodoist` | Mutation | `jsonContent`, `filename` | same |
| `importFromAppleReminders` | Mutation | `jsonContent`, `filename` | same |
| `importFromJSON` | Mutation | `jsonContent`, `filename` | same |
| `getImportHistory` | Query | none | Import logs (last 50) |
| `getImportStats` | Query | none | `{totalImports, totalRecords, bySource, recentImports}` |

---

## Journal

`src/server/api/routers/journal.ts`

Daily gratitude (3 entries) and mood tracking.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getTodayGratitude` | Query | none | Today's gratitude entry or null |
| `getGratitudeByDate` | Query | `date` | Gratitude entry for date |
| `getGratitudeRange` | Query | `startDate`, `endDate` | Gratitude entries in range |
| `createOrUpdateGratitude` | Mutation | `date?`, `entries` (exactly 3 strings) | Gratitude entry |
| `getTodayMood` | Query | none | Today's mood entry or null |
| `getMoodByDate` | Query | `date` | Mood entry for date |
| `getMoodRange` | Query | `startDate`, `endDate` | Mood entries in range |
| `createOrUpdateMood` | Mutation | `date?`, `mood` (GREAT\|GOOD\|OKAY\|LOW\|BAD), `energyLevel` (1-5), `notes?` | Mood entry |
| `getTodayJournal` | Query | none | `{gratitude, mood, date}` |
| `getStats` | Query | `days` (1-365, default 30) | `{gratitudeCount, gratitudeStreak, moodCount, moodDistribution, averageEnergy}` |

---

## Memos

`src/server/api/routers/memos.ts`

Cursor-based pagination. Supports pinning and archiving.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | `includeArchived?`, `memoType?`, `tagIds?`, `search?`, `pinnedOnly?`, `limit?`, `cursor?` | `{memos, nextCursor}` |
| `getById` | Query | `id` | Memo (404 if not found) |
| `getRecent` | Query | `limit` (1-20, default 5) | Recent unarchived memos |
| `search` | Query | `query` (min 1 char) | Matching memos (max 20) |
| `create` | Mutation | `title`, `content`, `memoType?`, `isPinned?`, `tagIds?` | Created Memo |
| `update` | Mutation | `id`, `title?`, `content?`, `memoType?`, `isPinned?`, `isArchived?`, `tagIds?` | Updated Memo |
| `delete` | Mutation | `id` | `{success: true}` |
| `togglePin` | Mutation | `id` | Memo with isPinned flipped |
| `archive` | Mutation | `id` | Memo with isArchived: true |
| `unarchive` | Mutation | `id` | Memo with isArchived: false |
| `quickCapture` | Mutation | `content`, `memoType?` | Created Memo (auto-title from first line) |

---

## Preferences

`src/server/api/routers/preferences.ts`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `get` | Query | none | UserPreferences (creates defaults if none exist) |
| `update` | Mutation | `theme?`, `defaultView?`, `weekStartsOn?`, `dashboardLayout?` | Updated preferences |
| `updateEnabledModules` | Mutation | `enabledModules`: string[] | Updated preferences |
| `toggleModule` | Mutation | `moduleId`, `enabled` | Updated preferences |
| `updateEnabledWidgets` | Mutation | `enabledWidgets`: string[] (max 50) | Updated preferences |
| `updatePomodoroSettings` | Mutation | `pomodoroWorkMinutes?`, `pomodoroShortBreakMinutes?`, `pomodoroLongBreakMinutes?`, `pomodoroSessionsUntilLong?` | Updated preferences |

---

## Reflections

`src/server/api/routers/reflections.ts`

Daily and monthly reflection journals with streak tracking.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getDailyByDate` | Query | `date` | DailyReflection or null |
| `getDailyRange` | Query | `startDate`, `endDate` | DailyReflections in range |
| `createOrUpdateDaily` | Mutation | `date`, `morningIntention?`, `eveningReflection?`, `wins?`, `improvements?`, `tomorrowFocus?`, `energyLevel?` (1-5), `productivityRating?` (1-5) | Upserted DailyReflection |
| `deleteDaily` | Mutation | `date` | `{success: true}` |
| `getMonthlyByMonth` | Query | `monthOf` | MonthlyReflection or null |
| `getAllMonthly` | Query | `limit?` (1-100, default 12) | MonthlyReflections desc |
| `createOrUpdateMonthly` | Mutation | `monthOf`, `highlights?`, `challenges?`, `lessonsLearned?`, `nextMonthGoals?`, `rating?` (1-5) | Upserted MonthlyReflection |
| `deleteMonthly` | Mutation | `monthOf` | `{success: true}` |
| `getReflectionStreaks` | Query | none | `{currentStreak, completionRate, totalReflections, last30Days}` |
| `getRandomPrompts` | Query | `type` (morning\|evening\|gratitude\|growth), `count` (1-5) | string[] of prompts |

---

## Review

`src/server/api/routers/review.ts`

Weekly review workflow (GTD-style).

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getByWeek` | Query | `weekOf` | WeeklyReview or null |
| `getRecent` | Query | `limit` (1-52, default 10) | Recent completed reviews |
| `getStats` | Query | none | `{totalReviews, completedReviews, completionRate, avgRating, ratingsTrend, currentStreak}` |
| `getWeeklySummary` | Query | `weekOf` | `{completedTasks, habitStats, avgHabitCompletion, weekStart, weekEnd}` |
| `getInboxCount` | Query | none | `{count}` of unprocessed tasks |
| `needsReview` | Query | none | `{needsReview, lastReviewDate, lastReviewCompleted}` |
| `create` | Mutation | `weekOf`, `wins?`, `challenges?`, `lessonsLearned?`, `nextWeekFocus?`, `gratitudes?`, `rating`, `notes?`, `isDraft?` | Created WeeklyReview |
| `update` | Mutation | `id`, (same fields) | Updated WeeklyReview |
| `delete` | Mutation | `id` | `{success: true}` |

---

## Roles

`src/server/api/routers/roles.ts`

Life roles with weekly "big rocks" (7 Habits-style).

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAllRoles` | Query | none | LifeRoles with weeklyBigRocks count |
| `getRoleById` | Query | `id` | LifeRole with recent big rocks |
| `getBigRocksForWeek` | Query | `weekOf?` | WeeklyBigRocks with role |
| `getWeeklyCompass` | Query | `weekOf?` | `{roles with big rocks, totalBigRocks, completedBigRocks, completionRate}` |
| `createRole` | Mutation | `name`, `description?`, `icon?`, `color?` | Created LifeRole |
| `updateRole` | Mutation | `id`, `name?`, `description?`, `icon?`, `color?` | Updated LifeRole |
| `deleteRole` | Mutation | `id` | `{success: true}` |
| `reorderRoles` | Mutation | `roles`: `{id, order}[]` (max 50) | `{success: true}` |
| `createBigRock` | Mutation | `title`, `roleId`, `weekOf?`, `linkedTaskId?` | Created WeeklyBigRock |
| `updateBigRock` | Mutation | `id`, `title?`, `completed?`, `linkedTaskId?` | Updated WeeklyBigRock |
| `toggleBigRockComplete` | Mutation | `id` | WeeklyBigRock with completed flipped |
| `deleteBigRock` | Mutation | `id` | `{success: true}` |

---

## Search

`src/server/api/routers/search.ts`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `globalSearch` | Query | `query`, `types?` (task\|memo\|idea\|habit\|event\|contact)[], `limit` (1-50, default 20) | `{results: SearchResult[], totalCount, query}` |

**SearchResult** is a union: TaskSearchResult | MemoSearchResult | IdeaSearchResult | HabitSearchResult | EventSearchResult | ContactSearchResult. Each includes `type`, `id`, `title`, `description`, `matchedField`, and type-specific fields.

---

## Someday

`src/server/api/routers/someday.ts`

GTD "Someday/Maybe" list with periodic review and promotion to tasks/goals.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | `type?`, `category?`, `search?`, `reviewDue?` | SomedayItems |
| `getReviewDue` | Query | none | Items with reviewDate <= today |
| `getById` | Query | `id` | SomedayItem (404 if not found) |
| `getStats` | Query | none | `{total, reviewDue, byType}` |
| `create` | Mutation | `title`, `description?`, `type?`, `category?`, `reviewDate?` | Created SomedayItem |
| `update` | Mutation | `id`, (same fields) | Updated SomedayItem |
| `delete` | Mutation | `id` | `{success: true}` |
| `promoteToTask` | Mutation | `id`, `priority?`, `dueDate?`, `categoryId?` | Created Task (someday item deleted) |
| `promoteToGoal` | Mutation | `id`, `deadline?`, `categoryId?` | Created Goal (someday item deleted) |

---

## Suggestions

`src/server/api/routers/suggestions.ts`

Rule-based task suggestions (priority changes, due dates, breakdowns, rescheduling).

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | `includeAccepted?`, `includeDismissed?`, `type?` | Suggestions with task info |
| `getCount` | Query | none | Count of active suggestions |
| `regenerate` | Mutation | none | `{count, message}` |
| `accept` | Mutation | `id` | `{success: true, message}` |
| `dismiss` | Mutation | `id` | `{success: true, message}` |
| `dismissAll` | Mutation | none | `{success: true, count, message}` |

**Suggestion Types**: TASK_SUGGESTION, PRIORITY_CHANGE, DUE_DATE, CONTEXT, BREAKDOWN, RECURRING, RESCHEDULE, CATEGORY_BALANCE

---

## Tags

`src/server/api/routers/tags.ts`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | none | Tags with usage counts |
| `getById` | Query | `id` | Tag (404 if not found) |
| `search` | Query | `query` (min 1 char) | Matching tags (max 10) |
| `getPopular` | Query | `limit` (1-20, default 10) | Most used tags |
| `create` | Mutation | `name`, `color?` | Created Tag |
| `update` | Mutation | `id`, `name?`, `color?` | Updated Tag |
| `delete` | Mutation | `id` | `{success: true}` |
| `getOrCreate` | Mutation | `name`, `color?` | Existing or created Tag |

---

## Tasks

`src/server/api/routers/tasks.ts`

The largest router (21 procedures). Supports cursor pagination, bulk operations, scheduling, subtasks, and urgency tracking.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | `status?`, `priority?`, `categoryId?`, `contextId?`, `tagIds?`, `search?`, `weekOf?`, `monthOf?`, `limit?`, `cursor?` | `{tasks, nextCursor}` |
| `getById` | Query | `id` | Task with category, context, tags, subtasks |
| `getWeeklyTasks` | Query | `weekOf` | Tasks for week |
| `getMonthlyTasks` | Query | `monthOf` | Tasks for month |
| `getDueSoon` | Query | `days` (1-365, default 7) | Tasks due within N days |
| `getUrgentCount` | Query | none | `{overdue, dueToday, urgent, total}` |
| `getUrgent` | Query | none | Tasks with urgencyLevel (critical\|high\|medium\|low) |
| `getScheduledTasks` | Query | `startDate`, `endDate` | Scheduled tasks in range |
| `create` | Mutation | `title`, `description?`, `status?`, `priority?`, `dueDate?`, `categoryId?`, `contextId?`, `tagIds?`, `weekOf?`, `monthOf?`, `recurrenceRule?` | Created Task |
| `update` | Mutation | `id`, (same fields + `order?`, `completedAt?`) | Updated Task (auto-sets completedAt on DONE) |
| `delete` | Mutation | `id` | `{success: true}` |
| `reorder` | Mutation | `tasks`: `{id, order, status?}[]` (max 200) | `{success: true}` |
| `addSubtask` | Mutation | `taskId`, `title` | Created Subtask |
| `updateSubtask` | Mutation | `id`, `title?`, `completed?`, `order?` | Updated Subtask |
| `deleteSubtask` | Mutation | `id` | `{success: true}` |
| `bulkUpdateStatus` | Mutation | `taskIds[]` (1-200), `status` | `{success: true, count}` |
| `bulkDelete` | Mutation | `taskIds[]` (1-200) | `{success: true, count}` |
| `bulkAssignCategory` | Mutation | `taskIds[]` (1-200), `categoryId?` | `{success: true, count}` |
| `bulkAssignPriority` | Mutation | `taskIds[]` (1-200), `priority` | `{success: true, count}` |
| `moveToDate` | Mutation | `taskId`, `scheduledStart`, `scheduledEnd` | Updated task |
| `updateSchedule` | Mutation | `taskId`, `scheduledStart?`, `scheduledEnd?` | Updated task |

---

## Templates

`src/server/api/routers/templates.ts`

Reusable templates that can create tasks and memos.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAll` | Query | `type?`, `search?`, `includePublic?` | Templates with usage count |
| `getById` | Query | `id` | Template (404 if not found) |
| `getPublicTemplates` | Query | `type?`, `limit` (1-50, default 20) | Public templates |
| `create` | Mutation | `name`, `description?`, `type`, `content`, `isPublic?` | Created Template |
| `update` | Mutation | `id`, `name?`, `description?`, `type?`, `content?`, `isPublic?` | Updated Template |
| `delete` | Mutation | `id` | `{success: true}` |
| `duplicate` | Mutation | `id`, `name?` | Duplicated Template |
| `applyTemplate` | Mutation | `id`, `weekOf?`, `monthOf?` | `{success: true, created: {tasks[], memos[]}}` |

**Template Types**: TASK_LIST, CHECKLIST, PROJECT, DAILY_ROUTINE, WEEKLY_PLAN, MEETING_NOTES

---

## Vision

`src/server/api/routers/vision.ts`

Drag-and-drop vision boards with images, text, goals, and affirmations.

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getBoards` | Query | none | VisionBoards with item count |
| `getBoard` | Query | `id` | VisionBoard with items |
| `getDefaultBoard` | Query | none | Default board or first board |
| `getItems` | Query | `boardId` | VisionItems for board |
| `getRandomInspiration` | Query | none | Random affirmation/text from default board |
| `createBoard` | Mutation | `name`, `year?`, `isDefault?`, `bgColor?`, `bgImage?` | Created VisionBoard |
| `updateBoard` | Mutation | `id`, `name?`, `year?`, `isDefault?`, `bgColor?`, `bgImage?` | Updated VisionBoard |
| `deleteBoard` | Mutation | `id` | Deleted VisionBoard |
| `setDefaultBoard` | Mutation | `id` | Updated VisionBoard |
| `createItem` | Mutation | `boardId`, `type` (IMAGE\|TEXT\|GOAL\|AFFIRMATION), `content`, `position: {x,y}`, `size: {width,height}`, `color?` | Created VisionItem |
| `updateItem` | Mutation | `id`, `type?`, `content?`, `position?`, `size?`, `color?` | Updated VisionItem |
| `updatePosition` | Mutation | `id`, `position: {x,y}` | Updated VisionItem |
| `updateSize` | Mutation | `id`, `size: {width,height}` | Updated VisionItem |
| `deleteItem` | Mutation | `id` | Deleted VisionItem |
| `uploadImage` | Mutation | `boardId`, `base64` (max 5MB), `position`, `size` | Created VisionItem with image |

---

## Yearly

`src/server/api/routers/yearly.ts`

Uses nested sub-routers: `yearly.goals.*` and `yearly.reflection.*`.

### yearly.goals

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getByYear` | Query | `year` | YearlyGoals for year |
| `create` | Mutation | `year`, `title`, `description?`, `category?`, `status?`, `quarter?` | Created YearlyGoal |
| `update` | Mutation | `id`, `title?`, `description?`, `category?`, `status?`, `quarter?` | Updated YearlyGoal |
| `delete` | Mutation | `id` | Deleted YearlyGoal |

### yearly.reflection

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getByYear` | Query | `year` | YearlyReflection or null |
| `create` | Mutation | `year`, `accomplishments?`, `challenges?`, `lessonsLearned?`, `gratitudes?`, `rating?`, `nextYearIntentions?`, `visionStatement?`, `themeWord?` | Created YearlyReflection |
| `update` | Mutation | `year`, (same fields) | Upserted YearlyReflection |

### yearly (top-level)

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `getYearStats` | Query | `year` | `{tasks: {completed, created, completionRate}, habits: {logs, active}, goals, memos, ideas}` |
| `getMonthlyActivity` | Query | `year` | Monthly buckets with `{month, tasks, habitLogs, memos}` |
| `getAvailableYears` | Query | none | Years that have data |
