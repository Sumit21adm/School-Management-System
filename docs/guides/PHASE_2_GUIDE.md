# Phase 2 Implementation Guide - Timetable Management

## Overview
This guide outlines the implementation steps for Phase 2: Timetable and Scheduling features.

## Prerequisites
- Phase 1 completed (Subject Management) ✅
- Database schema ready ✅
- Backend subjects API operational ✅

## Implementation Steps

### Step 1: Class-Subject Assignment UI

**Goal:** Allow admins to assign subjects to classes with configuration

**Location:** Settings → Class Management → Subjects Tab (new section)

**UI Components:**
```
Class-Subject Assignment
├── Class Selector (dropdown)
├── Available Subjects (list)
├── Assigned Subjects Table
│   ├── Subject Name
│   ├── Weekly Periods (editable)
│   ├── Compulsory/Optional (toggle)
│   ├── Display Order (drag-drop)
│   └── Actions (Remove)
└── Save Button
```

**Backend API Needed:**
```typescript
// GET /classes/:id/subjects
// Returns assigned subjects for a class

// POST /classes/:id/subjects
// Assign subject to class
{
  subjectId: number,
  isCompulsory: boolean,
  weeklyPeriods: number,
  order: number
}

// PATCH /classes/:id/subjects/:subjectId
// Update assignment configuration

// DELETE /classes/:id/subjects/:subjectId
// Remove subject from class
```

**Database:** Uses existing `class_subjects` table ✅

### Step 2: Teacher-Subject Assignment

**Goal:** Assign teachers to subjects they can teach

**Location:** Settings → User Management → Teachers (new tab)

**UI Components:**
```
Teacher-Subject Assignment
├── Teacher Selector (dropdown)
├── Subject Assignment Form
│   ├── Subject (dropdown)
│   ├── Classes (multi-select)
│   ├── Primary Teacher (checkbox)
│   └── Add Button
└── Assigned Subjects Table
    ├── Subject
    ├── Classes
    ├── Primary
    └── Actions (Remove)
```

**Backend API Needed:**
```typescript
// GET /teachers/:id/subjects
// Returns teacher's assigned subjects

// POST /teachers/:id/subjects
{
  subjectId: number,
  classId?: number,  // Optional: specific class
  isPrimary: boolean
}

// DELETE /teachers/:id/subjects/:subjectId
```

**Database:** Needs `teacher_subjects` table

**Schema:**
```prisma
model TeacherSubject {
  id        Int      @id @default(autoincrement())
  teacherId Int
  subjectId Int
  classId   Int?
  isPrimary Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  teacher User        @relation(fields: [teacherId], references: [id])
  subject Subject     @relation(fields: [subjectId], references: [id])
  class   SchoolClass? @relation(fields: [classId], references: [id])

  @@unique([teacherId, subjectId, classId])
  @@map("teacher_subjects")
}
```

### Step 3: Class Timetable Builder

**Goal:** Create period-wise schedules for each class

**Location:** Academic → Timetable → Class Timetable

**UI Components:**
```
Class Timetable Builder
├── Class Selector
├── Weekly Grid View
│   ├── Days (Monday-Saturday)
│   ├── Periods (1-8)
│   └── Cells (Subject + Teacher + Room)
├── Period Configuration
│   ├── Subject (dropdown - from assigned subjects)
│   ├── Teacher (dropdown - from subject teachers)
│   ├── Room (text input)
│   ├── Start Time
│   ├── End Time
│   └── Save Period
└── Actions
    ├── Copy from Previous Week
    ├── Clear All
    └── Save Timetable
```

**Backend API Needed:**
```typescript
// GET /timetables/class/:classId
// Returns complete timetable for class

// POST /timetables/class/:classId/period
{
  dayOfWeek: number,    // 1-7
  periodNumber: number, // 1-8
  subjectId: number,
  teacherId: number,
  room: string,
  startTime: string,    // "09:00"
  endTime: string       // "09:45"
}

// PATCH /timetables/:id
// Update period

// DELETE /timetables/:id
// Delete period
```

**Database:** Needs `class_timetables` table

**Schema:**
```prisma
model ClassTimetable {
  id           Int      @id @default(autoincrement())
  classId      Int
  subjectId    Int
  teacherId    Int
  dayOfWeek    Int      // 1=Monday, 7=Sunday
  periodNumber Int      // 1-8
  startTime    String   @db.VarChar(5)
  endTime      String   @db.VarChar(5)
  room         String?  @db.VarChar(50)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  class   SchoolClass @relation(fields: [classId], references: [id])
  subject Subject     @relation(fields: [subjectId], references: [id])
  teacher User        @relation(fields: [teacherId], references: [id])

  @@unique([classId, dayOfWeek, periodNumber])
  @@map("class_timetables")
}
```

