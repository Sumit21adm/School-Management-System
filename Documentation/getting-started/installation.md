# 🚀 Installation & Setup Guide

This guide covers how to set up the School Management System on your local machine for development or production.

## Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/)
- **npm** (comes with Node.js) or **yarn**

---

## 📥 Option 1: Automated Setup (Mac/Linux)

We provide a script to automate the entire setup process.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sumit21adm/School-Management-System.git
   cd School-Management-System
   ```

2. **Run the setup script:**
   ```bash
   ./setup-and-run.sh
   ```

   This script will:
   - Check for prerequisites
   - Install backend & frontend dependencies
   - Configure default `.env` files
   - Run database migrations
   - Start both servers

---

## 🛠️ Option 2: Manual Installation

If you prefer manual control or are on Windows, follow these steps.

### Step 1: Database Setup
1. Start your MySQL server.
2. Create a new database:
   ```sql
   CREATE DATABASE school_management;
   ```

### Step 2: Backend Setup
1. Navigate to the API directory:
   ```bash
   cd school-management-api
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment:
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your MySQL credentials:
     ```env
     DATABASE_URL="mysql://root:password@localhost:3306/school_management"
     ```
4. Run Migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start Server:
   ```bash
   npm run start:dev
   ```
   *Server runs on: http://localhost:3001*

### Step 3: Frontend Setup
1. Open a new terminal and navigate to the system directory:
   ```bash
   cd school-management-system
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment:
   - Create `.env` file:
     ```env
     VITE_API_URL=http://localhost:3001
     ```
4. Start Application:
   ```bash
   npm run dev
   ```
   *App runs on: http://localhost:5173*

---

## 🐳 Option 3: Docker Setup (Recommended for Production)

1. Ensure Docker Desktop is running.
2. Run the compose command:
   ```bash
   docker-compose up -d
   ```
   This spins up the Database, Backend, and Frontend containers automatically.

---

## ✅ Verification
- Open http://localhost:5173 to see the login page.
- Login with default credentials:
  - **Username:** `admin`
  - **Password:** `admin123`
