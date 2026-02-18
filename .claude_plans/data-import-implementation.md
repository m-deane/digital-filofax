# Data Import Feature Implementation

## Overview
Implemented a comprehensive data import system for the Digital Filofax app that supports importing tasks from multiple sources: CSV files, Todoist exports, Apple Reminders exports, and JSON backups.

## Implementation Summary

### 1. Database Schema (prisma/schema.prisma)
Added `ImportLog` model to track import history:
- `id`: Unique identifier
- `source`: Import source (CSV, TODOIST, APPLE_REMINDERS, JSON)
- `filename`: Name of imported file
- `recordsImported`: Number of successfully imported records
- `errors`: Array of error messages
- `userId`: User who performed the import
- `createdAt`: Timestamp of import

Added `ImportSource` enum with values: CSV, TODOIST, APPLE_REMINDERS, JSON

### 2. Import Utilities (src/lib/import.ts)
Created comprehensive parsing and validation utilities:

#### Parsing Functions:
- `parseCSV(csvContent: string)`: Parses CSV files with automatic date format detection
- `parseTodoistJSON(jsonContent: string)`: Parses Todoist export format with priority mapping
- `parseAppleReminders(jsonContent: string)`: Parses Apple Reminders export format
- `parseInternalJSON(jsonContent: string)`: Parses internal JSON backup format

#### Validation & Utilities:
- `validateImportData()`: Validates parsed data before import
- `parseDate()`: Handles multiple date formats (ISO, YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY)
- `generateCSVTemplate()`: Creates example CSV template for download

#### CSV Format Support:
- **Required columns**: title
- **Optional columns**: description, dueDate, priority, status, category, tags
- Handles quoted values and comma-separated tags
- Supports multiple date formats

#### Priority Mapping:
- **Todoist** (1-4 scale): 4=URGENT, 3=HIGH, 2=MEDIUM, 1=LOW
- **Apple Reminders** (0-9 scale): 8+=URGENT, 6+=HIGH, 3+=MEDIUM, <3=LOW

### 3. tRPC Router (src/server/api/routers/import.ts)
Created import router with the following procedures:

#### Mutations:
- `importFromCSV`: Imports tasks from CSV file
- `importFromTodoist`: Imports tasks from Todoist JSON export
- `importFromAppleReminders`: Imports tasks from Apple Reminders JSON
- `importFromJSON`: Imports tasks from internal JSON backup

#### Queries:
- `getImportHistory`: Retrieves last 50 import logs
- `getImportStats`: Returns import statistics (total imports, records by source)

#### Features:
- Automatic category creation (if doesn't exist)
- Automatic tag creation (if doesn't exist)
- User-scoped data isolation
- Comprehensive error logging
- Transaction-safe imports (continues on individual failures)

### 4. UI Implementation (src/app/dashboard/settings/import/page.tsx)
Created full-featured import interface:

#### Features:
- **Tabbed interface** for different import sources
- **Drag-and-drop file upload** with visual feedback
- **Import statistics dashboard** showing:
  - Total imports
  - Total records imported
  - Records by source (CSV, JSON, etc.)
- **Preview & validation** before import
- **Real-time import progress** with success/error/warning messages
- **Import history** with detailed logs
- **CSV template download** with examples

#### User Experience:
- Clear instructions for each import source
- File type validation (.csv or .json)
- Detailed error messages with row numbers
- Warning messages for non-critical issues
- Success confirmation with record count

### 5. Additional Components
Created missing UI component:
- `src/components/ui/alert.tsx`: Alert component with variant support

## File Structure
```
src/
├── lib/
│   └── import.ts                              # Import utilities (500+ lines)
├── server/api/routers/
│   └── import.ts                              # tRPC import router (300+ lines)
├── app/dashboard/settings/import/
│   └── page.tsx                               # Import UI (450+ lines)
├── components/ui/
│   └── alert.tsx                              # Alert component
└── types/
    └── index.ts                               # Updated with ImportLog types

prisma/
└── schema.prisma                              # Added ImportLog model

tests/
└── test-import.ts                             # Import utility tests
```

## Testing Results
All import utilities tested and working correctly:
- ✅ CSV parsing with multiple date formats
- ✅ Todoist JSON parsing with priority mapping
- ✅ Apple Reminders JSON parsing
- ✅ Internal JSON backup/restore
- ✅ CSV template generation
- ✅ Date format detection (ISO, YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY)

## Usage

### CSV Import
1. Download CSV template from import page
2. Fill in task data (title required, other fields optional)
3. Upload CSV file
4. Review preview and click "Import Now"

### Todoist Import
1. Export data from Todoist (Settings → Backups → Export as JSON)
2. Upload JSON file to import page
3. Priority levels automatically converted
4. Labels become tags

### Apple Reminders Import
1. Export reminders to JSON format
2. Upload to import page
3. Priority levels automatically mapped
4. List names become categories

### JSON Backup Import
1. Use internal JSON export from export page
2. Upload to import page for restore
3. Preserves all fields including contexts

## Error Handling
- Parse errors logged with row/task numbers
- Invalid data skipped with detailed error messages
- Partial imports allowed (successful records imported even if some fail)
- All errors saved to ImportLog for review

## Performance Considerations
- Batch creation of categories and tags (with caching)
- Individual task creation (continues on failure)
- Transaction-safe operations
- No blocking on large imports

## Future Enhancements (Not Implemented)
- [ ] Google Tasks import
- [ ] Microsoft To Do import
- [ ] Field mapping UI for custom CSV columns
- [ ] Duplicate detection
- [ ] Import preview with edit capability
- [ ] Scheduled/automated imports
- [ ] Import templates for common formats

## API Endpoints
All endpoints under `api.import.*`:
- `importFromCSV(csvContent, filename)`
- `importFromTodoist(jsonContent, filename)`
- `importFromAppleReminders(jsonContent, filename)`
- `importFromJSON(jsonContent, filename)`
- `getImportHistory()`
- `getImportStats()`

## Access
Navigate to: `/dashboard/settings/import`
Or click "Import" from settings page navigation.
