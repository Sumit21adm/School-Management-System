# School Management System - Modern Stack

A complete replication of the legacy Java-based School Management System using modern web technologies with offline-first capabilities.

## 🚀 Features

### Core Modules (Matching Legacy System)
- **Admissions** - Student registration, document management, approval workflows
- **Fee Management** - Fee collection, receipt generation, dues tracking, concessions
- **Exam Management** - Exam creation, marks entry, report cards, grade management
- **Transport** - Vehicle management, route assignment, student tracking
- **Hostel** - Room allocation, occupancy management, billing
- **Inventory** - Stock management, item tracking, requisitions

### Modern Capabilities
- ✅ **Offline-First** - Works without internet using IndexedDB
- ✅ **Automatic Sync** - Syncs data when connection is restored
- ✅ **Responsive UI** - Works on desktop, tablet, and mobile
- ✅ **Real-time Updates** - Live data updates across sessions
- ✅ **Type-Safe** - Full TypeScript implementation
- ✅ **Docker Ready** - Easy deployment with Docker Compose

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first styling
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching & caching
- **Dexie.js** - IndexedDB wrapper for offline storage
- **Zod** - Runtime type validation
- **Axios** - HTTP client

### Backend
- **NestJS** - Progressive Node.js framework
- **Prisma ORM** - Type-safe database access
- **MySQL 8** - Relational database
- **JWT** - Authentication
- **TypeScript** - Type safety

### DevOps
- **Docker & Docker Compose** - Containerization
- **Prisma Migrations** - Database versioning

## 📁 Project Structure

```
Antigravity SMS/
├── school-management-system/     # React Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/              # Route pages
│   │   │   ├── admissions/
│   │   │   ├── fees/
│   │   │   ├── exams/
│   │   │   ├── transport/
│   │   │   ├── hostel/
│   │   │   └── inventory/
│   │   ├── lib/
│   │   │   ├── api.ts          # API services
│   │   │   ├── db.ts           # IndexedDB (offline)
│   │   │   └── utils.ts        # Helpers
│   │   └── App.tsx             # Main app component
│   └── package.json
│
├── school-management-api/        # NestJS Backend
│   ├── src/
│   │   ├── admissions/         # Admissions module
│   │   ├── fees/               # Fee management module
│   │   ├── exams/              # Exam module
│   │   ├── transport/          # Transport module
│   │   ├── hostel/             # Hostel module
│   │   ├── inventory/          # Inventory module
│   │   ├── auth/               # Authentication module
│   │   ├── prisma.service.ts   # Prisma service
│   │   └── app.module.ts       # Main module
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (89 tables)
│   └── package.json
│
├── docker-compose.yml            # Docker orchestration
├── launch-school-app.sh          # Quick launcher
└── README.md                     # This file
```

## 🏃 Quick Start

### Option 1: Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Access the application
Frontend: http://localhost:5173
Backend API: http://localhost:3001
MySQL: localhost:3306
```

### Option 2: Manual Setup

#### Prerequisites
- Node.js 20+
- MySQL 8+
- npm or yarn

#### 1. Database Setup
```bash
# Start MySQL (if not running)
brew services start mysql

# Create database
mysql -u root -p
CREATE DATABASE school_management;
exit;
```

#### 2. Backend Setup
```bash
cd school-management-api

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npm run seed

# Start backend
npm run start:dev
```

#### 3. Frontend Setup
```bash
cd ../school-management-system

# Install dependencies
npm install

# Start frontend
npm run dev
```

#### 4. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🔐 Default Credentials

```
Username: admin
Password: admin123
```

## 📊 Database Schema

The system replicates the complete legacy database with **89 tables** including:

### Core Tables
- `student_details` - Student information
- `feetransaction_new` - Fee transactions
- `exam_creator`, `exam_results` - Examination management
- `transport`, `transport_assignments` - Transport management
- `hostel`, `hostel_assignments` - Hostel management
- `inventory`, `stock_movements` - Inventory tracking
- `employee_details` - Staff information
- `users` - System users and authentication

### Legacy Tables (Preserved)
- `admissionfee`, `admissionpayment`
- `fee_masternew`, `feeclassamtnew`
- `class_section`, `financialmaster`
- And 70+ more tables matching the legacy system

## 🔄 Offline Functionality

The application works seamlessly offline:

1. **Automatic Detection** - Detects online/offline status
2. **Local Storage** - Stores data in IndexedDB
3. **Queue System** - Queues operations for sync
4. **Auto Sync** - Syncs when connection restored
5. **Conflict Resolution** - Last-write-wins strategy

## 📱 Features by Module

### Admissions
- Student registration with photo upload
- Document management
- Class/section assignment
- Search and filtering
- Student profile management

### Fee Management
- Multiple fee types (tuition, transport, hostel, etc.)
- Payment modes (cash, cheque, online)
- Receipt generation
- Dues tracking and reporting
- Concession management
- Date-range reports

### Exams
- Exam creation and scheduling
- Marks entry
- Grade calculation
- Report card generation
- Subject-wise analysis

### Transport
- Route management
- Vehicle tracking
- Driver information
- Student assignments
- Transport fee management

### Hostel
- Room creation and management
- Occupancy tracking
- Student room assignment
- Floor-wise organization
- Boys/Girls hostel separation

### Inventory
- Item cataloging
- Stock movements (in/out)
- Category management
- Low stock alerts
- Valuation reports

## 🚀 Deployment

### Production Build

#### Frontend
```bash
cd school-management-system
npm run build
# Build output in dist/
```

#### Backend
```bash
cd school-management-api
npm run build
# Build output in dist/
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="mysql://user:password@localhost:3306/school_management"
JWT_SECRET="your-secret-key"
PORT=3001
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 📝 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user

#### Admissions
- `GET /api/admissions` - List students
- `POST /api/admissions` - Create student
- `GET /api/admissions/:id` - Get student
- `PUT /api/admissions/:id` - Update student
- `DELETE /api/admissions/:id` - Delete student

#### Fees
- `POST /api/fees/collect` - Collect fee
- `GET /api/fees/transactions` - List transactions
- `GET /api/fees/dues/:studentId` - Get student dues
- `GET /api/fees/receipt/:receiptNo` - Get receipt

#### Exams
- `GET /api/exams` - List exams
- `POST /api/exams` - Create exam
- `POST /api/exams/:id/marks` - Enter marks
- `GET /api/exams/results/:studentId` - Get results

[Full API documentation available at /api/docs when running]

## 🧪 Testing

```bash
# Frontend tests
cd school-management-system
npm test

# Backend tests
cd school-management-api
npm test

# E2E tests
npm run test:e2e
```

## 📦 Migration from Legacy System

### Database Migration
```bash
# Export from legacy MySQL
mysqldump -u root -p feemanagementsvd > legacy_backup.sql

# Import to new system
mysql -u root -p school_management < legacy_backup.sql

# Run migration scripts
npm run migrate:legacy
```

### Data Validation
```bash
npm run validate:migration
```

## 🤝 Contributing

This is a private school management system. For feature requests or bugs, contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For technical support or questions:
- Email: support@school.com
- Phone: +91-XXXXXXXXXX

## 🎯 Roadmap

- [ ] SMS Gateway integration
- [ ] Email notifications
- [ ] Biometric attendance
- [ ] Payment gateway integration
- [ ] Mobile app (React Native)
- [ ] Parent portal
- [ ] Teacher portal
- [ ] Library management
- [ ] Timetable management
- [ ] Attendance tracking

## 📸 Screenshots

[Add screenshots here]

## 🙏 Acknowledgments

Built as a modern replacement for the legacy Java-based Fee Management System (SVD).
