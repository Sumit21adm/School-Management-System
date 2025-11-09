# Students & Guardians API Documentation

## Overview

This document provides detailed information about the Students and Guardians API endpoints implemented in Sprint 2.

All endpoints require authentication using a JWT bearer token in the `Authorization` header.

Base URL: `http://localhost:3001/api/v1`

## Authentication

```
Authorization: Bearer <your_jwt_token>
```

## Students API

### List Students

Get a list of all students with optional filters.

**Endpoint:** `GET /students`

**Query Parameters:**
- `sectionId` (optional): Filter by section ID
- `status` (optional): Filter by status (active, inactive, graduated, transferred)

**Response:**
```json
[
  {
    "id": "cuid",
    "tenantId": "cuid",
    "userId": "cuid",
    "sectionId": "cuid",
    "admissionNo": "STU001",
    "dob": "2010-05-15T00:00:00.000Z",
    "gender": "male",
    "photo": null,
    "bloodGroup": "A+",
    "address": "123 Main St",
    "customFields": {},
    "status": "active",
    "admissionDate": "2024-01-15T00:00:00.000Z",
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z",
    "user": {
      "id": "cuid",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890"
    },
    "section": {
      "id": "cuid",
      "name": "A",
      "class": {
        "id": "cuid",
        "name": "Grade 1",
        "gradeLevel": 1
      }
    },
    "guardians": []
  }
]
```

### Get Student by ID

Get detailed information about a specific student.

**Endpoint:** `GET /students/:id`

**Response:** Same structure as individual student in list response, with full guardian details.

### Get Student Stats

Get statistics about students.

**Endpoint:** `GET /students/stats`

**Response:**
```json
{
  "total": 150,
  "byClass": 10
}
```

### Create Student

Create a new student record.

**Endpoint:** `POST /students`

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "admissionNo": "STU001",
  "dob": "2010-05-15",
  "gender": "male",
  "bloodGroup": "A+",
  "address": "123 Main St",
  "sectionId": "cuid",
  "admissionDate": "2024-01-15",
  "customFields": {
    "previousSchool": "ABC School",
    "medicalConditions": "None"
  }
}
```

**Required Fields:**
- `email`
- `password`
- `firstName`
- `lastName`
- `admissionNo`

**Response:** Created student object

### Update Student

Update an existing student record.

**Endpoint:** `PUT /students/:id`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dob": "2010-05-15",
  "gender": "male",
  "bloodGroup": "A+",
  "address": "123 Main St",
  "sectionId": "cuid",
  "status": "active",
  "customFields": {
    "updatedField": "value"
  }
}
```

**All fields are optional**

**Response:** Updated student object

### Delete Student

Delete a student record.

**Endpoint:** `DELETE /students/:id`

**Response:**
```json
{
  "message": "Student deleted successfully"
}
```

### Import Students

Bulk import students from CSV data.

**Endpoint:** `POST /students/import`

**Request Body:**
```json
{
  "students": [
    {
      "admissionNo": "STU001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "dob": "2010-05-15",
      "gender": "male",
      "bloodGroup": "A+",
      "address": "123 Main St",
      "className": "Grade 1",
      "sectionName": "A"
    }
  ],
  "defaultPassword": "Student@123"
}
```

**Response:**
```json
{
  "success": [
    {
      "admissionNo": "STU001",
      "email": "john.doe@example.com",
      "studentId": "cuid"
    }
  ],
  "errors": [
    {
      "admissionNo": "STU002",
      "email": "existing@example.com",
      "error": "Email already exists"
    }
  ]
}
```

### Link Guardian to Student

Link a guardian to a student.

**Endpoint:** `POST /students/:id/guardians`

**Request Body:**
```json
{
  "guardianId": "cuid",
  "relation": "father",
  "isPrimary": true
}
```

**Relation options:** `father`, `mother`, `guardian`, `other`

**Response:** StudentGuardian object with guardian details

### Unlink Guardian from Student

Remove a guardian link from a student.

**Endpoint:** `DELETE /students/:id/guardians/:guardianId`

**Response:**
```json
{
  "message": "Guardian unlinked successfully"
}
```

### Generate Student ID Card

Download a PDF ID card for a student with QR code.

**Endpoint:** `GET /students/:id/id-card`

**Response:** PDF file download

## Guardians API

### List Guardians

Get a list of all guardians.

**Endpoint:** `GET /guardians`

**Response:**
```json
[
  {
    "id": "cuid",
    "tenantId": "cuid",
    "userId": "cuid",
    "occupation": "Engineer",
    "address": "123 Main St",
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z",
    "user": {
      "id": "cuid",
      "email": "parent@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "phone": "+1234567890",
      "status": "active"
    },
    "students": []
  }
]
```

### Get Guardian by ID

Get detailed information about a specific guardian.

**Endpoint:** `GET /guardians/:id`

**Response:** Guardian object with full student details

### Get Guardian Stats

Get statistics about guardians.

**Endpoint:** `GET /guardians/stats`

**Response:**
```json
{
  "total": 120
}
```

### Create Guardian

Create a new guardian record.

**Endpoint:** `POST /guardians`

**Request Body:**
```json
{
  "email": "parent@example.com",
  "password": "Password123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1234567890",
  "occupation": "Engineer",
  "address": "123 Main St"
}
```

**Required Fields:**
- `email`
- `password`
- `firstName`
- `lastName`

**Response:** Created guardian object

### Update Guardian

Update an existing guardian record.

**Endpoint:** `PUT /guardians/:id`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1234567890",
  "occupation": "Engineer",
  "address": "123 Main St"
}
```

**All fields are optional**

**Response:** Updated guardian object

### Delete Guardian

Delete a guardian record.

**Endpoint:** `DELETE /guardians/:id`

**Response:**
```json
{
  "message": "Guardian deleted successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Student not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## Custom Fields

Students support custom fields through the `customFields` JSON property. You can store any additional data:

```json
{
  "customFields": {
    "previousSchool": "ABC School",
    "medicalConditions": "Allergic to peanuts",
    "specialNeeds": "None",
    "emergencyContact": "+9876543210",
    "transportRequired": true
  }
}
```

## Notes

1. All dates should be in ISO 8601 format
2. Passwords must be at least 6 characters long
3. Email addresses must be unique per tenant
4. Admission numbers must be unique per tenant
5. When a student is deleted, the associated user account is also deleted
6. When a guardian is deleted, they are unlinked from all students first
7. Setting a guardian as primary automatically unsets other primary guardians for that student
