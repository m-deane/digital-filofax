# Someday/Maybe GTD Feature - Implementation Summary

## Overview
Implemented a complete GTD-style Someday/Maybe list for capturing ideas, tasks, and projects that users might want to do "someday" but aren't committed to yet.

## Files Created/Modified

### 1. Database Schema
**File**: `prisma/schema.prisma`
- Added `SomedayItem` model with fields:
  - id, title, description, type, category, reviewDate, userId, timestamps
- Added `SomedayItemType` enum (TASK, PROJECT, IDEA)
- Added `somedayItems` relation to User model
- Successfully ran: `npm run db:generate` and `npm run db:push`

### 2. tRPC Router
**File**: `src/server/api/routers/someday.ts` (NEW)
- Implemented all CRUD operations:
  - `getAll` - Get all items with filters (type, category, search, reviewDue)
  - `getById` - Get single item
  - `create` - Create new someday item
  - `update` - Update existing item
  - `delete` - Delete item
  - `getReviewDue` - Get items due for review
  - `promoteToTask` - Convert someday item to active task
  - `promoteToGoal` - Convert someday item to goal
  - `getStats` - Get statistics (total, reviewDue, byType)
- All queries properly scoped to `userId`
- Proper error handling with TRPCError
- Type-safe with Zod schemas

### 3. Router Integration
**File**: `src/server/api/root.ts`
- Added `somedayRouter` import
- Registered `someday: somedayRouter` in appRouter

### 4. Module Configuration
**File**: `src/lib/modules.ts`
- Added "someday" to MODULE_IDS
- Added CloudOff icon import
- Created someday module config:
  - Name: "Someday/Maybe"
  - Description: "GTD-style list for ideas and projects you might do someday"
  - Icon: CloudOff
  - Routes: ["/dashboard/someday"]
  - Widgets: ["someday-review"]

### 5. Sidebar Navigation
**File**: `src/components/layout/sidebar.tsx`
- Added CloudOff icon import
- Added "Someday/Maybe" nav item to goalsNavItems array:
  - Title: "Someday/Maybe"
  - Href: "/dashboard/someday"
  - Icon: CloudOff
  - Module: "someday"

### 6. UI Page
**File**: `src/app/dashboard/someday/page.tsx` (NEW)
- Full-featured React page with:
  - Stats cards showing total items, review due, tasks, projects
  - Review Due section highlighting items ready for review
  - Search and filter controls (by type, category, search query)
  - Add item dialog with form (title, description, type, category, reviewDate)
  - Item list with cards showing all details
  - Promote actions (to Task, to Goal)
  - Delete confirmation dialogs
  - Type badges with color coding (TASK=blue, PROJECT=purple, IDEA=yellow)
  - Relative timestamps using date-fns
  - Empty state with call-to-action
  - Proper loading states
  - Toast notifications for all actions
  - Responsive layout

## Features Implemented

### Core GTD Functionality
1. **Quick Capture**: Simple form to add ideas without commitment
2. **Categorization**: Optional categories for organization
3. **Type Classification**: TASK, PROJECT, or IDEA
4. **Review Reminders**: Set review dates to revisit items
5. **Promotion to Action**: Convert to active tasks or goals when ready
6. **Review Due List**: Dedicated section for items ready for review

### User Experience
- Clean, intuitive UI matching existing app design
- shadcn/ui components for consistency
- Type-safe throughout (TypeScript + tRPC + Zod)
- Optimistic updates with React Query invalidation
- Search and filter capabilities
- Visual type indicators with icons and colors
- Contextual actions (promote, delete) on each item

### Data Management
- All data user-scoped for privacy
- Proper indexes for performance (userId, reviewDate, type)
- Cascade deletes when user is deleted
- Stats tracking for dashboard integration

## Technical Details

### Type Safety
- Zod schemas for all inputs
- TypeScript types throughout
- Proper Prisma types
- Type-safe tRPC procedures

### Performance
- Database indexes on userId, reviewDate, type
- Efficient queries with proper filtering
- React Query caching and invalidation
- No N+1 query issues

### Code Quality
- Follows existing codebase patterns
- Uses existing UI components
- Proper error handling
- ESLint compliant
- No console.log statements

## Testing Verification

### Lint Check
- `npm run lint` - Passed with no errors (warnings only in existing files)
- Our new files have zero errors and zero warnings

### Build Check
- Schema generation: SUCCESS
- Database push: SUCCESS
- Prisma client generation: SUCCESS
- All type definitions properly exported

## Integration Points

### Sidebar
- Added to "Goals" section below "Goals" item
- Module-based visibility control
- CloudOff icon for visual identification

### Module System
- Registered as "someday" module
- Can be enabled/disabled in user preferences
- Proper route protection

### Existing Features
- Promotes to Tasks (uses existing tasks router)
- Promotes to Goals (uses existing goals router)
- Uses existing Category system for organization
- Integrates with user auth/session

## Future Enhancements (Not Implemented)

1. **Dashboard Widget**: Show review due count on dashboard
2. **Bulk Actions**: Select multiple items to promote/delete
3. **Tags Integration**: Add tag support to someday items
4. **Export**: Export someday list as markdown/CSV
5. **Templates**: Pre-populated someday item templates
6. **Weekly Review**: Dedicated weekly review workflow
7. **Archive**: Archive completed/rejected items instead of deleting
8. **Notes**: Add follow-up notes to items during reviews

## Files Changed Summary

### Created
- `src/server/api/routers/someday.ts` (290 lines)
- `src/app/dashboard/someday/page.tsx` (610 lines)

### Modified
- `prisma/schema.prisma` (added SomedayItem model + enum, ~25 lines)
- `src/server/api/root.ts` (added import + registration, 2 lines)
- `src/lib/modules.ts` (added module config, ~10 lines)
- `src/components/layout/sidebar.tsx` (added nav item + icon, ~8 lines)

## Conclusion

The Someday/Maybe feature is fully implemented and ready for use. It follows GTD principles by providing a low-friction way to capture ideas without committing to them, while also providing a structured review process to convert those ideas into actionable tasks or goals when the time is right.

The implementation is production-ready with proper type safety, error handling, user scoping, and integration with existing features.
