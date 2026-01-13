# Transport Management System - Implementation Plan

## Overview
Complete transport management module for managing school buses, routes, drivers, and student transport assignments with fee integration.

---

## ⚠️ Non-Breaking Changes (Critical)

### Database
- All new models are **separate tables** - no modification to existing tables
- Student model gets **optional** `transport` relation (nullable)
- No changes to existing Fee, DemandBill, or Transaction tables

### Backend
- New `/transport/*` endpoints - no changes to existing routes
- Fee integration is **additive** - adds transport fee as new line item
- All existing APIs remain unchanged

### Frontend
- New pages under `/transport/*` routes
- Sidebar gets new section - existing menu items unchanged
- Student Profile gets new tab - existing tabs unchanged
- Admission Form gets optional fields - existing fields unchanged

### Testing Checklist Before Deployment
- [ ] Existing student CRUD works
- [ ] Fee Collection works without transport
- [ ] Demand Bill generation works without transport
- [ ] All existing reports work
- [ ] Login/Authentication unchanged

---

## Phase 1: Database Schema

### New Models (Add to `schema.prisma`)

```prisma
// ============================================
// TRANSPORT MANAGEMENT MODELS
// ============================================

model Vehicle {
  id              Int       @id @default(autoincrement())
  vehicleNo       String    @unique @db.VarChar(20)  // e.g., "UP32AB1234"
  vehicleType     String    @db.VarChar(50)          // Bus, Van, Mini Bus
  capacity        Int                                  // Seating capacity
  make            String?   @db.VarChar(50)          // Tata, Ashok Leyland
  model           String?   @db.VarChar(50)
  year            Int?
  insuranceNo     String?   @db.VarChar(50)
  insuranceExpiry DateTime?
  fitnessExpiry   DateTime?
  permitExpiry    DateTime?
  status          String    @default("active")       // active, maintenance, retired
  notes           String?   @db.Text
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  routes          Route[]
  driver          Driver?   @relation(fields: [driverId], references: [id])
  driverId        Int?
}

model Driver {
  id              Int       @id @default(autoincrement())
  name            String    @db.VarChar(100)
  phone           String    @db.VarChar(15)
  altPhone        String?   @db.VarChar(15)
  address         String?   @db.Text
  licenseNo       String    @unique @db.VarChar(30)
  licenseType     String    @db.VarChar(20)          // LMV, HMV, Transport
  licenseExpiry   DateTime
  dateOfBirth     DateTime?
  dateOfJoining   DateTime  @default(now())
  aadharNo        String?   @db.VarChar(12)
  photoUrl        String?   @db.VarChar(500)
  salary          Decimal?  @db.Decimal(10,2)
  status          String    @default("active")       // active, inactive, terminated
  emergencyContact String?  @db.VarChar(100)
  emergencyPhone  String?   @db.VarChar(15)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  vehicles        Vehicle[]
}

model Route {
  id              Int       @id @default(autoincrement())
  routeName       String    @db.VarChar(100)         // e.g., "Route 1 - City Center"
  routeCode       String    @unique @db.VarChar(20)  // e.g., "R1"
  startPoint      String    @db.VarChar(100)
  endPoint        String    @db.VarChar(100)
  distance        Decimal?  @db.Decimal(5,2)         // in kilometers
  estimatedTime   Int?                                // in minutes
  morningDeparture String?  @db.VarChar(10)          // "07:30"
  eveningDeparture String?  @db.VarChar(10)          // "14:30"
  monthlyFee      Decimal   @db.Decimal(10,2)        // Transport fee for this route
  status          String    @default("active")       // active, inactive
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  vehicle         Vehicle?  @relation(fields: [vehicleId], references: [id])
  vehicleId       Int?
  stops           RouteStop[]
  studentTransports StudentTransport[]
}

model RouteStop {
  id              Int       @id @default(autoincrement())
  stopName        String    @db.VarChar(100)         // e.g., "Main Market"
  stopOrder       Int                                 // 1, 2, 3... sequence
  pickupTime      String?   @db.VarChar(10)          // "07:35"
  dropTime        String?   @db.VarChar(10)          // "14:45"
  landmark        String?   @db.VarChar(200)
  latitude        Decimal?  @db.Decimal(10,8)
  longitude       Decimal?  @db.Decimal(11,8)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  route           Route     @relation(fields: [routeId], references: [id], onDelete: Cascade)
  routeId         Int
  studentTransports StudentTransport[]

  @@unique([routeId, stopOrder])
}

model StudentTransport {
  id              Int       @id @default(autoincrement())
  pickupStopId    Int?                               // Morning pickup stop
  dropStopId      Int?                               // Evening drop stop (can be same)
  transportType   String    @default("both")         // pickup, drop, both
  startDate       DateTime  @default(now())
  endDate         DateTime?
  status          String    @default("active")       // active, discontinued
  notes           String?   @db.Text
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  student         Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  studentId       Int       @unique                  // One transport record per student
  route           Route     @relation(fields: [routeId], references: [id])
  routeId         Int
  pickupStop      RouteStop? @relation("PickupStop", fields: [pickupStopId], references: [id])
  dropStop        RouteStop? @relation("DropStop", fields: [dropStopId], references: [id])
}
```

### Modify Existing Student Model
```prisma
model Student {
  // ... existing fields ...
  
  // Add relation
  transport       StudentTransport?
}
```

