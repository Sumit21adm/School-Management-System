# School Management System - Modern Stack

A complete school management system built with modern web technologies, featuring offline-first capabilities and a comprehensive set of modules for managing all aspects of school operations.

## 🚀 Key Features

### ✨ **Recently Enhanced Features**
- **Dynamic Section Filtering** - Sections auto-populate based on selected class with real student data
- **Advanced Form Validation** - Comprehensive validation for all student admission fields
- **User-Friendly Placeholders** - Helpful examples in form fields to guide data entry
- **Network Access Ready** - Application accessible on local network for mobile testing

---

## 📚 Core Modules

### 🎓 **Admissions Management**
- ✅ Student registration with photo upload and cropping
- ✅ Comprehensive form validation (phone, email, Aadhar, dates, etc.)
- ✅ Dynamic class and section selection
- ✅ Real-time field validation with helpful error messages
- ✅ Search and filtering by:
  - Student name or ID
  - Class (1-12)
  - Section (dynamically loaded based on class)
  - Status (Active/Archived)
- ✅ Student profile view with complete details
- ✅ Edit and update student information
- ✅ Soft delete (archive) functionality
- ✅ Bulk import via Excel template
- ✅ Export to Excel/PDF with filters

**Form Validation Features:**
- Phone: 10-15 digits, numbers only
- Email: Valid format, optional
- Aadhar: Exactly 12 digits
- WhatsApp: 10-15 digits, optional
- Date of Birth: Age between 3-25 years
- Admission Date: Within past 2 years or upcoming year
- Student ID: Uppercase letters, numbers, hyphens only

### 💰 **Fee Management**
- ✅ Multiple fee types support
- ✅ Payment collection with receipt generation
- ✅ Multiple payment modes (Cash, Cheque, Online, Card)
- ✅ Transaction history and tracking
- ✅ Date-range filtering for reports
- ✅ Fee due tracking
- ✅ Receipt printing functionality
- ✅ Export transactions to Excel/PDF

### 📝 **Exam Management**
- ✅ Exam creation and scheduling
- ✅ Subject-wise marks entry
- ✅ Grade calculation
- ✅ Student result viewing
- ✅ Performance tracking
- ✅ Export functionality

### 🚌 **Transport Management**
- ✅ Vehicle information management
- ✅ Route creation and assignment
- ✅ Driver details tracking
- ✅ Capacity management
- ✅ Student transport assignment
- ✅ Transport fee management

### 🏠 **Hostel Management**
- ✅ Room creation and management
- ✅ Floor-wise organization
- ✅ Hostel type (Boys/Girls) separation
- ✅ Occupancy tracking
- ✅ Student room assignment
- ✅ Fee management

### 📦 **Inventory Management**
- ✅ Item cataloging
- ✅ Category management
- ✅ Stock movement tracking (In/Out)
- ✅ Current stock visibility
- ✅ Item search and filtering

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool
- **Material-UI (MUI)** - Modern component library
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching & caching
- **React Hook Form** - Form management
- **Zod** - Runtime type validation
- **Axios** - HTTP client
- **Dexie.js** - IndexedDB for offline storage
- **React Easy Crop** - Image cropping

### Backend
- **NestJS** - Progressive Node.js framework
- **Prisma ORM** - Type-safe database access
- **MySQL 8** - Relational database
- **JWT** - Authentication
- **TypeScript** - Type safety
- **ExcelJS** - Excel generation
- **PDFKit** - PDF generation

### DevOps
- **Docker & Docker Compose** - Containerization
- **Prisma Migrations** - Database versioning

---

## 📁 Project Structure

```
School-Management-System/
├── school-management-system/     # React Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/              # Route pages
│   │   │   ├── admissions/     # Student admissions module
│   │   │   ├── fees/           # Fee management module
│   │   │   ├── exams/          # Exam management module
│   │   │   ├── transport/      # Transport module
│   │   │   ├── hostel/         # Hostel module
│   │   │   └── inventory/      # Inventory module
│   │   ├── lib/
│   │   │   ├── api.ts          # API services
│   │   │   ├── db.ts           # IndexedDB (offline)
│   │   │   └── utils.ts        # Utility functions
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
│   │   └── main.ts             # Application entry
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Database migrations
│   └── package.json
│
├── docker-compose.yml            # Docker orchestration
├── launch-school-app.sh          # Quick launcher script
├── QUICK_START.md                # Quick start guide
└── README.md                     # This file
```

---

## 🏃 Quick Start

### Prerequisites
- Node.js 20+
- MySQL 8+
- npm or yarn

