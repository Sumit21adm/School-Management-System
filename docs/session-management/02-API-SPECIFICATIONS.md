# API Specifications - Session Management

**Version:** 1.0  
**Date:** 2025-12-04  
**Status:** 📝 Draft

---

## Overview

This document defines all backend API endpoints for the Session Management feature.

**Base URL:** `http://localhost:3001`  
**Authentication:** JWT Bearer Token (required for all endpoints)

---

## Module: Sessions

### 1. List All Sessions

**Endpoint:** `GET /sessions`  
**Description:** Get all academic sessions  
**Auth Required:** Yes

**Query Parameters:**
- `includeInactive` (boolean, optional) - Include inactive sessions, default: true

**Response:**
```json
{
  "sessions": [
    {
      "id": 1,
      "name": "APR 2024-MAR 2025",
      "startDate": "2024-04-01",
      "endDate": "2025-03-31",
      "isActive": true,
      "isSetupMode": false,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "_count": {
        "students": 101,
        "feeTransactions": 450
      }
    }
  ]
}
```

---

### 2. Get Active Session

**Endpoint:** `GET /sessions/active`  
**Description:** Get currently active session  
**Auth Required:** Yes

**Response:**
```json
{
  "id": 1,
  "name": "APR 2024-MAR 2025",
  "startDate": "2024-04-01",
  "endDate": "2025-03-31",
  "isActive": true,
  "isSetupMode": false
}
```

**Error Cases:**
- `404` - No active session found

---

### 3. Create Session

**Endpoint:** `POST /sessions`  
**Description:** Create new academic session  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "name": "APR 2025-MAR 2026",
  "startDate": "2025-04-01",
  "endDate": "2026-03-31",
  "isSetupMode": true
}
```

**Validation:**
- `name` - Required, unique, max 30 chars
- `startDate` - Required, must be April 1st
- `endDate` - Required, must be March 31st, must be after startDate
- `isSetupMode` - Optional, default: true

**Response:**
```json
{
  "id": 2,
  "name": "APR 2025-MAR 2026",
  "startDate": "2025-04-01",
  "endDate": "2026-03-31",
  "isActive": false,
  "isSetupMode": true,
  "createdAt": "2025-02-01T10:00:00Z"
}
```

**Error Cases:**
- `400` - Validation failed
- `409` - Session name already exists
- `403` - Not admin

---

### 4. Update Session

**Endpoint:** `PUT /sessions/:id`  
**Description:** Update session details  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "name": "APR 2025-MAR 2026",
  "startDate": "2025-04-01",
  "endDate": "2026-03-31"
}
```

**Response:** Updated session object

**Error Cases:**
- `404` - Session not found
- `400` - Cannot modify active session with student data
- `403` - Not admin

---

### 5. Activate Session

**Endpoint:** `POST /sessions/:id/activate`  
**Description:** Set session as active (deactivates current active)  
**Auth Required:** Yes (Admin only)

**Request Body:** None

**Response:**
```json
{
  "message": "Session activated successfully",
  "session": {
    "id": 2,
    "name": "APR 2025-MAR 2026",
    "isActive": true,
    "isSetupMode": false
  },
  "previousActive": {
    "id": 1,
    "name": "APR 2024-MAR 2025",
    "isActive": false
  }
}
```

**Business Logic:**
1. Deactivate currently active session
2. Activate target session
3. Set isSetupMode to false
4. Return both old and new active sessions

---

### 6. Delete Session

**Endpoint:** `DELETE /sessions/:id`  
**Description:** Delete session (only if no data)  
**Auth Required:** Yes (Admin only)

**Response:**
```json
{
  "message": "Session deleted successfully"
}
```

**Error Cases:**
- `400` - Cannot delete active session
- `400` - Session has associated students or transactions
- `404` - Session not found

---

## Module: Fee Types

### 1. List Fee Types

**Endpoint:** `GET /fee-types`  
**Description:** Get all fee types  
**Auth Required:** Yes

