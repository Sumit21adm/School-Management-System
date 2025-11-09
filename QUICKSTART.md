# Quick Start Guide - School Management System

Get up and running in 5 minutes!

## 🚀 One-Command Setup

```bash
git clone https://github.com/Sumit21adm/School-Management-System.git
cd School-Management-System
chmod +x setup.sh
./setup.sh
```

That's it! The script will:
- ✅ Install all dependencies
- ✅ Start MySQL database (if Docker available)
- ✅ Generate Prisma client
- ✅ Create database schema
- ✅ Seed with demo data

## 🎯 Access the Application

### Start the Applications

**Option 1: Run both together**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 - Backend:
```bash
cd apps/api
npm run start:dev
```

Terminal 2 - Frontend:
```bash
cd apps/web
npm run dev
```

### Open in Browser

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/v1
- **phpMyAdmin** (if Docker): http://localhost:8080

## 🔐 Demo Credentials

```
Email: admin@school.com
Password: admin123
```

## 📊 What's Included

### Pre-loaded Demo Data
- ✅ Demo School tenant
- ✅ Admin user with full permissions
- ✅ 10 classes (Grade 1-10)
- ✅ 3 sections for Grade 1
- ✅ 6 subjects (Math, English, Science, etc.)
- ✅ 5 fee heads
- ✅ Role-based access control setup

### Available Features
- ✅ User authentication (login/logout)
- ✅ Dashboard with statistics
- ✅ Modern UI with Tailwind CSS
- ✅ Multi-tenant architecture
- ✅ REST API with JWT authentication

## 🔌 API Endpoints

All endpoints require JWT token (except auth endpoints):

### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/register
```

### Students
```
GET /api/v1/students
GET /api/v1/students/stats
GET /api/v1/students/:id
```

### Classes
```
GET /api/v1/classes
GET /api/v1/classes/subjects
GET /api/v1/classes/:id
```

### Example API Call

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}'

# Get students (use token from login response)
curl http://localhost:3001/api/v1/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🛠️ Common Tasks

### Reset Database
```bash
cd apps/api
npx prisma db push --force-reset
npm run prisma:seed
```

### View Database
- **phpMyAdmin**: http://localhost:8080
  - Server: mysql
  - Username: root
  - Password: password

### Check Database Schema
```bash
cd apps/api
npx prisma studio
```
Opens Prisma Studio at http://localhost:5555

### Generate New Prisma Types
```bash
cd apps/api
npx prisma generate
```

### Build for Production
```bash
# Build backend
cd apps/api
npm run build

# Build frontend
cd apps/web
npm run build
```

## 📚 Next Steps

1. **Explore the Dashboard**: Navigate through the UI
2. **Test the API**: Use the endpoints with Postman or curl
3. **Read the Docs**: Check README.md for detailed information
4. **Contribute**: See CONTRIBUTING.md to add features
5. **Deploy**: Follow DEPLOYMENT.md for hosting options

## ❓ Troubleshooting

### Database Connection Error
```bash
# Check if MySQL is running
docker ps

# Restart containers
docker-compose restart
```

### Port Already in Use
```bash
# Frontend (5173)
lsof -ti:5173 | xargs kill -9

# Backend (3001)
lsof -ti:3001 | xargs kill -9
```

### Prisma Client Not Generated
```bash
cd apps/api
npx prisma generate
```

### Node Modules Issues
```bash
# Clean install
rm -rf node_modules apps/*/node_modules
npm install
cd apps/web && npm install
cd ../api && npm install
```

## 🆘 Need Help?

- 📖 **Documentation**: Check README.md
- 🐛 **Issues**: https://github.com/Sumit21adm/School-Management-System/issues
- 💬 **Discussions**: https://github.com/Sumit21adm/School-Management-System/discussions

## ✅ Verify Everything Works

Run this checklist:

```bash
# 1. Backend builds
cd apps/api && npm run build

# 2. Frontend builds
cd ../web && npm run build

# 3. Database connection
cd ../api && npx prisma db pull

# 4. Tests pass (when available)
npm run test
```

## 🎉 You're Ready!

Start building amazing features on this solid foundation!

---

**Made with ❤️ for educational institutions**
