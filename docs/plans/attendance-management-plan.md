# Attendance Management System - Implementation Plan

## Overview
Complete attendance management module for marking daily student attendance, tracking absences, generating reports, and integrating with student profiles.

---

## ⚠️ Non-Breaking Changes (Critical)

### Database
- All new models are **separate tables** - no modification to existing tables
- Student model gets **optional** relations (nullable)
- Session model gets **optional** relations (nullable)
- No changes to existing Fee, Admission, or Exam tables

### Backend
- New `/attendance/*` endpoints - no changes to existing routes
- All existing APIs remain unchanged
- New permissions are additive - existing roles unaffected

### Frontend
- New pages under `/attendance/*` routes
- Sidebar gets new section - existing menu items unchanged
- Student Profile gets new tab - existing tabs unchanged
- Dashboard gets new widget - existing widgets unchanged

### Testing Checklist Before Deployment
- [ ] Existing student CRUD works
- [ ] Fee Collection works normally
- [ ] Demand Bill generation works normally
- [ ] Existing Dashboard loads correctly
- [ ] All existing reports work
- [ ] Login/Authentication unchanged

---

## Phase 1: Database Schema

### New Models (Add to `schema.prisma`)

```prisma
// ============================================
// ATTENDANCE MANAGEMENT MODELS
// ============================================

model Attendance {
  id              Int       @id @default(autoincrement())
  date            DateTime  @db.Date
  status          String    @db.VarChar(20)          // present, absent, late, half_day, leave
  inTime          String?   @db.VarChar(10)          // "08:30" (for late tracking)
  outTime         String?   @db.VarChar(10)          // "14:30"
  remarks         String?   @db.VarChar(200)
  markedBy        Int?                                // User who marked
  markedAt        DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  student         Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  studentId       Int
  session         Session   @relation(fields: [sessionId], references: [id])
  sessionId       Int

  @@unique([studentId, date, sessionId])             // One record per student per day per session
  @@index([date])
  @@index([sessionId, date])
}

model AttendanceSummary {
  id              Int       @id @default(autoincrement())
  month           Int                                 // 1-12
  year            Int
  totalDays       Int       @default(0)              // Working days in month
  presentDays     Int       @default(0)
  absentDays      Int       @default(0)
  lateDays        Int       @default(0)
  halfDays        Int       @default(0)
  leaveDays       Int       @default(0)
  percentage      Decimal   @db.Decimal(5,2)         // Attendance %
  updatedAt       DateTime  @updatedAt

  // Relations
  student         Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  studentId       Int
  session         Session   @relation(fields: [sessionId], references: [id])
  sessionId       Int

  @@unique([studentId, month, year, sessionId])
}

model Holiday {
  id              Int       @id @default(autoincrement())
  date            DateTime  @db.Date
  name            String    @db.VarChar(100)         // "Diwali", "Republic Day"
  type            String    @db.VarChar(50)          // national, religious, school
  description     String?   @db.VarChar(200)
  createdAt       DateTime  @default(now())

  // Relations
  session         Session   @relation(fields: [sessionId], references: [id])
  sessionId       Int

  @@unique([date, sessionId])
}

model LeaveRequest {
  id              Int       @id @default(autoincrement())
  fromDate        DateTime  @db.Date
  toDate          DateTime  @db.Date
  reason          String    @db.Text
  leaveType       String    @db.VarChar(50)          // sick, casual, family, other
  status          String    @default("pending")      // pending, approved, rejected
  appliedAt       DateTime  @default(now())
  processedBy     Int?                                // User who approved/rejected
  processedAt     DateTime?
  remarks         String?   @db.VarChar(200)

  // Relations
  student         Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  studentId       Int
  session         Session   @relation(fields: [sessionId], references: [id])
  sessionId       Int
}
```

### Modify Existing Student Model
```prisma
model Student {
  // ... existing fields ...
  
  // Add relations
  attendances      Attendance[]
  attendanceSummaries AttendanceSummary[]
  leaveRequests    LeaveRequest[]
}
```

### Modify Existing Session Model
```prisma
model Session {
  // ... existing fields ...
  
  // Add relations
  attendances      Attendance[]
  attendanceSummaries AttendanceSummary[]
  holidays         Holiday[]
  leaveRequests    LeaveRequest[]
}
```

---

## Phase 2: Backend APIs

### New Module: `attendance`

