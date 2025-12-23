# Hostinger Deployment - Quick Reference

## 🚀 Deploy in 5 Steps

### 1. Build (Local)
```bash
./scripts/deploy-hostinger.sh
```

### 2. Upload
Upload `deployment-package-*.zip` to Hostinger

### 3. Setup (Server)
```bash
cd deployment-package
bash setup-production.sh
```

### 4. Configure
Edit `.env` with database credentials

### 5. Access
Login: `superadmin` / `admin123`

## 📝 PM2 Commands
```bash
pm2 status
pm2 logs school-api
pm2 restart school-api
```

## 📚 Full Guide
See [DEPLOYMENT.md](../DEPLOYMENT.md)