**Query Parameters:**
- `activeOnly` (boolean, optional) - Only active types, default: true

**Response:**
```json
{
  "feeTypes": [
    {
      "id": 1,
      "name": "Tuition Fee",
      "description": "Main tuition fee",
      "isActive": true,
      "isDefault": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2. Create Fee Type

**Endpoint:** `POST /fee-types`  
**Description:** Create custom fee type  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "name": "Transport Fee",
  "description": "Monthly transport charges",
  "isActive": true
}
```

**Response:** Created fee type object

---

### 3. Update Fee Type

**Endpoint:** `PUT /fee-types/:id`  
**Description:** Update fee type  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "name": "Updated Name",
  "isActive": false
}
```

**Error Cases:**
- `400` - Cannot deactivate type used in active structures

---

### 4. Delete Fee Type

**Endpoint:** `DELETE /fee-types/:id`  
**Description:** Delete fee type  
**Auth Required:** Yes (Admin only)

**Error Cases:**
- `400` - Cannot delete default types
- `400` - Type is used in fee structures

---

## Module: Fee Structures

### 1. Get Fee Structure

**Endpoint:** `GET /fee-structures/:sessionId/:className`  
**Description:** Get fee structure for specific session and class  
**Auth Required:** Yes

**Response:**
```json
{
  "id": 1,
  "sessionId": 1,
  "sessionName": "APR 2024-MAR 2025",
  "className": "1",
  "description": "Class 1 fee structure",
  "items": [
    {
      "feeTypeId": 1,
      "feeTypeName": "Tuition Fee",
      "amount": 25000.00,
      "isOptional": false
    },
    {
      "feeTypeId": 2,
      "feeTypeName": "Computer Fee",
      "amount": 5000.00,
      "isOptional": false
    }
  ],
  "totalAmount": 30000.00
}
```

---

### 2. Create/Update Fee Structure

**Endpoint:** `PUT /fee-structures/:sessionId/:className`  
**Description:** Create or update fee structure  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "description": "Class 1 fee structure for AY 2024-25",
  "items": [
    {
      "feeTypeId": 1,
      "amount": 25000.00,
      "isOptional": false
    },
    {
      "feeTypeId": 2,
      "amount": 5000.00,
      "isOptional": false
    }
  ]
}
```

**Business Logic:**
1. Delete existing items
2. Create new items
3. Transaction-wrapped for atomicity

**Response:** Updated fee structure object

---

### 3. Copy Fee Structure

**Endpoint:** `POST /fee-structures/copy`  
**Description:** Copy fee structure from one session to another  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "sourceSessionId": 1,
  "targetSessionId": 2,
  "classes": ["1", "2", "3"],  // Optional, all if not provided
  "applyPercentageIncrease": 10  // Optional, increase by 10%
}
```

**Response:**
```json
{
  "message": "Fee structures copied successfully",
  "copiedCount": 3,
  "classes": ["1", "2", "3"]
}
```

---

## Module: Student Discounts

### 1. Get Student Discounts

**Endpoint:** `GET /students/:studentId/discounts`  
**Description:** Get all discounts for a student  
**Auth Required:** Yes

**Query Parameters:**
- `sessionId` (int, optional) - Filter by session

**Response:**
```json
{
  "discounts": [
    {
      "id": 1,
      "studentId": "2024001",
      "feeTypeId": 1,
      "feeTypeName": "Tuition Fee",
      "sessionId": 1,
      "sessionName": "APR 2024-MAR 2025",
      "discountType": "PERCENTAGE",
      "discountValue": 10.00,
      "reason": "Merit scholarship",
      "approvedBy": "Principal",
      "createdAt": "2024-04-01T00:00:00Z"
    }
  ]
}
```

---

### 2. Add Student Discount

**Endpoint:** `POST /students/:studentId/discounts`  
**Description:** Add discount for student  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "feeTypeId": 1,
  "sessionId": 1,
  "discountType": "PERCENTAGE",  // or "FIXED"
  "discountValue": 10.00,
  "reason": "Merit scholarship",
  "approvedBy": "Principal"
}
```

