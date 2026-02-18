# Bulk Operations User Guide

## Overview

The bulk operations feature allows you to efficiently manage multiple tasks at once, saving time when you need to update, categorize, or delete several tasks simultaneously.

## How to Use Bulk Operations

### Selecting Tasks

#### Method 1: Individual Selection
1. Click the checkbox next to any task
2. The bulk actions toolbar will appear at the top
3. Click additional checkboxes to select more tasks
4. Selected tasks will show a blue ring highlight

#### Method 2: Select All
1. Click the "Select All" checkbox in the toolbar (next to the filters)
2. All visible tasks will be selected instantly
3. The count of selected tasks appears in the bulk actions toolbar

#### Method 3: Range Selection (Shift+Click)
1. Click the checkbox on your first task
2. Hold Shift and click the checkbox on another task
3. All tasks between the two will be selected

### Clearing Selection

- **Click the X button** in the bulk actions toolbar
- **Press the Escape key** on your keyboard
- **Click "Select All"** again to deselect all

### Bulk Actions

Once you have tasks selected, you can:

#### 1. Mark Complete
- Click "Mark Complete" button
- All selected tasks will be marked as DONE
- Completion timestamp is automatically set

#### 2. Set Priority
- Click "Set Priority" dropdown
- Choose from:
  - Urgent (red badge)
  - High (red badge)
  - Medium (gray badge)
  - Low (outline badge)
- All selected tasks get the new priority

#### 3. Set Category
- Click "Set Category" dropdown
- Choose from your existing categories
- Or select "No Category" to remove category assignment
- All selected tasks are assigned the category

#### 4. Delete Tasks
- Click the red "Delete" button
- A confirmation dialog appears
- Shows count: "Delete X tasks?"
- Confirm to permanently delete all selected tasks
- **Warning**: This action cannot be undone!

## Tips and Tricks

### Efficient Workflow
1. **Filter first** - Apply filters to show only the tasks you want to modify
2. **Select All** - Use Select All to quickly select filtered results
3. **Bulk update** - Apply your changes in one operation
4. **Verify** - Check that changes were applied correctly

### Use Cases

**Weekly Planning**:
1. Filter by "To Do" status
2. Select All
3. Set Category to "This Week"

**Project Cleanup**:
1. Search for old project name
2. Select All matching tasks
3. Bulk Delete or change category

**Priority Triage**:
1. Filter by "No Priority" or "Low"
2. Select important tasks (Shift+click for ranges)
3. Set Priority to "High" or "Urgent"

**Completion Sprint**:
1. Filter by category and "In Progress"
2. Select completed work
3. Mark Complete to track progress

### Works in Both Views

Bulk operations work identically in:
- **List View** - Traditional list with all details
- **Kanban View** - Board view organized by status

Your selection persists when switching between views.

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Clear selection | `Escape` |
| Range select | `Shift` + Click |

## Important Notes

### Checkbox Behavior Changes

The checkbox next to each task has **two different behaviors**:

**Normal Mode** (no selection active):
- Clicking checkbox toggles task completion (TODO ↔ DONE)
- Works like a quick complete/uncomplete action

**Selection Mode** (any task selected):
- Clicking checkbox adds/removes from selection
- Doesn't change task status
- Use "Mark Complete" button to change status

### Selection is Temporary

- Selection clears after any bulk operation completes
- Selection clears when you navigate away from the page
- This prevents accidental modifications

### Filters and Selection

- Selection only applies to **visible tasks**
- If you apply filters after selecting, tasks that disappear from view are automatically deselected
- Use this to your advantage: filter → select all → bulk update

## Troubleshooting

**Selection toolbar doesn't appear?**
- Make sure you're clicking the checkbox, not the task title
- Refresh the page if it seems stuck

**Can't find Select All?**
- It's in the toolbar area, next to the Filter and Category buttons
- Only appears when you have tasks to select

**Bulk operation didn't work?**
- Check that you have tasks selected (count shows in toolbar)
- Ensure you have permission (you can only modify your own tasks)
- Try again or refresh the page

**Selection keeps clearing?**
- This is intentional behavior after operations complete
- Press Escape if you want to manually clear selection

## Privacy and Security

- You can **only** select and modify **your own tasks**
- Bulk operations verify ownership on the server
- No risk of modifying other users' data
- All operations are atomic (all succeed or all fail)

## Performance

- Bulk operations are optimized for speed
- Updating 100+ tasks is nearly instant
- Database operations use efficient batch queries
- UI updates automatically after completion

## Future Features

Coming soon:
- Undo/redo for bulk operations
- More keyboard shortcuts
- Bulk export to CSV
- Drag-and-drop for bulk categorization
- Selection history/presets
