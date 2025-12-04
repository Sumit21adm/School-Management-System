# Database Schema Design - Session Management

**Version:** 1.0  
**Date:** 2025-12-04  
**Status:** 📝 Draft

---

## Schema Overview

This document defines all new tables and modifications to existing tables for the Session Management feature.

### New Tables (5)
1. `academic_sessions` - Academic year/session master
2. `fee_types` - Master list of fee types
3. `fee_structures` - Class-wise fee structure per session
4. `fee_structure_items` - Individual fee amounts within structure
5. `student_fee_discounts` - Student-specific fee discounts

### Modified Tables (2)
1. `student_details` - Add sessionId
2. `feetransaction_new` - Add sessionId, remove yearId

---

## New Tables

### 1. academic_sessions

**Purpose:** Master table for academic year sessions

```prisma
model AcademicSession {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(30)  // "APR 2024-MAR 2025"
  startDate   DateTime @db.Date                  // April 1st
  endDate     DateTime @db.Date                  // March 31st
  isActive    Boolean  @default(false)           // Only one can be true
  isSetupMode Boolean  @default(false)           // In setup vs active
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  students         StudentDetails[]
  feeStructures    FeeStructure[]
  feeTransactions  FeeTransaction[]
  discounts        StudentFeeDiscount[]
  
  @@map("academic_sessions")
}
```

**Indexes:**
- Primary: `id`
- Unique: `name`
- Index: `isActive` (for quick lookup)
- Index: `startDate, endDate` (for date range queries)

**Sample Data:**
```sql
INSERT INTO academic_sessions (name, startDate, endDate, isActive, isSetupMode)
VALUES 
  ('APR 2024-MAR 2025', '2024-04-01', '2025-03-31', true, false),
  ('APR 2025-MAR 2026', '2025-04-01', '2026-03-31', false, true);
```

---

### 2. fee_types

**Purpose:** Master list of all fee types (customizable)

```prisma
model FeeType {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(50)
  description String?  @db.VarChar(200)
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)  // System defaults vs custom
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  structureItems FeeStructureItem[]
  discounts      StudentFeeDiscount[]
  
  @@map("fee_types")
}
```

**Indexes:**
- Primary: `id`
- Unique: `name`
- Index: `isActive` (hide inactive)

**Default Seed Data:**
```sql
INSERT INTO fee_types (name, isActive, isDefault)
VALUES 
  ('Tuition Fee', true, true),
  ('Computer Fee', true, true),
  ('Activity Fee', true, true),
  ('Exam Fee', true, true),
  ('Library Fee', true, true),
  ('Sports Fee', true, true),
  ('Miscellaneous Fee', true, true);
```

---

### 3. fee_structures

**Purpose:** Class-wise fee structure container per session

```prisma
model FeeStructure {
  id          Int      @id @default(autoincrement())
  sessionId   Int
  className   String   @db.VarChar(20)  // "1", "2", ... "12"
  description String?  @db.VarChar(200)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  session     AcademicSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  feeItems    FeeStructureItem[]
  
  @@unique([sessionId, className])
  @@index([sessionId])
  @@map("fee_structures")
}
```

**Constraints:**
- One fee structure per class per session
- Cascade delete when session is deleted

---

### 4. fee_structure_items

**Purpose:** Individual fee type amounts within a structure

```prisma
model FeeStructureItem {
  id            Int      @id @default(autoincrement())
  structureId   Int
  feeTypeId     Int
  amount        Decimal  @db.Decimal(10, 2)
  isOptional    Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  structure     FeeStructure @relation(fields: [structureId], references: [id], onDelete: Cascade)
  feeType       FeeType      @relation(fields: [feeTypeId], references: [id])
  
  @@unique([structureId, feeTypeId])
  @@index([structureId])
  @@index([feeTypeId])
  @@map("fee_structure_items")
}
```

**Business Logic:**
- Each fee structure can have multiple items
- Each item references a fee type
- Amount is in rupees (Decimal)

**Example:**
```
Structure: APR 2024-MAR 2025, Class 1
  - Tuition Fee: ₹25,000
  - Computer Fee: ₹5,000
  - Activity Fee: ₹3,000
  ...
```

---

### 5. student_fee_discounts

**Purpose:** Student-specific fee discounts per session

```prisma
model StudentFeeDiscount {
  id            Int      @id @default(autoincrement())
  studentId     String   @db.VarChar(20)
  feeTypeId     Int
  sessionId     Int
  discountType  String   @db.VarChar(20)  // "PERCENTAGE" | "FIXED"
  discountValue Decimal  @db.Decimal(10, 2)
  reason        String?  @db.VarChar(200)
  approvedBy    String?  @db.VarChar(100)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  student       StudentDetails  @relation(fields: [studentId], references: [studentId], onDelete: Cascade)
  feeType       FeeType         @relation(fields: [feeTypeId], references: [id])
  session       AcademicSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@unique([studentId, feeTypeId, sessionId])
  @@index([studentId])
  @@index([sessionId])
  @@map("student_fee_discounts")
}
```

**Discount Types:**
- `PERCENTAGE`: e.g., 10 (means 10%)
- `FIXED`: e.g., 500 (means ₹500 off)

**Constraints:**
- One discount per student per fee type per session
- Cascade delete when student or session deleted

---

## Modified Tables

### 1. student_details (Modified)

**Changes:**
```diff
model StudentDetails {
  // ... existing fields ...
  
+ sessionId         Int
+ session           AcademicSession @relation(fields: [sessionId], references: [id])
+ feeDiscounts      StudentFeeDiscount[]
  
  @@map("student_details")
}
```