**Validation:**
- `discountType` - Must be "PERCENTAGE" or "FIXED"
- `discountValue` - Must be >= 0
- If PERCENTAGE: Must be <= 100
- If FIXED: Cannot exceed fee amount

**Response:** Created discount object

---

### 3. Update Discount

**Endpoint:** `PUT /discounts/:id`  
**Description:** Update existing discount  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "discountValue": 15.00,
  "reason": "Updated merit scholarship"
}
```

---

### 4. Delete Discount

**Endpoint:** `DELETE /discounts/:id`  
**Description:** Remove student discount  
**Auth Required:** Yes (Admin only)

**Response:**
```json
{
  "message": "Discount removed successfully"
}
```

---

## Module: Promotions

### 1. Preview Promotion

**Endpoint:** `GET /promotions/preview`  
**Description:** Preview students for promotion  
**Auth Required:** Yes (Admin only)

**Query Parameters:**
- `sessionId` (int, required) - Current session
- `className` (string, required) - Current class
- `section` (string, required) - Current section

**Response:**
```json
{
  "currentSession": "APR 2024-MAR 2025",
  "nextSession": "APR 2025-MAR 2026",
  "currentClass": "1",
  "nextClass": "2",
  "section": "A",
  "students": [
    {
      "id": 1,
      "studentId": "2024001",
      "name": "Rahul Kumar",
      "currentClass": "1",
      "currentSection": "A",
      "nextClass": "2",
      "status": "active",
      "canPromote": true,
      "canPassout": false
    }
  ],
  "summary": {
    "total": 30,
    "canPromote": 30,
    "canPassout": 0
  }
}
```

---

### 2. Execute Promotion

**Endpoint:** `POST /promotions/execute`  
**Description:** Execute bulk student promotion  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "sourceSessionId": 1,
  "targetSessionId": 2,
  "className": "1",
  "section": "A",
  "students": [
    {
      "studentId": "2024001",
      "action": "PROMOTE"  // or "PASSOUT" or "RETAIN"
    }
  ]
}
```

**Business Logic:**
1. Validate target session exists
2. For each student:
   - If PROMOTE: Update class, session
   - If PASSOUT: Set status="Passed", isActive=false
   - If RETAIN: No change
3. Copy discounts to new session (if promoted)
4. Log all changes

**Response:**
```json
{
  "message": "Promotion completed successfully",
  "summary": {
    "promoted": 28,
    "passout": 0,
    "retained": 2,
    "failed": 0
  },
  "details": [
    {
      "studentId": "2024001",
      "action": "PROMOTE",
      "status": "success"
    }
  ]
}
```

---

## Module: Dashboard (Enhanced)

### Get Session Statistics

**Endpoint:** `GET /dashboard/stats/:sessionId`  
**Description:** Get statistics for specific session  
**Auth Required:** Yes

**Response:**
```json
{
  "session": {
    "id": 1,
    "name": "APR 2024-MAR 2025"
  },
  "students": {
    "total": 101,
    "active": 101,
    "newThisMonth": 5
  },
  "fees": {
    "totalCollected": 2500000.00,
    "monthCollection": 150000.00,
    "pendingCount": 15
  }
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "fieldName",
      "reason": "Specific reason"
    }
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (no token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

---

## Authentication

All endpoints require JWT Bearer token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Payload:**
```json
{
  "userId": 1,
  "username": "admin",
  "role": "ADMIN",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## Rate Limiting

- **Rate:** 100 requests per minute per IP
- **Header:** `X-RateLimit-Remaining`
- **Response:** `429 Too Many Requests`

---

## Versioning

**Current Version:** v1  
**Base Path:** `/api/v1` (future)

---

**Next Steps:**
1. Implement controllers
2. Add validation decorators
3. Write integration tests
4. Generate API documentation (Swagger)
