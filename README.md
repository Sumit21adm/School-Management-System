# School Management System

A modern, full-stack school management system built with React, NestJS, and MySQL. Features comprehensive modules for student admissions, fee management, exams, transport, and inventory with offline-first capabilities.

---

## 🚀 Features Overview

### ✨ **Core Functionality**
- **Offline-First Architecture** - Works without internet using IndexedDB
- **Real-time Data Sync** - Automatic synchronization when online
- **Network Access Ready** - Accessible on local network for mobile devices
- **Form Validation** - Comprehensive client and server-side validation
- **Export Capabilities** - Excel and PDF export for all major modules

---

## 📚 Modules

### 🎓 **Student Admissions**
#### Fully Functional Features:
- ✅ **Dynamic Section Filtering** - Sections populate based on selected class
- ✅ **Student Registration** - Complete admission form with:
  - Photo upload and cropping
  - Parent/guardian information
  - Class and section assignment
  - Contact details (phone, WhatsApp, email)
  - Document management (Aadhar card)
- ✅ **Advanced Validation**
  - Phone: 10-15 digits, numbers only
  - Email: Valid format, optional
  - Aadhar: Exactly 12 digits
  - WhatsApp: 10-15 digits
  - Date of Birth: Age 3-25 years
  - Admission Date: Past 2 years to upcoming year
  - Student ID: Uppercase letters, numbers, hyphens
- ✅ **Search & Filter** - By student name/ID, class, section, status
- ✅ **Student Details View** - Complete profile with all information
- ✅ **Edit & Update** - Modify existing student records
- ✅ **Archive Students** - Soft delete functionality
- ✅ **Bulk Operations**
  - Import via Excel template
  - Export to Excel/PDF with filters
  - Download import template
- ✅ **User-Friendly UX**
  - Placeholder examples in all form fields
  - Real-time validation feedback
  - Clear error messages

### 💰 **Fee Management**
#### Fully Functional Features:
- ✅ **Fee Collection** - Record student payments
- ✅ **Multiple Payment Modes** - Cash, Cheque, Online, Card
- ✅ **Receipt Generation** - Printable fee receipts
- ✅ **Transaction History** - Complete payment records
- ✅ **Date-Range Reports** - Filter by date range
- ✅ **Export Functionality** - Excel/PDF export

### 📝 **Exam Management**
#### Fully Functional Features:
- ✅ **Exam Creation** - Schedule exams with details
- ✅ **Marks Entry** - Subject-wise marks recording
- ✅ **Student Results** - View individual exam results
- ✅ **Grade Calculation** - Automatic grade assignment

### 🚌 **Transport Management**
#### Fully Functional Features:
- ✅ **Vehicle Management** - Track school vehicles
- ✅ **Route Creation** - Define transport routes
- ✅ **Driver Details** - Manage driver information
- ✅ **Student Assignment** - Assign students to routes
- ✅ **Capacity Tracking** - Monitor vehicle capacity

### 📦 **Inventory Management**
#### Fully Functional Features:
- ✅ **Item Catalog** - Manage school inventory items
- ✅ **Stock Tracking** - Monitor stock levels
- ✅ **Stock Movements** - Track items in/out
- ✅ **Category Management** - Organize items by category

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **TypeScript** | Latest | Type safety |
| **Vite** | Latest | Build tool |
| **Material-UI (MUI)** | 7.3.5 | Component library |
| **React Router** | 7.9.6 | Client-side routing |
| **TanStack Query** | 5.90.11 | Data fetching & caching |
| **React Hook Form** | 7.66.1 | Form management |
| **Zod** | 4.1.13 | Schema validation |
| **Axios** | 1.13.2 | HTTP client |
| **Dexie.js** | 4.2.1 | IndexedDB wrapper (offline) |
| **TailwindCSS** | 4.x | Utility-first styling |
| **React Easy Crop** | 5.5.6 | Image cropping |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 11.0.1 | Node.js framework |
| **TypeScript** | Latest | Type safety |
| **Prisma ORM** | 6.19.0 | Database ORM |
| **MySQL** | 8.x | Database |
| **Passport JWT** | 4.0.1 | Authentication |
| **bcrypt** | 6.0.0 | Password hashing |
| **ExcelJS** | 4.4.0 | Excel generation |
| **PDFKit** | 0.17.2 | PDF generation |
| **class-validator** | 0.14.3 | DTO validation |

### DevOps & Tools
- **Docker & Docker Compose** - Containerization
- **Prisma Migrations** - Database version control
- **ESLint** - Code linting
- **Git** - Version control

---

## 📁 Project Structure

