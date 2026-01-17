# Staff Management & HR System - Implementation Plan

## Overview
A comprehensive **Human Resource (HR)** module to manage all school employees—from the Principal and Teachers to Security Guards and Support Staff. This system unifies staff onboarding, data management, and attendance into a single, cohesive framework while allowing for role-specific details.

**Key Philosophy**:
1.  **Unified Identity**: Every employee is a system `User` (even if they don't log in frequently).
2.  **Common Core**: All staff share basic HR data (Salary, Joining Date, Department).
3.  **Role-Specific Extensions**: "Teachers" have extra academic data; "Drivers" have license data; others might just have basic info.
4.  **Universal Attendance**: A single attendance system for everyone.

---

## 🏗️ Architecture

### Database Schema (Proposed)

#### 1. `StaffDetails` (New)
Common HR details for *every* employee. Linked 1:1 with `User`.

```prisma
model StaffDetails {
  id            Int       @id @default(autoincrement())
  userId        Int       @unique
  
  // HR Info
  designation   String    @db.VarChar(100) // e.g. "Senior Teacher", "Head Guard"
  department    String?   @db.VarChar(50)  // e.g. "Academics", "Security", "Transport"
  joiningDate   DateTime  @db.Date
  bloodGroup    String?   @db.VarChar(5)
  qualification String?   @db.VarChar(200) // Highest Degree
  experience    String?   @db.VarChar(100)
  
  // Financial
  basicSalary   Decimal?  @db.Decimal(10,2)
  bankName      String?   @db.VarChar(100)
  accountNo     String?   @db.VarChar(30)
  ifscCode      String?   @db.VarChar(20)
  panNo         String?   @db.VarChar(15)
  aadharNo      String?   @db.VarChar(16)
  
  user          User      @relation(fields: [userId], references: [id])
  @@map("staff_details")
}
```

#### 2. `TeacherProfile` (Existing - Refined)
Specific academic details. Linked 1:1 with `User` (only for Role=TEACHER/COORDINATOR).
*Migration Note*: `qualification` and `experience` might move to `StaffDetails` if common, or verify redundancy.

#### 3. `StaffAttendance` (New)
Unified daily attendance.

```prisma
model StaffAttendance {
  id          Int      @id @default(autoincrement())
  userId      Int      // Links to User table
  date        DateTime @db.Date
  status      AttendanceStatus // PRESENT, ABSENT, LEAVE, etc.
  checkIn     String?  // Time
  checkOut    String?  // Time
  remarks     String?
  
  user        User     @relation(fields: [userId], references: [id])
  @@unique([userId, date])
  @@map("staff_attendance")
}
```

---

## 🚀 Dynamic Staff Onboarding

**Process**: A single "Add Staff" Wizard that adapts fields based on `Role`.

### 1. Basic Information (All Roles)
-   Name, Email, Phone, Address, Gender, DOB
-   **Role Selection**: (Principal, Teacher, Accountant, Guard, Peon...)

### 2. HR Details (All Roles)
-   Designation, Department, Joining Date, Salary, Bank Info

### 3. Role-Specific Details (Dynamic Step)
-   **If Role = TEACHER**:
    -   Ask for Specialization, Class Teacher Preference.
-   **If Role = DRIVER**:
    -   Ask for License Number, Expiry (Already exists in Driver model? We might need to unify Driver model with User or keep separate. *Recommendation*: Drivers usually exist in Transport module. We can link them or keep separate. For now, focus on Academic/Office staff).
-   **If Role = PRINCIPAL/ADMIN**:
    -   Ask for Admin Privileges.

---

## ✅ Implementation Phases

### Phase 1: Database & Schema
- [x] Create `StaffDetails` model.
- [x] Create `StaffAttendance` model.
- [x] Update `User` model relations.
- [x] (Refactor) Analyze `Driver` model redundancy (Future consideration).

### Phase 2: Staff Management Module (Backend)
- [x] `StaffService` implementation.
- [x] `StaffController` implementation.

### Phase 3: Dynamic Onboarding UI (Frontend)
- [x] **Staff List**: Filters by Role, Department.
- [x] **Add Staff Wizard**:
    -   Step 1: Identity & Role.
    -   Step 2: HR & Banking.
    -   Step 3: Role Specifics (Conditional rendering).

### Phase 4: Staff Attendance System
-   **Daily Log**: Admin view to mark P/A for everyone.
-   **Biometric/Manual Entry**: Simple UI for manual check-in/out logging.
-   **Reports**: "Staff Muster Roll".

### Phase 5: Staff Profile & View
-   **Profile Page**: View personal details, attendance stats, and payslips (future).
-   **My Attendance**: Staff can view their own log.

---

## 🗓️ Timeline Estimate

| Phase | Task | Est. Time |
|-------|------|-----------|
| 1 | Schema Architecture | 2 hrs |
| 2 | Backend Staff Service | 4 hrs |
| 3 | Dynamic Onboarding UI | 6 hrs |
| 4 | Staff Attendance | 3 hrs |
| 5 | Staff Profile & View | 2 hrs |
| | **Total** | **~17 Hours** |
