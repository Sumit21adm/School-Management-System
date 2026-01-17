# Examination Module - Developer Reference

## Overview
Examination management including exam types, exams, schedules, and subject management.

---

## Database Design

```mermaid
erDiagram
    ExamType ||--o{ Exam : categorizes
    Exam ||--o{ ExamSchedule : has
    Exam }|--|| AcademicSession : belongs_to
    ExamSchedule }|--|| Subject : tests
    
    Subject ||--o{ ClassSubject : assigned_to
    Subject ||--o{ SubjectTeacherAllocation : taught_by
    Subject ||--o{ ClassRoutine : scheduled_in
    ClassSubject }|--|| SchoolClass : belongs_to

    ExamType {
        int id PK
        string name UK
        string description
        boolean isActive
    }
    
    Exam {
        int id PK
        string name
        int examTypeId FK
        int sessionId FK
        date startDate
        date endDate
        string status
        string description
    }
    
    ExamSchedule {
        int id PK
        int examId FK
        int subjectId FK
        string className
        date date
        time startTime
        time endTime
        string roomNo
        int period
    }
    
    Subject {
        int id PK
        string name UK
        string code UK
        string description
        string color
        boolean isActive
    }
    
    ClassSubject {
        int id PK
        int classId FK
        int subjectId FK
        boolean isCompulsory
        int weeklyPeriods
        int order
    }
```

### Exam Status
- `UPCOMING` - Scheduled for future
- `ONGOING` - Currently in progress
- `COMPLETED` - Finished

---

## API Endpoints

### Exam Types

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/examination/types` | List exam types |
| POST | `/examination/types` | Create exam type |
| PATCH | `/examination/types/:id` | Update exam type |
| DELETE | `/examination/types/:id` | Delete exam type |

### Exams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/examination/exams` | List exams |
| GET | `/examination/exams/:id` | Get exam with schedules |
| POST | `/examination/exams` | Create exam |
| PATCH | `/examination/exams/:id` | Update exam |
| DELETE | `/examination/exams/:id` | Delete exam |
| POST | `/examination/exams/:id/schedule` | Add schedule |
| DELETE | `/examination/schedules/:id` | Delete schedule |

### Subjects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subjects` | List subjects |
| POST | `/subjects` | Create subject |
| PATCH | `/subjects/:id` | Update subject |
| DELETE | `/subjects/:id` | Delete subject |

---

## Create Exam with Schedules

```mermaid
flowchart TD
    A[Create Exam DTO] --> B{Has Schedules?}
    B -- Yes --> C[Transaction Start]
    C --> D[Create Exam]
    D --> E[Bulk Create Schedules]
    E --> F[Commit Transaction]
    B -- No --> D
    F --> G[Return Exam]
```

### Validation
- `startDate <= endDate`
- Schedule date within exam date range (optional warning)

---

## Related Files

| File | Purpose |
|------|---------|
| [exams.service.ts](file:///Users/sumitadm21/Downloads/GitHub-Sumit21adm/School-Management-System/backend/src/examination/services/exams.service.ts) | Exam CRUD (126 lines) |
| [exam-types.service.ts](file:///Users/sumitadm21/Downloads/GitHub-Sumit21adm/School-Management-System/backend/src/examination/services/exam-types.service.ts) | Types (47 lines) |
| [subjects.service.ts](file:///Users/sumitadm21/Downloads/GitHub-Sumit21adm/School-Management-System/backend/src/examination/services/subjects.service.ts) | Subjects (52 lines) |

---

*Last Updated: January 17, 2026*
