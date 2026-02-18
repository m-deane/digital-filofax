# Data Import Feature - Quick Start Guide

## What Can You Import?

The Digital Filofax app now supports importing tasks from:
- **CSV files** - Custom spreadsheets or exports
- **Todoist** - Popular task manager
- **Apple Reminders** - iOS/macOS default app
- **JSON backups** - Restore from app's own exports

## How to Import

### Step 1: Navigate to Import Page
Go to **Dashboard → Settings → Import** or visit `/dashboard/settings/import`

### Step 2: Choose Import Source
Select the tab for your data source:
- **CSV** - For spreadsheets
- **Todoist** - For Todoist exports
- **Apple Reminders** - For Apple Reminders
- **JSON Backup** - For app backups

### Step 3: Upload File
Either:
- Click "Upload a file" and select your file
- Drag and drop your file onto the upload area

### Step 4: Import
Click the "Import Now" button to start the import process

## CSV Format

### Required Column
- `title` - Task title (required)

### Optional Columns
- `description` - Task details
- `dueDate` - Due date (multiple formats supported)
- `priority` - LOW, MEDIUM, HIGH, or URGENT
- `status` - TODO, IN_PROGRESS, or DONE
- `category` - Category name (created if doesn't exist)
- `tags` - Comma-separated tags (e.g., "work,urgent")

### Example CSV
```csv
title,description,dueDate,priority,status,category,tags
"Complete project report","Write final report","2026-03-15","HIGH","TODO","Work","project,important"
"Buy groceries","Weekly shopping","2026-02-10","MEDIUM","TODO","Personal","shopping"
"Call dentist","Schedule checkup","","LOW","TODO","Health","appointments"
```

### Download Template
Click "Download Template" on the CSV import tab to get a pre-filled example.

## Supported Date Formats

The import feature automatically detects and parses these formats:
- ISO format: `2026-03-15T10:30:00Z`
- YYYY-MM-DD: `2026-03-15`
- MM/DD/YYYY: `03/15/2026`
- DD-MM-YYYY: `15-03-2026`
- M/D/YY: `3/15/26`

## What Happens During Import

1. **File is parsed** - Data is read and validated
2. **Categories created** - New categories are automatically created
3. **Tags created** - New tags are automatically created
4. **Tasks imported** - Valid tasks are created in your account
5. **Errors logged** - Any issues are recorded for review

## Import Statistics

View your import history:
- Total number of imports
- Total records imported
- Breakdown by source (CSV, Todoist, etc.)
- Recent import activity

## Import History

See detailed logs of all past imports:
- Filename and source
- Date and time
- Number of records imported
- Any errors encountered

## Todoist-Specific Notes

When importing from Todoist:
- Export your Todoist data: Settings → Backups → Export as JSON
- Priority mapping:
  - Todoist P1 (urgent) → URGENT
  - Todoist P2 (high) → HIGH
  - Todoist P3 (medium) → MEDIUM
  - Todoist P4 (low) → LOW
- Labels become tags
- Completed tasks are marked as DONE

## Apple Reminders-Specific Notes

When importing from Apple Reminders:
- Export your reminders to JSON format first
- Priority mapping:
  - 8-9 → URGENT
  - 6-7 → HIGH
  - 3-5 → MEDIUM
  - 0-2 → LOW
- List names become categories
- Completed reminders are marked as DONE

## JSON Backup/Restore

Use this to:
- Restore from previous exports
- Move data between accounts
- Backup and restore specific task sets

The JSON format includes all task fields:
- title, description
- status, priority
- dueDate
- category, tags
- context (GTD)

## Error Handling

If errors occur during import:
- **Partial imports succeed** - Valid tasks are still imported
- **Errors are logged** - Check import history for details
- **Row numbers provided** - Errors show which row failed (CSV)
- **Warnings vs Errors** - Warnings don't stop import (e.g., bad dates)

## Common Issues

### "Title is required"
- Solution: Ensure every row has a title column with a value

### "Could not parse date"
- Solution: Use one of the supported date formats
- The task will still import, just without a due date

### "Invalid priority value"
- Solution: Use LOW, MEDIUM, HIGH, or URGENT (case-sensitive)
- Default is MEDIUM if not specified

## Tips

1. **Start small** - Test with a few tasks first
2. **Use template** - Download the CSV template for correct format
3. **Check history** - Review import logs after completion
4. **Categories auto-create** - Don't worry about creating categories first
5. **Tags auto-create** - New tags are created automatically

## Examples

### Basic CSV (Title Only)
```csv
title
"Buy milk"
"Call John"
"Finish report"
```

### Full CSV (All Fields)
```csv
title,description,dueDate,priority,status,category,tags
"Project kickoff","Initial meeting with team","2026-02-15","HIGH","TODO","Work","meeting,project"
"Review docs","Review Q1 documentation","2026-02-20","MEDIUM","IN_PROGRESS","Work","review,docs"
"Gym session","Leg day workout","2026-02-10","LOW","TODO","Health","fitness,weekly"
```

### Multiple Tags
Use commas to separate tags:
```csv
title,tags
"Write blog post","writing,blog,content,marketing"
```

## Access

Navigate to the import page:
1. Click **Settings** in the sidebar
2. Click **Import Data**
3. Or visit `/dashboard/settings/import`

## Questions?

Check the import history page for logs of what happened during your import, including any errors or warnings.
