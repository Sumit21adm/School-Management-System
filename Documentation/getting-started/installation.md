# 🚀 Installation & Setup Guide

This guide covers how to set up the School Management System on your local machine.

## Prerequisites

Before starting, ensure you have the following installed:
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/) (for MySQL database)
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)

---

## 📥 Quick Start (Recommended)

We provide platform-specific scripts that handle everything automatically.

### 1. Clone the repository
```bash
git clone https://github.com/Sumit21adm/School-Management-System.git
cd School-Management-System
```

### 2. Run the appropriate script for your OS

**Mac:**
```bash
./run-mac.sh
```

**Linux:**
```bash
./run-linux.sh
```

**Windows:**
Double-click `run-windows.bat`

The script will:
- ✅ Check Docker and Node.js installation
- ✅ Start MySQL in a Docker container
- ✅ Install all dependencies
- ✅ Configure environment automatically
- ✅ Run database migrations
- ✅ Start API (port 3001) and Frontend (port 5173)
- ✅ Open your browser to the app

---

## 🛠️ Manual Installation

If you prefer manual control, follow these steps.

### Step 1: Start MySQL (using Docker)
```bash
docker run -d \
  --name school-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=school_management \
  -e MYSQL_USER=school_user \
  -e MYSQL_PASSWORD=school_pass \
  -p 3306:3306 \
  mysql:8.0
```

### Step 2: Backend Setup
```bash
cd school-management-api
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL="mysql://school_user:school_pass@localhost:3306/school_management"
JWT_SECRET="dev-jwt-secret-change-in-production"
PORT=3001
EOF

# Run migrations
npx prisma db push

# Start server
npm run start:dev
```
*Server runs on: http://localhost:3001*

### Step 3: Frontend Setup
```bash
cd school-management-system
npm install
npm run dev
```
*App runs on: http://localhost:5173*

---

## 🌱 Seed Sample Data (Optional)

To populate the database with sample data:
```bash
cd school-management-api
npm run seed
```

This creates:
- Admin user (admin / admin123)
- 12 Fee types
- 1 Academic session
- 30 Sample students
- Fee structures for all classes

---

## ✅ Verification

1. Open http://localhost:5173
2. Login with default credentials:
   - **Username:** `admin`
   - **Password:** `admin123`

---

## 🛑 Stopping the Application

- Press `Ctrl+C` in the terminal running the script
- MySQL container keeps running for next time
- To stop MySQL: `docker stop school-mysql-hybrid`
- To remove MySQL data: `docker rm school-mysql-hybrid && docker volume rm school_mysql_data`