#### File Structure
```
backend/src/attendance/
├── attendance.module.ts
├── attendance.controller.ts
├── attendance.service.ts
├── holiday.controller.ts
├── holiday.service.ts
├── leave.controller.ts
├── leave.service.ts
├── dto/
│   ├── mark-attendance.dto.ts
│   ├── bulk-attendance.dto.ts
│   ├── create-holiday.dto.ts
│   └── leave-request.dto.ts
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Daily Attendance** |||
| GET | `/attendance/daily` | Get attendance for date + class |
| POST | `/attendance/mark` | Mark single student attendance |
| POST | `/attendance/bulk` | Mark attendance for entire class |
| PATCH | `/attendance/:id` | Update attendance record |
| GET | `/attendance/student/:studentId` | Get student's attendance history |
| **Summary & Reports** |||
| GET | `/attendance/summary/student/:studentId` | Student monthly summary |
| GET | `/attendance/summary/class` | Class-wise summary |
| GET | `/attendance/report/monthly` | Monthly attendance report |
| GET | `/attendance/report/defaulters` | Low attendance students |
| POST | `/attendance/summary/recalculate` | Recalculate summaries |
| **Holidays** |||
| GET | `/attendance/holidays` | List holidays for session |
| POST | `/attendance/holidays` | Add holiday |
| PATCH | `/attendance/holidays/:id` | Update holiday |
| DELETE | `/attendance/holidays/:id` | Delete holiday |
| **Leave Management** |||
| GET | `/attendance/leaves` | List leave requests |
| GET | `/attendance/leaves/student/:studentId` | Student's leave requests |
| POST | `/attendance/leaves` | Submit leave request |
| PATCH | `/attendance/leaves/:id/approve` | Approve leave |
| PATCH | `/attendance/leaves/:id/reject` | Reject leave |

---

## Phase 3: Frontend Pages

### New Pages

#### 1. Mark Attendance (`/attendance/mark`)
- Select Class, Section, Date
- List all students with status buttons (Present/Absent/Late/Half Day)
- Quick actions: Mark All Present, Mark All Absent
- Save with remarks option
- Show already marked (if editing)

#### 2. Attendance Calendar (`/attendance/calendar`)
- Calendar view with color-coded days
- Click date to see/edit attendance
- Holiday markers
- Month navigation

#### 3. Student Attendance View (`/attendance/student/:id`)
- Monthly calendar view
- Attendance statistics (pie chart)
- Month-wise summary table
- Download attendance certificate

#### 4. Attendance Reports (`/attendance/reports`)
- **Daily Report**: Class-wise attendance for a date
- **Monthly Report**: Summary with percentages
- **Defaulters**: Students below threshold (e.g., <75%)
- Export to Excel/PDF

#### 5. Holiday Management (`/attendance/holidays`)
- Calendar view with holidays
- Add/Edit/Delete holidays
- Import national holidays

#### 6. Leave Requests (`/attendance/leaves`)
- Pending requests list
- Approve/Reject with remarks
- Filter by status, class, date range

### Sidebar Menu Addition
```
ATTENDANCE
├── Mark Attendance
├── Calendar View
├── Reports
├── Holidays
└── Leave Requests
```

---

## Phase 4: Integrations

### 1. Student Profile Tab
**File**: `frontend/src/pages/admissions/AdmissionList.tsx`

Add new tab "Attendance" showing:
- Current month calendar
- Attendance percentage
- Total Present/Absent counts
- Recent absences

### 2. Dashboard Widget
**File**: `frontend/src/pages/Dashboard.tsx`

Add widget showing:
- Today's overall attendance %
- Class-wise attendance summary
- Absent students count

### 3. SMS/Notification Integration (Future)
- Auto SMS on absence
- Daily attendance notification to parents

### 4. Report Card Integration
Include attendance percentage in report cards/progress reports.

---

## Phase 5: Permissions

### New Permissions
| Permission | Description |
|------------|-------------|
| `attendance_view` | View attendance data |
| `attendance_mark` | Mark daily attendance |
| `attendance_edit` | Edit past attendance |
| `attendance_reports` | View attendance reports |
| `holidays_manage` | Manage holidays |
| `leaves_manage` | Approve/Reject leaves |

---

## Phase 6: Configuration

### Settings (Add to School Settings)
| Setting | Description |
|---------|-------------|
| `attendance_threshold` | Minimum % required (default: 75) |
| `late_after_time` | Time after which marked late |
| `half_day_threshold` | Hours for half day |
| `absent_sms_enabled` | Send SMS on absence |
| `working_days` | Days school is open (Mon-Sat) |

---

## Implementation Order

| Step | Task | Estimated Time |
|------|------|----------------|
| 1 | Database schema + migration | 1 hour |
| 2 | Attendance backend module | 3 hours |
| 3 | Holiday & Leave APIs | 2 hours |
| 4 | Mark Attendance page | 3 hours |
| 5 | Attendance Calendar | 2 hours |
| 6 | Student Attendance View | 2 hours |
| 7 | Attendance Reports | 2 hours |
| 8 | Holiday Management | 1 hour |
| 9 | Leave Requests page | 2 hours |
| 10 | Student Profile integration | 1 hour |
| 11 | Dashboard widget | 1 hour |
| 12 | Permissions & Testing | 1 hour |
| **Total** | | **~21 hours** |

---

## UI Mockup: Mark Attendance

```
┌─────────────────────────────────────────────────────────────┐
│  Mark Attendance                                             │
├─────────────────────────────────────────────────────────────┤
│  Class: [9-A ▼]  Date: [13/01/2026 📅]  [Load Students]     │
├─────────────────────────────────────────────────────────────┤
│  Quick Actions: [✓ All Present] [✗ All Absent]              │
├─────────────────────────────────────────────────────────────┤
│  #  │ Student ID │ Name           │ Status                  │
│─────┼────────────┼────────────────┼─────────────────────────│
│  1  │ ST20240001 │ Rahul Sharma   │ [P] [A] [L] [H]        │
│  2  │ ST20240002 │ Priya Singh    │ [P] [A] [L] [H]        │
│  3  │ ST20240003 │ Amit Kumar     │ [P] [A] [L] [H]        │
│  ... │            │                │                         │
├─────────────────────────────────────────────────────────────┤
│  Summary: 45 Present | 3 Absent | 2 Late | 0 Half Day       │
│                                              [Save Attendance]│
└─────────────────────────────────────────────────────────────┘

P = Present, A = Absent, L = Late, H = Half Day
```

---

*Last Updated: January 13, 2026*
