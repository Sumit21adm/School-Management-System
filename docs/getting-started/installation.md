# 🚀 Installation & Setup Guide

This guide covers how to set up the School Management System on your local machine.

## Prerequisites

Before starting, ensure you have the following installed:

| Requirement | Version | Installation |
|-------------|---------|--------------|
| **Node.js** | v18+ | [Download](https://nodejs.org/) |
| **MySQL** | 8.0+ | macOS: `brew install mysql` / [Download](https://dev.mysql.com/downloads/) |

---

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/Sumit21adm/School-Management-System.git
cd School-Management-System

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start MySQL (macOS with Homebrew)
brew services start mysql

# Create database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS school_management;"

# Push schema and seed data
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🔧 Environment Configuration

Edit `.env` with your database credentials:

```env
# Database (MySQL)
# For local development with no root password:
DATABASE_URL="mysql://root@127.0.0.1:3306/school_management"

# If your MySQL root has a password:
# DATABASE_URL="mysql://root:YOUR_PASSWORD@127.0.0.1:3306/school_management"

# NextAuth
NEXTAUTH_SECRET="dev-nextauth-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# JWT (for API routes)
JWT_SECRET="dev-jwt-secret-change-in-production"
```

### Common Database URL Formats

| Scenario | DATABASE_URL |
|----------|--------------|
| No password (typical fresh install) | `mysql://root@127.0.0.1:3306/school_management` |
| With password | `mysql://root:mypassword@127.0.0.1:3306/school_management` |
| Custom user | `mysql://school_user:school_pass@127.0.0.1:3306/school_management` |

---

## 🌱 Database Setup

### Create Database

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS school_management;"
```

### Push Schema (creates tables)

```bash
npx prisma db push
```

### Seed Data (creates admin user + initial data)

```bash
npx prisma db seed
```

This creates:
- ✅ 1 Super Admin user (`superadmin` / `admin123`)
- ✅ 12 Fee types
- ✅ 8 Subjects
- ✅ 15 Classes
- ✅ 2 Academic sessions

---

## ✅ Verify Installation

1. Open [http://localhost:3000](http://localhost:3000)
2. Login with default credentials:

| Field | Value |
|-------|-------|
| **Username** | `superadmin` |
| **Password** | `admin123` |

---

## 🔄 Running After Initial Setup

For subsequent runs, you only need to:

```bash
# Start MySQL (if not already running)
brew services start mysql

# Start dev server
npm run dev
```

If you get "Can't reach database server" errors:
1. Ensure MySQL is running: `brew services list`
2. Check your `.env` has the correct port (usually `3306`)
3. Regenerate Prisma client if needed: `npx prisma generate`

---

## 🛑 Troubleshooting

### "Can't reach database server at port 3307"

Your MySQL is likely running on the default port `3306`, not `3307`. Update your `.env`:

```env
DATABASE_URL="mysql://root@127.0.0.1:3306/school_management"
```

### "Authentication failed for root"

Your MySQL root user may have no password. Try:

```env
DATABASE_URL="mysql://root@127.0.0.1:3306/school_management"
```

### "Invalid username or password" when logging in

The database may not be seeded. Run:

```bash
npx prisma db seed
```

Then restart the dev server:

```bash
# Stop current server (Ctrl+C) then:
npx prisma generate
npm run dev
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npx prisma db push` | Push schema to database |
| `npx prisma db seed` | Seed initial data |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma studio` | Open database GUI |
