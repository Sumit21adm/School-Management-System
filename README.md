# School Management System

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status: Active](https://img.shields.io/badge/Status-Active-success.svg)
![Node: 18+](https://img.shields.io/badge/Node-18%2B-green.svg)

A comprehensive, full-stack School Management System (ERP) designed for K-12 educational institutions. Built with modern web technologies, it offers a seamless experience for administrators, teachers, and staff.

## 🚀 Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React 18 | TypeScript, Vite, Material UI, Tailwind CSS |
| **Backend** | NestJS | TypeScript, Modular Architecture |
| **Database** | MySQL 8.0 | Prisma ORM, Dockerized |
| **Auth** | JWT | Secure Role-Based Access Control (RBAC) |

## ✨ Key Features

- 📝 **Admissions**: Streamlined student registration with photo upload & bulk import.
- 💰 **Fee Management**: Complete financial module for collection, receipts, and demand bills.
- 📊 **Analytics & Reports**: Real-time dashboards for daily collection, dues, and analysis.
- 🎓 **Academics**: Exam scheduling, subject management, and grade tracking.
- 👥 **User Management**: Granular RBAC for Admins, Accountants, and Teachers.
- 📅 **Session Management**: Support for multiple academic years.
- 🖨️ **PDF Generation**: Auto-generate professional fee receipts and reports.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v18 or higher)
- **[Docker Desktop](https://www.docker.com/products/docker-desktop)** (Required for the database)

## ⚡ Quick Start

We have automated the entire setup process. You don't need to manually configure the database or install dependencies.

### 🍎 Mac / 🐧 Linux

1.  Open your terminal.
2.  Run the setup script:
    ```bash
    ./scripts/run-mac.command
    ```
    *Note: You may need to grant permission execution first with `chmod +x scripts/run-mac.command`*

### 🪟 Windows

1.  Navigate to the project folder.
2.  Double-click **`scripts\run-windows.bat`** (or run it from CMD).

---

### What happens next?
The script will automatically:
1.  🚀 Start Docker (if not running).
2.  🐳 Spin up a MySQL container.
3.  📦 Install all dependencies (Frontend & Backend).
4.  🔄 Run database migrations and seed default data.
5.  🌐 Launch the **API** (Port 3001) and **Frontend** (Port 5173).

## 📂 Project Structure

```bash
School-Management-System/
├── backend/                # NestJS API Application
│   ├── src/                # Business logic & Modules
│   └── prisma/             # Database Schema & Seeds
│
├── frontend/               # React + Vite Application
│   └── src/                # UI Components & Pages
│
├── scripts/                # Automation Scripts (Run/Setup)
│   ├── run-mac.command     # Mac/Linux Launcher
│   └── run-windows.bat     # Windows Launcher
│
└── SCHOOL_MANAGEMENT_SYSTEM_BLUEPRINT.md  # Detailed Architecture Docs
```

## 🔐 Default Credentials

- **Username**: `superadmin`
- **Password**: `admin123`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ by Sumit21adm*
