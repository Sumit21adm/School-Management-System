# 📂 Project Structure

The project follows a monorepo-style structure separating the Frontend (React) and Backend (NestJS).

## Root Directory
```
School-Management-System/
├── school-management-system/      # Frontend Application (React + Vite)
├── school-management-api/         # Backend API (NestJS + Prisma)
├── Documentation/                 # Project Documentation
├── run-mac.sh                     # Mac quick start script
├── run-linux.sh                   # Linux quick start script
├── run-windows.bat                # Windows quick start script
└── README.md                      # Project overview
```

---

## frontend: `school-management-system`

Built with **React, TypeScript, Vite, Material UI, and TanStack Query**.

```
school-management-system/
├── src/
│   ├── components/                # Reusable UI components
│   │   ├── Layout.tsx             # Main app shell & navigation
│   │   └── ...
│   ├── pages/                     # Page components (routed)
│   │   ├── admissions/            # Student management pages
│   │   ├── fees/                  # Fee collection & reports
│   │   ├── exams/                 # Exam management
│   │   └── ...
│   ├── lib/                       # Core libraries
│   │   ├── api.ts                 # Axios API client setup
│   │   ├── db.ts                  # Dexie.js (IndexedDB) setup
│   │   └── utils.ts               # Helper functions
│   ├── App.tsx                    # Route definitions
│   └── main.tsx                   # Entry point
```

---

## backend: `school-management-api`

Built with **NestJS, TypeScript, Prisma ORM, and MySQL**.

```
school-management-api/
├── src/
│   ├── app.module.ts              # Main application module
│   ├── prisma/                    # Database schema & migrations
│   │   └── schema.prisma          # Data models
│   ├── auth/                      # Authentication (JWT)
│   ├── admissions/                # Student CRUD logic
│   ├── fees/                      # Fee business logic
│   │   ├── fees.controller.ts     # API Endpoints
│   │   └── fees.service.ts        # Business Logic
│   └── ... (other modules)
```
