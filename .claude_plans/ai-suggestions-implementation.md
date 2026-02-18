# AI Suggestions Implementation

## Overview
Implemented AI-powered task suggestions using pattern matching and heuristics (no external AI API).

## Completed Components

### 1. Database Schema (prisma/schema.prisma)
- Added `AISuggestion` model with fields:
  - `id`, `type`, `content`, `reasoning`
  - `accepted`, `dismissed`, `metadata`
  - `taskId`, `userId`, `createdAt`, `updatedAt`
- Added `SuggestionType` enum with 8 types:
  - TASK_SUGGESTION
  - PRIORITY_CHANGE
  - DUE_DATE
  - CONTEXT
  - BREAKDOWN
  - RECURRING
  - RESCHEDULE
  - CATEGORY_BALANCE
- Added relations to User and Task models

### 2. AI Service (src/lib/ai-suggestions.ts)
Rule-based suggestion engine with the following strategies:

#### Overdue Task Analysis
- Detects tasks overdue by 7+ days → suggests breakdown or rescheduling
- Detects tasks overdue by 1-6 days → suggests rescheduling

#### Priority Suggestions
- Tasks due within 3 days with LOW/MEDIUM priority → suggest increase to HIGH/URGENT
- Tasks with HIGH/URGENT priority but no due date → suggest adding due date

#### Due Date Suggestions
- Assigns suggested due dates based on priority:
  - URGENT: 1 day
  - HIGH: 3 days
  - MEDIUM: 7 days
  - LOW: 14 days

#### Task Breakdown
- Large tasks (>60 char title or >150 char description) with no subtasks
- Generates 3-4 suggested subtasks based on task keywords

#### Recurring Pattern Detection
- Analyzes completed tasks with similar titles (≥3 occurrences)
- Calculates average interval between completions
- Suggests making recurring if interval is 1-90 days

#### Context Suggestions
- Keyword-based matching for common contexts:
  - @home, @work, @computer, @phone, @errands, @gym
- Matches task titles/descriptions against keyword lists

#### Category Balance
- Detects overloaded categories (>2x average)
- Suggests redistributing tasks
- Flags uncategorized tasks (>5)

### 3. tRPC Router (src/server/api/routers/suggestions.ts)
Endpoints:
- `getAll` - Get active suggestions (with filters)
- `getCount` - Get count for badge display
- `regenerate` - Generate new suggestions from current data
- `accept` - Accept and apply a suggestion
- `dismiss` - Dismiss a single suggestion
- `dismissAll` - Dismiss all suggestions

Auto-application logic for:
- Priority changes
- Due date updates
- Context assignments
- Subtask creation
- Recurrence rule updates

### 4. UI Components

#### SuggestionCard (src/components/dashboard/suggestion-card.tsx)
- Visual card for displaying single suggestion
- Color-coded by type with icons
- Accept/Dismiss buttons
- Shows reasoning and related task

#### SuggestionsPanel (src/components/dashboard/suggestions-panel.tsx)
- Full panel for managing all suggestions
- Filter by suggestion type
- Refresh button to regenerate
- Dismiss all functionality
- Real-time updates via tRPC

#### SmartTipsWidget (src/components/dashboard/smart-tips-widget.tsx)
- Dashboard widget showing top 3 suggestions
- Quick accept/dismiss actions
- Link to full suggestions page
- Auto-refreshes every minute

### 5. Page (src/app/dashboard/suggestions/page.tsx)
- Dedicated page for AI suggestions at `/dashboard/suggestions`
- Full-screen view of SuggestionsPanel

### 6. Integration

#### Sidebar Updates (src/components/layout/sidebar.tsx)
- Added AI Suggestions link in Insights section
- Badge showing active suggestion count
- Auto-refreshes count every minute

#### Types (src/types/index.ts)
- Exported AISuggestion and SuggestionType from Prisma

#### Root Router (src/server/api/root.ts)
- Registered suggestions router

## Features

### Intelligent Suggestions
- Analyzes up to 200 recent tasks
- Considers habits, goals, categories, and contexts
- Ranks suggestions by importance
- Limits to top 15 suggestions

### User Experience
- Non-intrusive suggestions
- One-click accept/dismiss
- Bulk dismiss option
- Filter by suggestion type
- Visual indicators and badges

### Performance
- Efficient queries with proper indexes
- Cached with React Query
- Background refresh (60s interval)
- User-scoped data isolation

## Usage Flow

1. **Generate Suggestions**
   - Navigate to /dashboard/suggestions
   - Click "Refresh" to analyze current data
   - System generates suggestions based on patterns

2. **Review Suggestions**
   - See top 3 in Smart Tips widget on dashboard
   - View all in dedicated suggestions page
   - Filter by type if needed

3. **Take Action**
   - Click ✓ to accept and apply suggestion
   - Click ✗ to dismiss suggestion
   - System automatically updates related tasks

4. **Monitor Progress**
   - Badge on sidebar shows active suggestion count
   - Suggestions auto-refresh periodically
   - Accepted/dismissed suggestions are hidden

## Technical Notes

### No External Dependencies
- Pure TypeScript/JavaScript logic
- No AI API calls (OpenAI, Claude, etc.)
- Fast and predictable
- No API costs

### Extensibility
- Easy to add new suggestion types
- Modular service architecture
- Can add ML-based suggestions later
- Metadata field supports custom data

### Data Privacy
- All processing happens server-side
- User data never leaves the system
- User-scoped queries via Prisma

## Testing Recommendations

1. Create tasks with various states:
   - Overdue tasks
   - Tasks without due dates
   - Large tasks without subtasks
   - Repeated similar tasks
   - Tasks without contexts

2. Generate suggestions and verify:
   - Overdue tasks get reschedule suggestions
   - Large tasks get breakdown suggestions
   - Similar tasks get recurring suggestions
   - Tasks get context suggestions based on keywords

3. Test acceptance flow:
   - Accept priority change → verify task priority updated
   - Accept due date → verify task due date set
   - Accept breakdown → verify subtasks created
   - Accept context → verify context assigned

4. Test UI:
   - Badge count updates correctly
   - Suggestions refresh on regenerate
   - Filter works properly
   - Dismiss removes from list

## Future Enhancements

- Add more suggestion types (tags, collaboration, templates)
- ML-based learning from user acceptance patterns
- Suggest tasks based on calendar events
- Habit-based task suggestions
- Time-of-day optimization suggestions
- Workload balancing suggestions
