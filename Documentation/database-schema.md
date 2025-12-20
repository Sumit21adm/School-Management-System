# 🗄️ Database Schema

The system uses **MySQL (v8.0)** managed via **Prisma ORM**.

## Entity Relationship Diagram (ERD) Overview
The schema is designed around the **Student** entity, linking it to Fees, Exams, and History.

## Core Models

### 1. `StudentDetails` (Student)
The central record for every student.
- **Unique IDs**: `studentId` (Public ID), `aadharCardNo`, `apaarId`.
- **Relations**:
  - Has many `FeeTransaction`.
  - Has many `DemandBill`.
  - Has many `StudentAcademicHistory`.

### 2. `AcademicSession`
Defines the school year (e.g., "2024-2025").
- **Fields**: `startDate`, `endDate`, `isActive`.
- **Logic**: All financial and academic records are scoped to a Session ID.

### 3. Fee Management Tables
- **`FeeStructure`**: Defines fees for a class/session.
- **`FeeTransaction`**: Records actual payments.
- **`DemandBill`**: Monthly bills generated for students.
- **`FeePaymentDetail`**: Detail breakdown of a payment (Tuition vs Transport, etc.).

### 4. `Exam` & `ExamResult`
- **`Exam`**: The event (e.g., "Half Yearly").
- **`ExamSchedule`**: Date sheet.
- **`StudentAcademicHistory`**: Stores final promotional status (Passed/Failed).

## Enums
- **`BillStatus`**: PENDING, PAID, PARTIALLY_PAID, SENT, CANCELLED.
- **`DiscountType`**: FIXED, PERCENTAGE.

*For exact field types and constraints, refer to `prisma/schema.prisma`.*