### Step 4: Teacher Routine (Auto-Generated)

**Goal:** Show teacher's weekly schedule automatically

**Location:** Academic → Timetable → Teacher Routine

**UI Components:**
```
Teacher Routine (Read-Only)
├── Teacher Selector
├── Weekly Grid View
│   ├── Days (Monday-Saturday)
│   ├── Periods (1-8)
│   └── Cells (Class + Subject + Room)
├── Summary Stats
│   ├── Total Periods
│   ├── Free Periods
│   └── Classes Taught
└── Export Options
    ├── Print
    └── Download PDF
```

**Backend API Needed:**
```typescript
// GET /timetables/teacher/:teacherId
// Auto-generates routine from class timetables
// Returns teacher's weekly schedule with free periods
```

**Logic:**
- Query all `class_timetables` where `teacherId` matches
- Group by day and period
- Identify free periods (gaps in schedule)
- Check for conflicts (same teacher, same time, different classes)

### Step 5: Conflict Detection

**Goal:** Prevent scheduling conflicts

**Validation Rules:**
1. **Teacher Conflict:** Same teacher can't be in two classes at same time
2. **Room Conflict:** Same room can't be used by two classes at same time
3. **Subject Validation:** Only assigned subjects can be scheduled for a class
4. **Teacher Validation:** Only teachers assigned to subject can teach it

**Implementation:**
```typescript
// In timetable service
async validatePeriod(data: CreatePeriodDto) {
  // Check teacher availability
  const teacherConflict = await this.checkTeacherConflict(
    data.teacherId,
    data.dayOfWeek,
    data.periodNumber
  );
  
  // Check room availability
  const roomConflict = await this.checkRoomConflict(
    data.room,
    data.dayOfWeek,
    data.periodNumber
  );
  
  // Check subject assignment
  const subjectAssigned = await this.checkSubjectAssignment(
    data.classId,
    data.subjectId
  );
  
  // Check teacher-subject assignment
  const teacherQualified = await this.checkTeacherSubject(
    data.teacherId,
    data.subjectId
  );
  
  if (teacherConflict || roomConflict || !subjectAssigned || !teacherQualified) {
    throw new ConflictException('Scheduling conflict detected');
  }
}
```

## Implementation Order

1. **Week 1:** Database schema + migrations
   - Add `teacher_subjects` table
   - Add `class_timetables` table
   - Run migrations
   - Update Prisma client

2. **Week 2:** Backend APIs
   - Class-subject assignment endpoints
   - Teacher-subject assignment endpoints
   - Timetable CRUD endpoints
   - Conflict detection logic

3. **Week 3:** Frontend - Assignments
   - Class-subject assignment UI
   - Teacher-subject assignment UI
   - API integration
   - Testing

4. **Week 4:** Frontend - Timetable
   - Class timetable builder UI
   - Teacher routine viewer
   - Conflict indicators
   - Testing

5. **Week 5:** Polish & Testing
   - UI/UX improvements
   - Performance optimization
   - Bug fixes
   - Documentation

## Testing Checklist

### Class-Subject Assignment
- [ ] Can assign subject to class
- [ ] Can set weekly periods
- [ ] Can mark as compulsory/optional
- [ ] Can reorder subjects
- [ ] Can remove subject
- [ ] Validation works

### Teacher-Subject Assignment
- [ ] Can assign subject to teacher
- [ ] Can specify classes
- [ ] Can mark as primary
- [ ] Can remove assignment
- [ ] Validation works

### Timetable Builder
- [ ] Can create period
- [ ] Can edit period
- [ ] Can delete period
- [ ] Subject dropdown shows only assigned subjects
- [ ] Teacher dropdown shows only qualified teachers
- [ ] Conflict detection works
- [ ] Can copy timetable
- [ ] Can clear timetable

### Teacher Routine
- [ ] Shows correct schedule
- [ ] Identifies free periods
- [ ] Shows all classes
- [ ] Export works

## Success Criteria

- ✅ All subjects assigned to relevant classes
- ✅ All teachers assigned to their subjects
- ✅ Complete timetables for all classes
- ✅ No scheduling conflicts
- ✅ Teacher routines auto-generate correctly
- ✅ UI is intuitive and responsive
- ✅ Data persists correctly

## Next Phase Preview

**Phase 3: Examination Enhancement**
- Auto-populate exam subjects from class assignments
- Subject-wise marks entry
- Report cards with subjects
- Grade calculation

---

**Ready to Start?** Begin with Step 1: Class-Subject Assignment UI