---

## Phase 2: Backend APIs

### New Module: `transport`

#### File Structure
```
backend/src/transport/
├── transport.module.ts
├── transport.controller.ts
├── transport.service.ts
├── dto/
│   ├── create-vehicle.dto.ts
│   ├── create-driver.dto.ts
│   ├── create-route.dto.ts
│   ├── create-stop.dto.ts
│   └── assign-transport.dto.ts
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Vehicles** |||
| GET | `/transport/vehicles` | List all vehicles |
| GET | `/transport/vehicles/:id` | Get vehicle details |
| POST | `/transport/vehicles` | Create vehicle |
| PATCH | `/transport/vehicles/:id` | Update vehicle |
| DELETE | `/transport/vehicles/:id` | Delete vehicle |
| **Drivers** |||
| GET | `/transport/drivers` | List all drivers |
| GET | `/transport/drivers/:id` | Get driver details |
| POST | `/transport/drivers` | Create driver |
| PATCH | `/transport/drivers/:id` | Update driver |
| DELETE | `/transport/drivers/:id` | Delete driver |
| **Routes** |||
| GET | `/transport/routes` | List all routes with stops |
| GET | `/transport/routes/:id` | Get route with stops |
| POST | `/transport/routes` | Create route |
| PATCH | `/transport/routes/:id` | Update route |
| DELETE | `/transport/routes/:id` | Delete route |
| POST | `/transport/routes/:id/stops` | Add stop to route |
| PATCH | `/transport/routes/:id/stops/:stopId` | Update stop |
| DELETE | `/transport/routes/:id/stops/:stopId` | Remove stop |
| **Student Assignment** |||
| GET | `/transport/assignments` | List all assignments |
| GET | `/transport/assignments/student/:studentId` | Get student's transport |
| POST | `/transport/assignments` | Assign transport to student |
| PATCH | `/transport/assignments/:id` | Update assignment |
| DELETE | `/transport/assignments/:id` | Remove assignment |
| POST | `/transport/assignments/bulk` | Bulk assign students |
| **Reports** |||
| GET | `/transport/reports/route-wise` | Students per route |
| GET | `/transport/reports/stop-wise/:routeId` | Students per stop |
| GET | `/transport/reports/vehicle-wise` | Students per vehicle |

---

## Phase 3: Frontend Pages

### New Pages

#### 1. Vehicles List (`/transport/vehicles`)
- Table: Vehicle No, Type, Capacity, Driver, Insurance Expiry, Status
- Actions: Add, Edit, Delete
- Filters: Status, Type

#### 2. Drivers List (`/transport/drivers`)
- Table: Name, Phone, License No, License Expiry, Assigned Vehicle, Status
- Actions: Add, Edit, Delete, View Details
- Photo upload
- License expiry alerts

#### 3. Routes List (`/transport/routes`)
- Table: Route Code, Name, Start → End, Stops Count, Monthly Fee, Vehicle
- Actions: Add, Edit, Delete, Manage Stops
- Stop ordering with drag-and-drop

#### 4. Student Transport Assignment (`/transport/assignments`)
- Search student by ID/Name
- Select Route → Stop
- Bulk assignment by class

#### 5. Transport Reports (`/transport/reports`)
- Route-wise student list
- Stop-wise student list (for drivers)
- Print route sheets

### Sidebar Menu Addition
```
TRANSPORT
├── Vehicles
├── Drivers
├── Routes
├── Assignments
└── Reports
```

---

## Phase 4: Integrations

### 1. Fee Integration
**File**: `backend/src/fees/demand-bill.service.ts`

When generating demand bills:
```typescript
// Check if student has transport
const transport = await prisma.studentTransport.findUnique({
  where: { studentId },
  include: { route: true }
});

if (transport && transport.status === 'active') {
  // Add transport fee to bill items
  billItems.push({
    feeType: 'Transport Fee',
    amount: transport.route.monthlyFee,
    discount: 0
  });
}
```

### 2. Student Profile Tab
**File**: `frontend/src/pages/admissions/AdmissionList.tsx`

Add new tab "Transport" showing:
- Current Route & Stop
- Monthly Fee
- Vehicle & Driver details
- Transport history

### 3. Admission Form
**File**: `frontend/src/pages/admissions/AdmissionForm.tsx`

Add optional transport selection:
- Route dropdown
- Stop dropdown (filtered by route)
- Transport type (Pickup/Drop/Both)

---

## Phase 5: Permissions

### New Permissions
| Permission | Description |
|------------|-------------|
| `transport_view` | View transport data |
| `transport_manage` | Add/Edit vehicles, drivers, routes |
| `transport_assign` | Assign transport to students |
| `transport_reports` | View transport reports |

---

## Implementation Order

| Step | Task | Estimated Time |
|------|------|----------------|
| 1 | Database schema + migration | 1 hour |
| 2 | Transport backend module (CRUD) | 3 hours |
| 3 | Vehicles List page | 2 hours |
| 4 | Drivers List page | 2 hours |
| 5 | Routes List with Stops | 3 hours |
| 6 | Student Assignment page | 2 hours |
| 7 | Fee Integration | 1 hour |
| 8 | Student Profile tab | 1 hour |
| 9 | Transport Reports | 2 hours |
| 10 | Permissions & Testing | 1 hour |
| **Total** | | **~18 hours** |

---

*Last Updated: January 13, 2026*
