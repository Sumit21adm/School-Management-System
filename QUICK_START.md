# Quick Start Guide - School Management System

## 🚀 Three Ways to Run

### 1️⃣ **Fastest Way** - One Command (Recommended for First Time)
```bash
cd "/Users/sumitadm21/Downloads/GitHub-Sumit21adm/Antigravity SMS"
./launch-school-app.sh
```
This will:
- ✅ Check MySQL and start if needed
- ✅ Install all dependencies
- ✅ Setup database
- ✅ Start frontend and backend
- ✅ Open browser automatically

---

### 2️⃣ **Docker Way** - Production Ready
```bash
cd "/Users/sumitadm21/Downloads/GitHub-Sumit21adm/Antigravity SMS"
docker-compose up -d
```
Access at: http://localhost:5173

Stop: `docker-compose down`

---

### 3️⃣ **Manual Way** - Full Control

#### Step 1: Start MySQL
```bash
brew services start mysql
```

#### Step 2: Backend (Terminal 1)
```bash
cd "/Users/sumitadm21/Downloads/GitHub-Sumit21adm/Antigravity SMS/school-management-api"

# First time setup
npm install
npx prisma generate

# Start server
npm run start:dev
```

#### Step 3: Frontend (Terminal 2)
```bash
cd "/Users/sumitadm21/Downloads/GitHub-Sumit21adm/Antigravity SMS/school-management-system"

# First time setup
npm install

# Start app
npm run dev
```

---

## 🔐 Login Credentials

```
Username: admin
Password: admin123
```

---

## 🌐 URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Database:** localhost:3306

---

## 📱 What You Can Do

### Admissions
1. Click "Admissions" in sidebar
2. Click "New Admission" button
3. Fill student details
4. Save

### Fee Collection
1. Click "Fee Collection"
2. Enter Student ID
3. Select fee type
4. Enter amount
5. Choose payment mode
6. Collect Fee

### View Reports
1. Click "Fee Collection" → "Reports"
2. Select date range
3. View transactions
4. Export to Excel

### All Modules Work:
- ✅ **Admissions:** Enhanced form with Religion, Guardian details, Govt IDs, and Academic History.
- ✅ **Fees:** Multi-head collection, Monthly/Yearly frequency support, Demand Bills with editable tuition fee.
- ✅ **Exams:** Class-wise scheduling and marks entry.
- ✅ **Transport:** Route and vehicle management.
- ✅ **Hostel:** Room allocation.
- ✅ **Inventory:** Stock tracking.

---

## 🔧 Configuration

### Change Database Password
Edit: `school-management-api/.env`
```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/school_management"
```

### Change API URL
Edit: `school-management-system/.env`
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 🛑 Stop Services

### If using launcher script:
```bash
pkill -f 'nest start'
pkill -f 'vite'
```

### If using Docker:
```bash
docker-compose down
```

### If manual:
Press `Ctrl+C` in both terminal windows

---

## ❌ Troubleshooting

### Port Already in Use
```bash
# Kill processes on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill processes on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### MySQL Won't Start
```bash
brew services restart mysql
```

### Can't Connect to Database
1. Check MySQL is running: `brew services list | grep mysql`
2. Check credentials in `.env` file
3. Create database: `mysql -u root -p -e "CREATE DATABASE school_management;"`

### Frontend Shows Blank Page
1. Check browser console (F12)
2. Make sure backend is running on port 3001
3. Clear browser cache

---

## 📊 Project Size

- **Frontend:** ~260 packages, ~80MB
- **Backend:** ~800 packages, ~200MB
- **Total:** ~280MB

---

## 🎯 First Time Checklist

- [ ] MySQL installed and running
- [ ] Node.js 20+ installed
- [ ] Run launcher script OR Docker
- [ ] Open http://localhost:5173
- [ ] Login with admin/admin123
- [ ] Test creating a student
- [ ] Test collecting a fee

---

## 📞 Need Help?

Check these files:
- `README.md` - Full documentation
- `DEVELOPMENT_SUMMARY.md` - What was built
- Browser console (F12) for errors

---

## 🎉 You're All Set!

Your modern school management system is ready to use! 🚀
