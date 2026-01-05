# School Management System

A full-stack School Management System (ERP) for K-12 educational institutions.

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18 + TypeScript + Vite + Material UI |
| **Backend** | NestJS + TypeScript |
| **Database** | MySQL + Prisma ORM |
| **Authentication** | JWT |

## Project Structure

```
School-Management-System/
├── school-management-api/      # Backend (NestJS)
│   ├── src/                    # Source code
│   ├── prisma/                 # Database schema & migrations
│   └── package.json
│
├── school-management-system/   # Frontend (React + Vite)
│   ├── src/                    # Source code  
│   └── package.json
│
├── SCHOOL_MANAGEMENT_SYSTEM_BLUEPRINT.md   # Complete app documentation
└── HOSTINGER_DEPLOYMENT_GUIDE.md           # Deployment guide
```

## Quick Start

### 1. Start the Backend

```bash
cd school-management-api
npm install
cp .env.example .env  # Configure DATABASE_URL
npx prisma migrate dev
npm run seed
npm run start:dev
```

Backend runs on: http://localhost:3001

### 2. Start the Frontend

```bash
cd school-management-system
npm install
cp .env.example .env  # Set VITE_API_URL=http://localhost:3001
npm run dev
```

Frontend runs on: http://localhost:5173

### 3. Login

- **Username**: `superadmin`
- **Password**: `admin123`

## Features

- 📝 **Admissions**: Student registration with photo upload, bulk import/export
- 💰 **Fee Management**: Collection, receipts, demand bills, discounts
- 📊 **Reports**: Daily collection, outstanding dues, fee analysis
- 🎓 **Examinations**: Exam types, subjects, scheduling
- 📅 **Sessions**: Multi-year academic session support
- 👥 **Users**: Role-based access control (Admin, Accountant, Teacher, etc.)
- 🖨️ **PDF Generation**: Fee receipts and demand bills
- ⬆️ **Promotions**: End-of-year class promotions

## Documentation

- [Application Blueprint](./SCHOOL_MANAGEMENT_SYSTEM_BLUEPRINT.md) - Complete architecture & module details
- [Hostinger Deployment Guide](./HOSTINGER_DEPLOYMENT_GUIDE.md) - Step-by-step production deployment

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="mysql://user:password@localhost:3306/school_db"
JWT_SECRET="your-secret-key"
PORT=3001
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
```

---

*Built with ❤️ by Sumit21adm*
