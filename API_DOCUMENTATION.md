# Sprint 6 - Library, Transport, Hostel Modules

## API Documentation

This document describes the API endpoints for the Library, Transport, and Hostel modules added in Sprint 6.

All endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

---

## Library Module

### Books

#### GET /api/v1/library/books
Get all books in the library catalog.

**Query Parameters:**
- `category` (optional) - Filter by book category
- `search` (optional) - Search by title, author, or ISBN

**Response:**
```json
[
  {
    "id": "book_id",
    "isbn": "978-1234567890",
    "title": "Book Title",
    "author": "Author Name",
    "publisher": "Publisher Name",
    "category": "Fiction",
    "totalCopies": 5,
    "available": 3,
    "location": "Shelf A1"
  }
]
```

#### GET /api/v1/library/books/:id
Get a specific book by ID.

#### POST /api/v1/library/books
Add a new book to the catalog.

**Request Body:**
```json
{
  "isbn": "978-1234567890",
  "title": "Book Title",
  "author": "Author Name",
  "publisher": "Publisher Name",
  "category": "Fiction",
  "totalCopies": 5,
  "available": 5,
  "location": "Shelf A1"
}
```

#### PUT /api/v1/library/books/:id
Update book information.

#### DELETE /api/v1/library/books/:id
Delete a book from the catalog.

### Issues

#### GET /api/v1/library/issues
Get all book issues.

**Query Parameters:**
- `studentId` (optional) - Filter by student
- `status` (optional) - Filter by status (issued, returned, overdue)

**Response:**
```json
[
  {
    "id": "issue_id",
    "book": { "title": "Book Title" },
    "student": {
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "issueDate": "2025-01-01T00:00:00Z",
    "dueDate": "2025-01-15T00:00:00Z",
    "returnDate": null,
    "status": "issued",
    "fineAmount": 0,
    "finePaid": false
  }
]
```

#### POST /api/v1/library/issues
Issue a book to a student.

**Request Body:**
```json
{
  "bookId": "book_id",
  "studentId": "student_id",
  "dueDate": "2025-01-15T00:00:00Z"
}
```

#### PUT /api/v1/library/issues/:id/return
Return a book (calculates fine if overdue).

#### PUT /api/v1/library/issues/:id/pay-fine
Mark fine as paid.

### Statistics

#### GET /api/v1/library/stats
Get library statistics.

**Response:**
```json
{
  "totalBooks": 1000,
  "availableBooks": 850,
  "issuedBooks": 150,
  "overdueBooks": 12
}
```

### CSV Export

#### GET /api/v1/library/export/books
Export books catalog as CSV.

#### GET /api/v1/library/export/issues
Export issue records as CSV.

---

## Transport Module

### Routes

#### GET /api/v1/transport/routes
Get all transport routes.

**Response:**
```json
[
  {
    "id": "route_id",
    "name": "Route 1",
    "description": "Main city route",
    "stops": [
      {
        "id": "stop_id",
        "name": "Stop Name",
        "location": "Location details",
        "sequence": 1,
        "arrivalTime": "08:00"
      }
    ],
    "allocations": []
  }
]
```

#### POST /api/v1/transport/routes
Create a new route.

**Request Body:**
```json
{
  "name": "Route 1",
  "description": "Main city route"
}
```

#### PUT /api/v1/transport/routes/:id
Update route information.

#### DELETE /api/v1/transport/routes/:id
Delete a route.

### Stops

#### GET /api/v1/transport/routes/:routeId/stops
Get all stops for a route.

#### POST /api/v1/transport/stops
Add a new stop to a route.

**Request Body:**
```json
{
  "routeId": "route_id",
  "name": "Stop Name",
  "location": "Location details",
  "sequence": 1,
  "arrivalTime": "08:00"
}
```

#### PUT /api/v1/transport/stops/:id
Update stop information.

#### DELETE /api/v1/transport/stops/:id
Delete a stop.

### Vehicles

#### GET /api/v1/transport/vehicles
Get all vehicles.

**Query Parameters:**
- `status` (optional) - Filter by status (active, maintenance, inactive)

**Response:**
```json
[
  {
    "id": "vehicle_id",
    "vehicleNumber": "BUS-001",
    "type": "bus",
    "capacity": 40,
    "driver": "Driver Name",
    "phone": "1234567890",
    "status": "active",
    "allocations": []
  }
]
```

#### POST /api/v1/transport/vehicles
Add a new vehicle.

#### PUT /api/v1/transport/vehicles/:id
Update vehicle information.

