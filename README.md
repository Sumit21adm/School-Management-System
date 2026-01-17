# School Management System

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status: Active](https://img.shields.io/badge/Status-Active-success.svg)
![Node: 18+](https://img.shields.io/badge/Node-18%2B-green.svg)
![React: 18](https://img.shields.io/badge/React-18-61DAFB.svg)
![NestJS](https://img.shields.io/badge/NestJS-E0234E.svg)
![Lines of Code](https://img.shields.io/badge/Lines%20of%20Code-61K-blueviolet.svg)

A comprehensive, full-stack School Management System (ERP) designed for K-12 educational institutions. Built with modern web technologies, it offers a seamless experience for administrators, teachers, and staff.

## 🚀 Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React 18 | TypeScript, Vite, Material UI |
| **Backend** | NestJS | TypeScript, Modular Architecture |
| **Database** | MySQL 8.0 | Prisma ORM, Dockerized |
| **Auth** | JWT | Secure Role-Based Access Control (RBAC) |
| **i18n** | react-i18next | Multi-language support (English, Hindi) |

## ✨ Key Features

### 📝 Student Management
- Streamlined student registration with photo upload
- Bulk import from Excel/CSV
- Student promotions across academic years
- Comprehensive student profiles

### 💰 Fee Management
- Fee structure configuration by class
- Demand bill generation (individual & batch)
- Fee collection with **Split Payment** support (e.g., Cash + UPI)
- Transaction history & pending bills tracking
- PDF receipts with school branding

### 🚌 Transport Management
- Vehicle fleet management (insurance, fitness, permit tracking)
- Driver management with license expiry alerts
- Route management with stops and timings
- **Distance-based** automated fee calculation (Fare Slabs)
- Transport Discount management
- Student-route assignment (individual & bulk)

### 🏫 Class & Session Management
- Class and section configuration
- Subject mapping per class
- Multiple academic year support
- Student strength tracking

### 📊 Analytics & Reports
- Real-time dashboard with key metrics
- Daily collection reports
- Outstanding dues reports
- Fee analysis by class/category

### 🎓 Examinations
- Exam scheduling and configuration
- Grade/marks entry
- Result generation

### 👥 User Management
- Role-Based Access Control (RBAC)
- Granular permissions for Admins, Accountants, Teachers
- User activity logging

### 🌐 Multi-language Support
- English and Hindi translations
- Easy to add more languages
- Persistent language preference

### 🎨 Modern UI/UX
- Collapsible sidebar with pin functionality
- Dark/Light mode support
- Responsive design for all devices
- Smooth animations and transitions

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v18 or higher)
- **[Docker Desktop](https://www.docker.com/products/docker-desktop)** (Required for the database)

## ⚡ Quick Start

We have automated the entire setup process. You don't need to manually configure the database or install dependencies.

### 🍎 Mac / 🐧 Linux

1. Open your terminal.
2. Navigate to the project directory.
3. Run the setup script:
   ```bash
   chmod +x scripts/run-mac.command
   ./scripts/run-mac.command
   ```

### 🪟 Windows

1. Navigate to the project folder.
2. Double-click **`scripts\run-windows.bat`** (or run it from CMD).

---

### What happens next?

The script will automatically:
1. 🚀 Start Docker (if not running)
2. 🐳 Spin up a MySQL container
3. 📦 Install all dependencies (Frontend & Backend)
4. 🔄 Run database migrations and seed default data
5. 🌐 Launch the **API** (Port 3001) and **Frontend** (Port 5173)

## 📂 Project Structure

```
School-Management-System/
├── backend/                    # NestJS API Application
│   ├── src/
│   │   ├── admissions/         # Student admissions module
│   │   ├── auth/               # Authentication & JWT
│   │   ├── classes/            # Class management
│   │   ├── exams/              # Examination module
│   │   ├── fees/               # Fee management
│   │   ├── schools/            # School settings
│   │   ├── sessions/           # Academic sessions
│   │   ├── transport/          # Transport management
│   │   └── users/              # User management
│   └── prisma/                 # Database schema & seeds
│
├── frontend/                   # React + Vite Application
│   ├── public/
│   │   └── locales/            # i18n translation files
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── contexts/           # React contexts
│       ├── lib/                # API services
│       ├── pages/              # Page components
│       └── utils/              # Utilities & helpers
│
├── docs/                       # Documentation
│   ├── i18n-guide.md           # Internationalization guide
│   ├── transport-management-plan.md
│   └── attendance-management-plan.md
│
└── scripts/                    # Automation Scripts
    ├── run-mac.command         # Mac/Linux launcher
    ├── run-windows.bat         # Windows launcher
    ├── stop-mac.command        # Mac/Linux stop script
    └── stop-windows.bat        # Windows stop script
```

## 🔐 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `superadmin` | `admin123` |

## 📡 API Endpoints

The backend runs on `http://localhost:3001/api`

| Module | Endpoints |
|--------|-----------|
| Auth | `/auth/login`, `/auth/profile` |
| Students | `/students/*` |
| Fees | `/fees/*`, `/demand-bills/*`, `/fee-structure/*` |
| Transport | `/transport/vehicles/*`, `/transport/drivers/*`, `/transport/routes/*` |
| Classes | `/classes/*`, `/sections/*` |
| Sessions | `/sessions/*` |
| Users | `/users/*` |

## 🔧 Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="mysql://root:password@localhost:3306/school_db"
JWT_SECRET="your-secret-key"
PORT=3001
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

## 🚀 Development

### Running in Development Mode

```bash
# Backend
cd backend
npm run start:dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

### Database Commands

```bash
# Generate Prisma client
cd backend && npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

## 📋 Roadmap

- [x] Multi-language support (i18n)
- [x] Fee Management enhancements
- [x] Transport Management
- [x] Collapsible sidebar with pin
- [ ] Attendance Management
- [ ] UPI QR Code payments
- [ ] Examination enhancements
- [ ] Report Card generation
- [ ] SMS/Email notifications

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ by Sumit21adm*