```
School-Management-System/
├── school-management-system/          # React Frontend
│   ├── src/
│   │   ├── components/                # Reusable UI components
│   │   │   ├── Layout.tsx            # Main layout with navigation
│   │   │   └── ErrorBoundary.tsx     # Error handling
│   │   ├── pages/                    # Route pages
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   ├── Login.tsx             # Authentication
│   │   │   ├── admissions/           # Admission module
│   │   │   │   ├── AdmissionForm.tsx # Student registration form
│   │   │   │   └── AdmissionList.tsx # Student list & management
│   │   │   ├── fees/                 # Fee module
│   │   │   │   ├── FeeCollection.tsx # Fee payment
│   │   │   │   └── FeeReports.tsx    # Fee reports
│   │   │   ├── exams/                # Exam module
│   │   │   │   ├── ExamManagement.tsx
│   │   │   │   └── MarksEntry.tsx
│   │   │   └── transport/            # Transport module
│   │   │       └── TransportManagement.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                # API service layer
│   │   │   ├── db.ts                 # IndexedDB for offline
│   │   │   └── utils.ts              # Utility functions
│   │   ├── utils/
│   │   │   └── cropImage.ts          # Image cropping utility
│   │   ├── App.tsx                   # Main app component
│   │   ├── main.tsx                  # App entry point
│   │   └── theme.ts                  # MUI theme config
│   ├── public/                        # Static assets
│   ├── package.json                   # Dependencies
│   ├── vite.config.ts                 # Vite configuration
│   ├── tailwind.config.js             # Tailwind configuration
│   └── tsconfig.json                  # TypeScript config
│
├── school-management-api/             # NestJS Backend
│   ├── src/
│   │   ├── admissions/               # Admissions module
│   │   │   ├── admissions.controller.ts
│   │   │   ├── admissions.service.ts
│   │   │   └── admissions.module.ts
│   │   ├── fees/                     # Fee management module
│   │   │   ├── fees.controller.ts
│   │   │   ├── fees.service.ts
│   │   │   └── fees.module.ts
│   │   ├── exams/                    # Exam module
│   │   │   └── exams.module.ts
│   │   ├── transport/                # Transport module
│   │   │   └── transport.module.ts
│   │   ├── inventory/                # Inventory module
│   │   │   └── inventory.module.ts
│   │   ├── auth/                     # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-auth.guard.ts
│   │   ├── app.module.ts             # Main application module
│   │   ├── prisma.service.ts         # Prisma service
│   │   └── main.ts                   # Application entry
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   ├── migrations/              # Database migrations
│   │   └── seed.ts                  # Database seeding
│   ├── uploads/                     # Uploaded files (photos, etc.)
│   ├── package.json                 # Dependencies
│   ├── tsconfig.json               # TypeScript config
│   └── nest-cli.json               # NestJS CLI config
│
├── docker-compose.yml              # Docker orchestration
├── launch-school-app.sh            # Quick start script
├── QUICK_START.md                  # Quick start guide
├── DEVELOPMENT_SUMMARY.md          # Development notes
└── README.md                       # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20 or higher
- **MySQL** 8.0 or higher
- **npm** or **yarn**

### One-Command Launch
```bash
./launch-school-app.sh
```

This script automatically:
- Starts MySQL (if not running)
- Starts backend on port **3001**
- Starts frontend on port **5173**
- Handles all necessary setup

### Manual Setup

#### 1. Database Setup
```bash
# Start MySQL
brew services start mysql  # macOS
# or
sudo systemctl start mysql  # Linux

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
# Edit .env with your database credentials:
# DATABASE_URL="mysql://root:password@localhost:3306/school_management"
# JWT_SECRET="your-secret-key"

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# (Optional) Seed database
npm run seed

# Start backend
npm run start:dev
```

Backend will run on: **http://localhost:3001**

#### 3. Frontend Setup
```bash
cd school-management-system

# Install dependencies
npm install

# Configure API URL
echo "VITE_API_URL=http://localhost:3001" > .env

# Start frontend
npm run dev
```

Frontend will run on: **http://localhost:5173**

---

## 🌐 Network Access

### Access from Mobile Devices

The application is configured for local network access:

#### Find Your Local IP
```bash
# macOS/Linux
ifconfig | grep "inet "
# Look for your local IP (typically 192.168.x.x)

# Windows
ipconfig
```

#### Access URLs
- **Frontend:** `http://YOUR_LOCAL_IP:5173`
- **Backend:** `http://YOUR_LOCAL_IP:3001`

### Configuration Details

**Backend (`main.ts`):**
```typescript
await app.listen(3001, '0.0.0.0');  // Listens on all interfaces
app.enableCors({ origin: '*' });    // Development only
```

**Frontend (`vite.config.ts`):**
```typescript
server: {
  host: true,  // Enables network access
  port: 5173
}
```

---

## 📊 Database Schema

### Student Management
- **`student_details`** - Student information (id, name, class, section, gender, dob, contact, etc.)

### Fee Management
- **`feetransaction_new`** - Fee transactions with payment details