#### DELETE /api/v1/transport/vehicles/:id
Delete a vehicle.

### Allocations

#### GET /api/v1/transport/allocations
Get all student transport allocations.

**Query Parameters:**
- `routeId` (optional) - Filter by route
- `vehicleId` (optional) - Filter by vehicle
- `status` (optional) - Filter by status

#### POST /api/v1/transport/allocations
Allocate a student to a route and vehicle.

**Request Body:**
```json
{
  "studentId": "student_id",
  "routeId": "route_id",
  "vehicleId": "vehicle_id",
  "stopName": "Stop Name",
  "status": "active"
}
```

#### PUT /api/v1/transport/allocations/:id
Update allocation.

#### DELETE /api/v1/transport/allocations/:id
Remove allocation.

### Statistics

#### GET /api/v1/transport/stats
Get transport statistics.

### CSV Export

#### GET /api/v1/transport/export/routes
Export routes as CSV.

#### GET /api/v1/transport/export/vehicles
Export vehicles as CSV.

#### GET /api/v1/transport/export/allocations
Export allocations as CSV.

---

## Hostel Module

### Buildings

#### GET /api/v1/hostel/buildings
Get all hostel buildings with rooms.

**Response:**
```json
[
  {
    "id": "building_id",
    "name": "Building A",
    "type": "boys",
    "address": "Campus Address",
    "warden": "Warden Name",
    "phone": "1234567890",
    "rooms": []
  }
]
```

#### POST /api/v1/hostel/buildings
Create a new building.

#### PUT /api/v1/hostel/buildings/:id
Update building information.

#### DELETE /api/v1/hostel/buildings/:id
Delete a building.

### Rooms

#### GET /api/v1/hostel/buildings/:buildingId/rooms
Get all rooms in a building.

#### POST /api/v1/hostel/rooms
Add a new room.

**Request Body:**
```json
{
  "buildingId": "building_id",
  "roomNumber": "101",
  "floor": 1,
  "capacity": 2,
  "type": "double",
  "status": "available"
}
```

#### PUT /api/v1/hostel/rooms/:id
Update room information.

#### DELETE /api/v1/hostel/rooms/:id
Delete a room.

### Allocations

#### GET /api/v1/hostel/allocations
Get all student hostel allocations.

**Query Parameters:**
- `roomId` (optional) - Filter by room
- `status` (optional) - Filter by status

**Response:**
```json
[
  {
    "id": "allocation_id",
    "student": {
      "user": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      }
    },
    "room": {
      "building": { "name": "Building A" },
      "roomNumber": "101"
    },
    "bedNumber": "1",
    "checkIn": "2025-01-01T00:00:00Z",
    "checkOut": null,
    "status": "active"
  }
]
```

#### POST /api/v1/hostel/allocations
Allocate a student to a room.

**Request Body:**
```json
{
  "studentId": "student_id",
  "roomId": "room_id",
  "bedNumber": "1",
  "status": "active"
}
```

#### PUT /api/v1/hostel/allocations/:id
Update allocation.

#### PUT /api/v1/hostel/allocations/:id/checkout
Check out a student from the hostel.

#### DELETE /api/v1/hostel/allocations/:id
Remove allocation.

### Attendance

#### GET /api/v1/hostel/attendance
Get hostel attendance records.

**Query Parameters:**
- `date` (optional) - Filter by date (ISO format)
- `studentId` (optional) - Filter by student

#### POST /api/v1/hostel/attendance
Mark attendance for a student.

**Request Body:**
```json
{
  "studentId": "student_id",
  "date": "2025-01-01T00:00:00Z",
  "status": "present",
  "checkIn": "20:00",
  "checkOut": "08:00",
  "note": "Optional note"
}
```

### Statistics

#### GET /api/v1/hostel/stats
Get hostel statistics.

**Response:**
```json
{
  "totalBuildings": 3,
  "totalRooms": 50,
  "occupiedRooms": 45,
  "totalAllocations": 90
}
```

### CSV Export

#### GET /api/v1/hostel/export/buildings
Export buildings as CSV.

#### GET /api/v1/hostel/export/rooms
Export rooms as CSV.

#### GET /api/v1/hostel/export/allocations
Export allocations as CSV.

---

## CSV Export Format

All CSV exports return data as a plain text CSV file with headers. The response has:
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="<module>-<type>.csv"`

Example CSV structure:
```
id,title,author,category,totalCopies,available
book_1,Book Title,Author Name,Fiction,5,3
```

---

## Error Handling

All endpoints return standard HTTP status codes:
- `200 OK` - Successful request
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```
