# School Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)
![Lines of Code](https://img.shields.io/badge/lines_of_code-~17k-blueviolet)
![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)


A modern, offline-first School Management System built with **React, NestJS, and MySQL**. Designed for seamless operation with robust fee management, admission tracking, and comprehensive reporting.

---

## 🚀 Quick Start Guide

Get the application running in minutes!

### Prerequisites
- **Node.js**: v20 or higher
- **MySQL**: v8.0 or higher
- **Git**

### ⚡ Option 1: Automated Setup (Recommended for Mac/Linux)
Run our one-step setup script which handles dependencies, database migrations, and starts the servers.

```bash
# 1. Clone the repository
git clone <repository_url>
cd School-Management-System

# 2. Run the launcher
./setup-and-run.sh
```
*The script will automatically check environment requirements, install packages, and launch the app.*

### 🐳 Option 2: Docker (Production Ready)
If you have Docker installed, you can spin up the entire stack (Database + API + Frontend) instantly.

```bash
docker-compose up -d
```
Access the app at: `http://localhost:5173`

### 🛠️ Option 3: Manual Setup
If you prefer full control:

**Backend:**
```bash
cd school-management-api
npm install
# Configure .env (see documentation)
npx prisma migrate dev
npm run start:dev
```

**Frontend:**
```bash
cd school-management-system
npm install
npm run dev
```

---

## 🔐 Default Login Credentials
- **Username:** `admin`
- **Password:** `admin123`

---

## 📚 Documentation
We have organized the documentation into detailed sections for easier navigation:

- **[📂 Full Documentation Index](./documentation/README.md)**
- **[🎓 Admissions Module](./documentation/modules/admissions.md)**
- **[💰 Fee Management](./documentation/modules/fees.md)**
- **[📝 Examination Analysis](./documentation/modules/examination.md)**
- **[✨ Offline Features](./documentation/features/offline-mode.md)**
- **[🛠️ Installation & Config](./documentation/getting-started/installation.md)**

---

## ✨ Key Features

### Core Functionality
- **Offline-First**: Works without an internet connection using IndexedDB. Syncs automatically when online.
- **Local Network Access**: Optimized to work on mobile devices connected to the same WiFi.
- **PDF Generation**: Professional receipts, demand bills, and report cards.

### Modules Overview
- **Student Admissions**: Complete registration flow with photo cropping and document management.
- **Fee Management**: Flexible fee structures, partial payments, multiple fee heads, and demand bill generation.
- **Examination**: Exam scheduling, marks entry, and automated grading.


---

## 🛠️ Technology Stack

| Frontend | Backend | Database |
|----------|---------|----------|
| React 19 | NestJS 11 | MySQL 8 |
| TypeScript | Prisma ORM | IndexedDB (Offline) |
| Material UI | JWT Auth | Redis (Optional) |
| Vite | PDFKit | Docker |

---

## 🤝 Support
For detailed development guides, API references, and business logic explanations, please refer to the **[Documentation Directory](./documentation/README.md)**.
