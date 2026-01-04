# 🎓 Student Admissions Module

The Admissions module is the entry point for student data. It handles registration, student management, and data imports.

## Key Features

### 1. New Admission Form
**Route:** `/admissions/new`
- **Personal Details**: Name, DOB, Gender, Religion, Category.
- **Parent Info**: Father/Mother Name, Occupation, Income.
- **Contact**: Phone, WhatsApp, Email, Address.
- **Academic**: Previous School info.
- **Documents**: Upload Aadhar, Birth Certificate, Transfer Certificate.

### 2. Validation Rules
The system uses strict validation (Zod + React Hook Form) to ensure data integrity.
- **Phone**: 10 digits required.
- **DOB**: Age validation (3 to 20 years).
- **Student ID**: must be unique.

### 3. Student List & Management
**Route:** `/admissions`
- **Filter**: By Class, Section, Status (Active/Alumni/Archived).
- **Search**: By Name or ID.
- **Actions**: View Details, Edit, Promote, Archive.

### 4. Bulk Operations
- **Excel Import**: Upload multiple students at once using the template.
- **Export**: Download student lists as CSV/Excel.

## Data Structure (`Student` Model)
| Field | Type | Description |
|-------|------|-------------|
| `studentId` | String | Unique identifier (e.g., STU2024001) |
| `name` | String | Full Name |
| `classId` | Int | Linked Class |
| `sectionId` | Int | Linked Section |
| `status` | Enum | ACTIVE, ALUMNI, ARCHIVED |
