# 📡 API Documentation

Usage guide for the Backend REST API.

## Base URL
All API requests should be prefixed with:
`http://localhost:3001` or your production URL.

## Authentication
Most endpoints are protected by JWT Authentication via the `Authorization` header.
```http
Authorization: Bearer <your_jwt_token>
```

## Key Endpoints

### 🔐 Authentication
- `POST /auth/login` - Authenticate user and get JWT
- `GET /auth/profile` - Get current user profile

### 🎓 Admissions (Student)
- `GET /admissions` - Get all students (supports filtering)
- `GET /admissions/:id` - Get single student details
- `POST /admissions` - Create new student
- `PUT /admissions/:id` - Update student
- `DELETE /admissions/:id` - Archive student

### 💰 Fees
- `POST /fees/collect` - Collect fee payment
- `POST /fees/demand-bills/generate` - Generate monthly demand bills
- `GET /fees/receipt/:receiptNo` - Get receipt details
- `GET /fees/dashboard/:studentId/session/:sessionId` - Get student fee status

### 📅 Exams
- `GET /exams` - List exams
- `POST /exams` - Create new exam
- `POST /exams/marks` - Enter marks for valid exam

*For full Request/Response schemas, please refer to the OpenAPI Swagger documentation (if enabled) or the source code DTOs.*
