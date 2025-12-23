# Hostinger Cloud Deployment Guide

Complete guide to deploy School Management System on Hostinger Cloud Startup plan.

---

## 📋 Prerequisites

### On Hostinger
- ✅ Cloud Startup plan active
- ✅ MySQL database created in hPanel
- ✅ SSH access enabled
- ✅ Node.js 20.x selected in hPanel

### On Your Computer
- ✅ Git installed
- ✅ Node.js 18+ installed
- ✅ Project cloned locally

---

## 🚀 Quick Deployment

### Step 1: Build Package (Local)
```bash
cd School-Management-System
./scripts/deploy-hostinger.sh
```

### Step 2: Create MySQL Database (Hostinger hPanel)
1. Go to **Databases** → **MySQL Databases**
2. Create database and note credentials

### Step 3: Upload & Extract
Upload `deployment-package-*.zip` to Hostinger and extract

### Step 4: Setup (SSH)
```bash
cd deployment-package
bash setup-production.sh
```

### Step 5: Configure Environment
Edit `.env` with your database credentials

### Step 6: Access
- API: `https://api.yourdomain.com`
- Frontend: `https://yourdomain.com`
- Login: `superadmin` / `admin123`

---

## 🔧 Server Management

```bash
pm2 status              # Check status
pm2 logs school-api     # View logs
pm2 restart school-api  # Restart
pm2 monit               # Monitor
```

---

## 📚 Full Documentation

For complete step-by-step instructions, troubleshooting, and advanced configuration, see the deployment package guide.

---

## ⚠️ Security

- Change default admin password immediately
- Configure SSL in Hostinger hPanel
- Set up regular database backups
- Update CORS_ORIGINS in .env