### Exam Management
- **`exam_creator`** - Exam definitions
- **`exam_results`** - Student exam results

### Transport Management
- **`transport`** - Vehicle information
- **`transport_assignments`** - Student-vehicle assignments

### Inventory Management
- **`inventory`** - Item catalog
- **`stock_movements`** - Stock in/out tracking

### Authentication
- **`users`** - System users and credentials

---

## � Default Credentials

```
Username: admin
Password: admin123
```

⚠️ **Important:** Change these credentials in production!

---

## 📝 API Endpoints

### Base URL
```
http://localhost:3001
```

### Admissions
- `GET /admissions` - List all students (with filters)
- `GET /admissions/sections/:className` - Get available sections for a class
- `POST /admissions` - Create new student
- `GET /admissions/:id` - Get student details
- `PUT /admissions/:id` - Update student
- `DELETE /admissions/:id` - Archive student
- `GET /admissions/export` - Export students (Excel/PDF)
- `POST /admissions/import` - Import students from Excel
- `GET /admissions/template` - Download import template

### Fees
- `POST /fees/collect` - Collect fee payment
- `GET /fees/transactions` - List all transactions
- `GET /fees/receipt/:receiptNo` - Get receipt details
- `GET /fees/export` - Export transactions

### Exams
- `GET /exams` - List all exams
- `POST /exams` - Create new exam
- `POST /exams/:id/marks` - Enter student marks
- `GET /exams/results/:studentId` - Get student results

### Transport
- `GET /transport` - List all vehicles
- `POST /transport` - Add new vehicle
- `GET /transport/:id` - Get vehicle details

---

## 🔄 Offline Functionality

The application works seamlessly offline using **IndexedDB**:

1. **Automatic Detection** - Detects online/offline status
2. **Local Storage** - All data cached in browser
3. **Queue System** - Operations queued when offline
4. **Auto Sync** - Syncs automatically when connection restored
5. **Conflict Resolution** - Last-write-wins strategy

---

## 🏗️ Development

### Running in Development Mode

**Backend:**
```bash
cd school-management-api
npm run start:dev  # Watch mode with hot reload
```

**Frontend:**
```bash
cd school-management-system
npm run dev  # Vite dev server with HMR
```

### Building for Production

**Frontend:**
```bash
cd school-management-system
npm run build
# Output: dist/
```

**Backend:**
```bash
cd school-management-api
npm run build
# Output: dist/
```

### Database Migrations

**Create new migration:**
```bash
cd school-management-api
npx prisma migrate dev --name migration_name
```

**Apply migrations:**
```bash
npx prisma migrate deploy
```

**Reset database:**
```bash
npx prisma migrate reset
```

---

## 📋 Changelog

### [2025-12-04] - Hostel Management Removal

#### Removed
- 🗑️ **Hostel Management module** - Feature not required
  - Backend hostel module deleted
  - Database tables removed (`hostel`, `hostel_assignments`)
  - Removed from schema relations
  - Documentation updated

### [2025-12-04] - Form Enhancements & Network Access

#### Added
- ✨ **Dynamic Section Filter**
  - Sections populate based on selected class
  - New API: `GET /admissions/sections/:className`
  - Auto-resets when class changes
  - Shows only active sections with students

- ✨ **Enhanced Form Validation**
  - Phone: 10-15 digits validation
  - Email: Optional with format validation
  - Aadhar: Exactly 12 digits
  - WhatsApp: 10-15 digits
  - DOB: Age 3-25 years
  - Admission Date: Past 2 years to upcoming year
  - Student ID: Uppercase, numbers, hyphens

- ✨ **UX Improvements**
  - Placeholder examples for all fields:
    - Student ID: "e.g. STU2024001"
    - Phone: "e.g. 9876543210 (10-15 digits)"
    - Email: "e.g. student@example.com"
    - Aadhar: "e.g. 123456789012 (12 digits)"
  - Real-time validation feedback
  - Clear error messages

- ✨ **Network Configuration**
  - Backend listens on `0.0.0.0`
  - Frontend dev server with `--host`
  - CORS enabled for development
  - Mobile-ready for local network

#### Changed
- 🔄 Section dropdown disabled until class selected
- 🔄 Email field truly optional

#### Technical
- 📦 Database migrations for schema updates
- 📦 Enhanced service queries
- 📦 Improved API client

---

## 🤝 Contributing

This is a school management system project. For feature requests or improvements:
1. Create a feature branch
2. Make your changes
3. Update documentation
4. Add entry to changelog
5. Submit pull request

---

## 📄 License

Proprietary - All rights reserved

---

## 🆘 Support

For questions or issues:
- Create an issue in the repository
- Contact the development team

---

## 🙏 Acknowledgments

Built with modern web technologies to provide a robust, offline-capable school management solution.

---

**Last Updated:** 2025-12-04  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
