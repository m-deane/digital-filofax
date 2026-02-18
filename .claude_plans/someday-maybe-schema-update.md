# Schema Update for Someday/Maybe Feature

## Changes Required in prisma/schema.prisma

### 1. Add to User model (after `preferences UserPreferences?`):
```prisma
  somedayItems SomedayItem[]
```

### 2. Add at end of file (before or after other models):

```prisma
// ============================================================================
// GTD SOMEDAY/MAYBE
// ============================================================================

model SomedayItem {
  id          String          @id @default(cuid())
  title       String
  description String?         @db.Text
  type        SomedayItemType @default(IDEA)
  category    String?
  reviewDate  DateTime?       @db.Date
  userId      String
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([reviewDate])
  @@index([type])
}

enum SomedayItemType {
  TASK
  PROJECT
  IDEA
}
```

### 3. After updating schema, run:
```bash
npm run db:generate
npm run db:push
```

## Alternative: Manual Schema Edit

If automatic tools fail, manually edit `prisma/schema.prisma`:

1. Find line with `preferences  UserPreferences?` in User model
2. Add line `  somedayItems SomedayItem[]` before the closing `}`
3. Scroll to end of file
4. Add the SomedayItem model and enum as shown above
5. Save and run generate/push commands