### One-Command Launch
```bash
./launch-school-app.sh
```
This script automatically:
- Starts the backend on port 3001
- Starts the frontend on port 5173
- Handles all necessary setup

### Manual Setup

#### 1. Database Setup
```bash
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

# Run migrations
npx prisma migrate dev

# Start backend
npm run start:dev
```

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

#### 4. Access Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Network Access:** http://YOUR_LOCAL_IP:5173 (for mobile testing)

---

## 🔐 Default Credentials

```
Username: admin
Password: admin123
```

---

## 📊 Database Schema

The system uses a comprehensive database schema with key tables:

### Core Tables
- `student_details` - Student information
- `feetransaction_new` - Fee transactions
- `exam_creator`, `exam_results` - Examination management
- `transport`, `transport_assignments` - Transport management
- `hostel`, `hostel_assignments` - Hostel management
- `inventory`, `stock_movements` - Inventory tracking
- `users` - System users and authentication

---

## 🌐 Network Access Configuration

The application is configured for local network access:

### Backend Configuration
- Listens on `0.0.0.0` (all network interfaces)
- CORS enabled for all origins (development mode)
- Accessible at `http://YOUR_LOCAL_IP:3001`

### Frontend Configuration
- Vite dev server runs with `--host` flag
- API client supports network URLs
- Accessible at `http://YOUR_LOCAL_IP:5173`

### Finding Your Local IP
```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

---

## 🔄 Offline Functionality

The application works seamlessly offline:

1. **Automatic Detection** - Detects online/offline status
2. **Local Storage** - Stores data in IndexedDB
3. **Fallback Mode** - Uses cached data when offline
4. **Online Sync** - Automatically syncs when connection is restored

---

## 📝 API Documentation

### Base URL
```
http://localhost:3001
```

### Key Endpoints

#### Admissions
- `GET /admissions` - List students (with filters)
- `GET /admissions/sections/:className` - Get available sections for a class
- `POST /admissions` - Create student
- `GET /admissions/:id` - Get student details
- `PUT /admissions/:id` - Update student
- `DELETE /admissions/:id` - Archive student
- `GET /admissions/export` - Export students (Excel/PDF)
- `GET /admissions/template` - Download import template
- `POST /admissions/import` - Import students from Excel

#### Fees
- `POST /fees/collect` - Collect fee payment
- `GET /fees/transactions` - List transactions
- `GET /fees/receipt/:receiptNo` - Get receipt
- `GET /fees/export` - Export transactions

#### Exams
- `GET /exams` - List exams
- `POST /exams` - Create exam
- `GET /exams/:id/results` - Get exam results

---

## 📋 Changelog

### [2025-12-04] - Session 1: Form Enhancements & Network Access

#### Added
- ✨ **Dynamic Section Filter** - Sections now populate based on selected class
  - New API endpoint: `GET /admissions/sections/:className`
  - Auto-resets section when class changes
  - Shows only sections with active students

- ✨ **Enhanced Form Validation**
  - Phone number: 10-15 digits validation
  - Email: Made truly optional with format validation
  - Aadhar Card: Exactly 12 digits validation
  - WhatsApp: 10-15 digits validation
  - Date of Birth: Age range validation (3-25 years)
  - Admission Date: Date range validation (past 2 years to upcoming year)
  - Student ID: Format validation (uppercase, numbers, hyphens)

- ✨ **User Experience Improvements**
  - Added placeholder examples for all validated fields
  - Improved error messages with specific format requirements
  - Real-time validation feedback

- ✨ **Network Access Configuration**
  - Backend configured to listen on `0.0.0.0`
  - Frontend dev server runs with `--host` flag
  - CORS enabled for development
  - Mobile-ready for local network testing

#### Changed
- 🔄 Section dropdown now disabled until class is selected
- 🔄 Email field marked as optional (removed required attribute)

#### Technical
- 📦 Updated Prisma schema for dynamic section queries
- 📦 Enhanced admission service with `getAvailableSections` method
- 📦 Improved frontend API client configuration

---

## 🎯 Roadmap

### Planned Features
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

---

## 🤝 Contributing

This is a school management system project. For feature requests or bugs, please contact the development team.

---

## 📄 License

Proprietary - All rights reserved

---

## 🆘 Support

For technical support or questions:
- Create an issue in the project repository
- Contact the development team

---

## 🙏 Acknowledgments

Built with modern web technologies to provide a robust, offline-capable school management solution.

---

**Note:** This README will be updated with each feature addition, modification, or improvement. Check the Changelog section for recent updates.
