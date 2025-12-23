# School Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)
![Lines of Code](https://img.shields.io/badge/lines_of_code-~19k-blueviolet)
![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)

A modern, offline-first School Management System built with **React, NestJS, and MySQL**. Designed for seamless operation with robust fee management, admission tracking, and comprehensive reporting.

## 📁 Project Structure

```
School-Management-System/
├── school-management-system/       # React Frontend
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Admissions.tsx
│   │   │   ├── FeeCollection.tsx
│   │   │   └── ...
│   │   ├── services/              # API clients
│   │   ├── stores/                # State management
│   │   ├── db/                    # IndexedDB for offline
│   │   └── types/                 # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── school-management-api/          # NestJS Backend
│   ├── src/
│   │   ├── admissions/            # Admissions module
│   │   ├── fees/                  # Fee management
│   │   ├── auth/                  # Authentication
│   │   ├── prisma/                # Prisma module
│   │   └── main.ts                # Entry point
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── migrations/            # Database migrations
│   │   └── seed.ts                # Database seeding
│   ├── uploads/                   # Uploaded files
│   ├── package.json
│   └── tsconfig.json
│
├── scripts/                        # Utility scripts
│   ├── run-windows.bat             # Windows launcher
│   ├── run-mac.sh                  # Mac launcher
│   ├── run-linux.sh                # Linux launcher
│   └── count-lines.sh              # LOC counter
├── docker-compose.yml              # Docker orchestration
├── Makefile                        # Development commands
└── README.md                       # This file
```

---

## 🚀 Quick Start

**Prerequisites:** 
- [Docker](https://docs.docker.com/get-docker/) (for MySQL database)
- [Node.js 18+](https://nodejs.org/)

### Windows
Double-click **`scripts/run-windows.bat`**

### Mac
```bash
./scripts/run-mac.sh
```

### Linux
```bash
./scripts/run-linux.sh
```

The script will:
1. ✅ Start MySQL in Docker container
2. ✅ Check Node.js and install dependencies
3. ✅ Configure environment automatically
4. ✅ Run database migrations
5. ✅ Start API (port 3001) and Frontend (port 5173)
6. ✅ Open http://localhost:5173 in your browser

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

---

## 📊 Database Schema

### Core Tables
- **`student_details`** - Student information
- **`feetransaction_new`** - Fee transactions
- **`inventory`**, **`stock_movements`** - Inventory tracking
- **`users`** - System users and authentication

---

## 🔑 Default Credentials

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
- `GET /admissions/sections/:className` - Get available sections
- `POST /admissions` - Create new student
- `GET /admissions/:id` - Get student details
- `PUT /admissions/:id` - Update student
- `DELETE /admissions/:id` - Archive student

### Fees
- `POST /fees/collect` - Collect fee payment
- `GET /fees/transactions` - List all transactions
- `GET /fees/receipt/:receiptNo` - Get receipt details

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

### Database Migrations

```bash
cd school-management-api
npx prisma migrate dev --name migration_name
npx prisma migrate deploy
npx prisma migrate reset
```

---

## 🤝 Contributing

1. Fork the repository
2. Clone your fork
3. Run `make start`
4. Make changes
5. Submit pull request

---

## 📄 License

MIT

---

**Last Updated:** 2025-12-21  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