**Migration Steps:**
1. Add `sessionId Int?` (nullable)
2. Set all existing to default session
3. Make `sessionId Int` (required)
4. Add foreign key constraint

---

### 2. feetransaction_new (Modified)

**Changes:**
```diff
model FeeTransaction {
  // ... existing fields ...
  
- yearId      Int  // REMOVE
+ sessionId   Int  // ADD
+ session     AcademicSession @relation(fields: [sessionId], references: [id])
  
  @@map("feetransaction_new")
}
```

**Migration Steps:**
1. Add `sessionId Int?` (nullable)
2. Map yearId to sessionId based on date
3. Make `sessionId Int` (required)
4. Drop `yearId` column

---

## Relationships Diagram

```
academic_sessions (1) ─── (N) student_details
                   (1) ─── (N) fee_structures
                   (1) ─── (N) fee_transactions
                   (1) ─── (N) student_fee_discounts

fee_structures (1) ─── (N) fee_structure_items
               
fee_types (1) ─── (N) fee_structure_items
          (1) ─── (N) student_fee_discounts

student_details (1) ─── (N) student_fee_discounts
```

---

## Indexes Strategy

### Critical Indexes
```sql
-- Session lookups
CREATE INDEX idx_sessions_active ON academic_sessions(isActive);
CREATE INDEX idx_sessions_dates ON academic_sessions(startDate, endDate);

-- Fee structure lookups
CREATE INDEX idx_fee_structure_session ON fee_structures(sessionId);
CREATE INDEX idx_fee_items_structure ON fee_structure_items(structureId);

-- Student data filtering
CREATE INDEX idx_students_session ON student_details(sessionId);
CREATE INDEX idx_transactions_session ON feetransaction_new(sessionId);

-- Discount queries
CREATE INDEX idx_discounts_student ON student_fee_discounts(studentId);
CREATE INDEX idx_discounts_session ON student_fee_discounts(sessionId);
```

---

## Data Integrity Constraints

### Check Constraints
```sql
-- Session dates
ALTER TABLE academic_sessions 
  ADD CONSTRAINT chk_session_dates 
  CHECK (endDate > startDate);

-- Only one active session
CREATE UNIQUE INDEX idx_one_active_session 
  ON academic_sessions(isActive) 
  WHERE isActive = true;

-- Discount value must be positive
ALTER TABLE student_fee_discounts 
  ADD CONSTRAINT chk_discount_value 
  CHECK (discountValue >= 0);

-- Discount type enum
ALTER TABLE student_fee_discounts 
  ADD CONSTRAINT chk_discount_type 
  CHECK (discountType IN ('PERCENTAGE', 'FIXED'));
```

---

## Migration Files

### Migration Sequence

1. **`migrations/001_create_fee_types.sql`**
   - Create fee_types table
   - Seed default types

2. **`migrations/002_create_academic_sessions.sql`**
   - Create academic_sessions table
   - Create default session

3. **`migrations/003_create_fee_structures.sql`**
   - Create fee_structures table
   - Create fee_structure_items table

4. **`migrations/004_create_student_discounts.sql`**
   - Create student_fee_discounts table

5. **`migrations/005_modify_student_details.sql`**
   - Add sessionId to student_details (nullable)
   - Populate with default session
   - Make required

6. **`migrations/006_modify_fee_transactions.sql`**
   - Add sessionId to feetransaction_new
   - Map from yearId
   - Drop yearId

---

## Sample Queries

### Get Session Fee Structure
```sql
SELECT 
  fs.className,
  ft.name as feeType,
  fsi.amount
FROM fee_structures fs
JOIN fee_structure_items fsi ON fs.id = fsi.structureId
JOIN fee_types ft ON fsi.feeTypeId = ft.id
WHERE fs.sessionId = ? AND fs.className = ?
ORDER BY ft.name;
```

### Calculate Student Total Fee (with discounts)
```sql
SELECT 
  ft.name,
  fsi.amount as originalAmount,
  COALESCE(sfd.discountType, 'NONE') as discountType,
  COALESCE(sfd.discountValue, 0) as discountValue,
  CASE 
    WHEN sfd.discountType = 'PERCENTAGE' THEN 
      fsi.amount - (fsi.amount * sfd.discountValue / 100)
    WHEN sfd.discountType = 'FIXED' THEN 
      fsi.amount - sfd.discountValue
    ELSE fsi.amount
  END as finalAmount
FROM fee_structure_items fsi
JOIN fee_structures fs ON fsi.structureId = fs.id
JOIN fee_types ft ON fsi.feeTypeId = ft.id
LEFT JOIN student_fee_discounts sfd 
  ON sfd.feeTypeId = ft.id 
  AND sfd.sessionId = fs.sessionId
  AND sfd.studentId = ?
WHERE fs.sessionId = ? AND fs.className = ?;
```

---

## Backup & Recovery

### Before Migration
```bash
# Backup current database
mysqldump -u root -p school_management > backup_pre_session_migration.sql
```

### Rollback Plan
```sql
-- Drop new tables (in reverse order)
DROP TABLE student_fee_discounts;
DROP TABLE fee_structure_items;
DROP TABLE fee_structures;
DROP TABLE academic_sessions;
DROP TABLE fee_types;

-- Restore old columns
ALTER TABLE student_details DROP COLUMN sessionId;
ALTER TABLE feetransaction_new ADD COLUMN yearId INT;
```

---

**Next Steps:**
1. Review and approve schema design
2. Create Prisma migration files
3. Test migration on development database
4. Proceed with API implementation
