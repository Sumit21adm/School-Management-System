# Sprint 5 - Exams, Marks & Promotions

This document describes the implementation of Sprint 5 features for the School Management System.

## Features Implemented

### 1. Exam Management
- Create, read, update, and delete exams
- Associate exams with academic years
- Set exam schedules (start date, end date, publish date)
- Organize exams by terms (mid-term, final, etc.)

**API Endpoints:**
- `POST /api/v1/exams` - Create a new exam
- `GET /api/v1/exams` - List all exams (optionally filter by academic year)
- `GET /api/v1/exams/:id` - Get exam details
- `PUT /api/v1/exams/:id` - Update exam
- `DELETE /api/v1/exams/:id` - Delete exam

### 2. Exam Papers
- Add subject papers to exams
- Configure maximum marks and weightage for each paper
- Set paper dates and duration

**API Endpoints:**
- `POST /api/v1/exams/papers` - Create exam paper
- `GET /api/v1/exams/:examId/papers` - List papers for an exam
- `DELETE /api/v1/exams/papers/:id` - Delete exam paper

### 3. Marks Entry
- Single mark entry for individual students
- Bulk marks entry for efficient grading
- Automatic grade calculation
- Support for remarks on student performance

**API Endpoints:**
- `POST /api/v1/exams/marks` - Create/update single mark entry
- `POST /api/v1/exams/marks/bulk` - Bulk marks entry
- `GET /api/v1/exams/papers/:examPaperId/marks` - Get marks for a paper
- `GET /api/v1/exams/students/:studentId/marks` - Get student's marks (optionally filter by exam)

### 4. Grade Scales
- Configurable grade scales for different grading systems
- Default A-F grade scale included
- Automatic grade computation based on percentage

**API Endpoints:**
- `POST /api/v1/grades/scales` - Create grade scale
- `GET /api/v1/grades/scales` - List all grade scales
- `GET /api/v1/grades/scales/:id` - Get grade scale details

### 5. Report Cards
- PDF report card generation
- QR code for verification
- Student information and marks display
- Automatic calculation of totals and percentages

**API Endpoints:**
- `GET /api/v1/report-cards/exam/:examId/student/:studentId` - Generate and download report card PDF
- `GET /api/v1/report-cards/student/:studentId` - List available report cards for a student

### 6. Student Promotions
- Rule-based student promotion to next class
- Preview eligible students before promotion
- Performance-based promotion with minimum percentage criteria
- Automatic section assignment in target class

**API Endpoints:**
- `POST /api/v1/promotions/preview` - Preview eligible students for promotion
- `POST /api/v1/promotions/execute` - Execute student promotion

## Frontend Pages

### Exams Page (`/exams`)
- List all exams with academic year information
- View number of papers per exam
- Quick access to manage exam papers
- Create new exam button

### Marks Entry Page (`/exams/papers/:examPaperId/marks`)
- Table view of all students
- Input fields for marks, grade, and remarks
- Bulk save functionality
- Validation against maximum marks

### Promotions Page (`/promotions`)
- Select source and target classes
- Optional exam-based promotion with minimum percentage
- Preview eligible students
- Execute bulk promotion with confirmation

## Database Schema

The implementation uses existing Prisma models:
- `Exam` - Stores exam information
- `ExamPaper` - Links exams with subjects
- `Mark` - Stores student marks for each paper
- `Student` - Student information with section assignment

## Usage Examples

### Creating an Exam

```typescript
POST /api/v1/exams
{
  "academicYearId": "year-id",
  "name": "Mid-Term Exam 2024",
  "term": "mid-term",
  "startDate": "2024-11-15",
  "endDate": "2024-11-25",
  "publishAt": "2024-11-10"
}
```

### Adding an Exam Paper

```typescript
POST /api/v1/exams/papers
{
  "examId": "exam-id",
  "subjectId": "subject-id",
  "maxMarks": 100,
  "weight": 1.0,
  "date": "2024-11-15",
  "duration": 180
}
```

### Bulk Marks Entry

```typescript
POST /api/v1/exams/marks/bulk
{
  "examPaperId": "paper-id",
  "marks": [
    {
      "studentId": "student-1",
      "marks": 85,
      "grade": "A",
      "remarks": "Excellent"
    },
    {
      "studentId": "student-2",
      "marks": 72,
      "grade": "B+",
      "remarks": "Good"
    }
  ]
}
```

### Promoting Students

```typescript
POST /api/v1/promotions/execute
{
  "fromClassId": "class-1-id",
  "toClassId": "class-2-id",
  "academicYearId": "year-id",
  "examId": "exam-id",
  "minPercentage": 40
}
```

## Security & Permissions

The following permissions have been added:
- `exams:create`, `exams:read`, `exams:update`, `exams:delete`
- `marks:create`, `marks:read`, `marks:update`
- `promotions:execute`
- `report-cards:generate`

All endpoints require JWT authentication and proper tenant isolation is enforced.

## Testing

Run the following commands to test:

```bash
# Backend tests
cd apps/api
npm test

# Build verification
npm run build

# Frontend build
cd apps/web
npm run build
```

## Future Enhancements

Potential improvements for future sprints:
- Report card customization and templates
- Email/SMS report card delivery
- Grade analytics and statistics
- Exam schedule conflict detection
- Online exam support
- Parent portal for viewing report cards
