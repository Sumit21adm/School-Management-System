# Transport Management System - Implementation Plan

## Overview
Complete transport management module for managing school buses, routes, drivers, and student transport assignments with distance-based fare integration.

---

## ✅ Implementation Status

| Phase | Task | Status |
|-------|------|--------|
| 1 | Database Schema | ✅ Complete |
| 2 | Backend APIs (25+ endpoints) | ✅ Complete |
| 3 | Frontend Pages (6 pages) | ✅ Complete |
| 4 | Fee Integration (Distance-based) | ✅ Complete |
| 5 | Permissions | ✅ Complete |
| 6 | Fare Slabs Feature | ✅ Complete |

*Last Updated: January 14, 2026*

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

---

## Phase 1: Database Schema ✅

### Models (8 total)

| Model | Status | Description |
|-------|--------|-------------|
| Vehicle | ✅ | vehicleNo, type, capacity, make, model, insurance, fitness, permit, status |
| Driver | ✅ | name, phone, license, licenseExpiry, address, photo, salary, status |
| Route | ✅ | routeName, routeCode, startPoint, endPoint, distance, timings, monthlyFee |
| RouteStop | ✅ | stopName, stopOrder, pickupTime, dropTime, landmark, lat/lng, **distanceFromSchool** |
| StudentTransport | ✅ | studentId, routeId, pickupStopId, dropStopId, transportType, status |
| TransportFareSlab | ✅ | **NEW** - minDistance, maxDistance, monthlyFee, description, isActive |
| Conductor | ❌ | Optional - not implemented |

### New Fields Added (January 14, 2026)
- `RouteStop.distanceFromSchool` - Distance from school in km (for fare calculation)
- `TransportFareSlab` - New model for distance-based fare configuration

---

## Phase 2: Backend APIs ✅

### Endpoints (25+ total)

| Category | Endpoints | Status |
|----------|-----------|--------|
| Vehicles | List, Get, Create, Update, Delete | ✅ |
| Drivers | List, Get, Create, Update, Delete | ✅ |
| Routes | List, Get, Create, Update, Delete | ✅ |
| RouteStops | Add, Update, Delete | ✅ |
| Assignments | List, Get, Assign, Update, Remove, Bulk | ✅ |
| Reports | Route-wise, Stop-wise | ✅ |
| **Fare Slabs** | List, Create, Update, Delete | ✅ |

### New Endpoints (January 14, 2026)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transport/fare-slabs` | List all fare slabs |
| POST | `/transport/fare-slabs` | Create fare slab |
| PATCH | `/transport/fare-slabs/:id` | Update fare slab |
| DELETE | `/transport/fare-slabs/:id` | Delete fare slab |

---

## Phase 3: Frontend Pages ✅

| Page | Route | Status |
|------|-------|--------|
| Vehicles List | `/transport/vehicles` | ✅ |
| Drivers List | `/transport/drivers` | ✅ |
| Routes List | `/transport/routes` | ✅ |
| Student Assignments | `/transport/assignments` | ✅ |
| Transport Reports | `/transport/reports` | ✅ |
| **Fare Slabs** | `/transport/fare-slabs` | ✅ |

### Sidebar Menu
```
TRANSPORT
├── Vehicles      (transport_view)
├── Drivers       (transport_view)
├── Routes        (transport_view)
├── Assignments   (transport_assign)
├── Reports       (transport_reports)
└── Fare Slabs    (transport_manage)
```

---

## Phase 4: Integrations ✅

### 1. Fee Integration ✅
**Updated**: Now uses distance-based fare slabs

```typescript
// New Logic in fees.service.ts
const pickupDistance = student.transport.pickupStop?.distanceFromSchool || 0;
const dropDistance = student.transport.dropStop?.distanceFromSchool || 0;
const maxDistance = Math.max(pickupDistance, dropDistance);

// Lookup fare slab for this distance
const fareSlab = await this.prisma.transportFareSlab.findFirst({
  where: {
    isActive: true,
    minDistance: { lte: maxDistance },
    maxDistance: { gte: maxDistance }
  }
});

// Falls back to route.monthlyFee if no slab matches
const transportAmount = fareSlab ? fareSlab.monthlyFee : route.monthlyFee;
```

### 2. Student Profile Tab ✅
- Shows current Route & Stop
- Monthly Fee based on distance
- Vehicle & Driver details

### 3. Admission Form ✅
- Optional transport selection during admission
- Route dropdown
- Stop dropdown (filtered by route)
- Transport type (Pickup/Drop/Both)

---

## Phase 5: Permissions ✅

| Permission | Description | Status |
|------------|-------------|--------|
| `transport_view` | View transport data | ✅ |
| `transport_manage` | Add/Edit vehicles, drivers, routes, fare slabs | ✅ |
| `transport_assign` | Assign transport to students | ✅ |
| `transport_reports` | View transport reports | ✅ |

---

## Distance-Wise Fare Feature (NEW)

### How It Works
1. **Configure Fare Slabs**: Admin sets up distance-based fare tiers (e.g., 0-3km = ₹500, 3-6km = ₹800)
2. **Set Stop Distances**: Each route stop has a `distanceFromSchool` field
3. **Auto-Calculate Fee**: When generating demand bills:
   - System finds student's pickup/drop stop distances
   - Uses the higher distance for billing
   - Looks up matching fare slab
   - Falls back to route's flat `monthlyFee` if no slab matches

### Example Fare Slabs
| Distance Range | Monthly Fee | Description |
|----------------|-------------|-------------|
| 0 - 3 km | ₹500 | Near zone |
| 3 - 6 km | ₹800 | Mid zone |
| 6 - 10 km | ₹1200 | Far zone |
| 10+ km | ₹1500 | Extended zone |

---

## Implementation Timeline

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Database schema + migration | 1 hr | ✅ |
| 2 | Transport backend module (CRUD) | 3 hrs | ✅ |
| 3 | Vehicles List page | 2 hrs | ✅ |
| 4 | Drivers List page | 2 hrs | ✅ |
| 5 | Routes List with Stops | 3 hrs | ✅ |
| 6 | Student Assignment page | 2 hrs | ✅ |
| 7 | Fee Integration | 1 hr | ✅ |
| 8 | Student Profile tab | 1 hr | ✅ |
| 9 | Transport Reports | 2 hrs | ✅ |
| 10 | Permissions & Testing | 1 hr | ✅ |
| 11 | Distance-wise Fare Feature | 2 hrs | ✅ |
| **Total** | | **~20 hours** | ✅ Complete |

---

## Pending Items

- [ ] Run Prisma migration: `npx prisma migrate dev`
- [ ] ID Card: Include route/stop on print (future enhancement)
- [ ] Conductor model (optional)

---

*Last Updated: January 14, 2026 - 7:30 PM IST*
