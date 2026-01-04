# 📝 Examination Module

Manages the entire examination lifecycle from scheduling to result declaration.

## Features

### 1. Exam Configuration
Define the structure of assessments or terms.
- **Exam Types**: Unit Test, Half Yearly, Annual.
- **Grading System**: Define grade ranges (A1: 91-100, A2: 81-90, etc.).

### 2. Scheduling
Create date sheets for exams.
- Select Class & Exam Name.
- Add Subjects, Exam Date, Time, and Max Marks.

### 3. Marks Entry
**Route:** `/exams/marks`
- Grid-based input for fast data entry.
- Enter marks for all students in a class for a specific subject.
- Auto-validation against Max Marks.
- Absent/Leave tracking.

### 4. Result/Report Card
- Auto-calculate Total, Percentage, and Grade.
- **Print Report Card**: Generates a professional report card PDF.

## Workflow
1. **Create Exam**: Admin defines "Annual Exam 2024".
2. **Schedule**: Admin adds subjects and dates for Class 10.
3. **Conduct**: Exams are held offline.
4. **Marks Entry**: Teachers enter marks for their subjects.
5. **Publish**: Admin locks the result.
6. **Print**: Report cards are generated.
