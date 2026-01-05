# Hostinger Cloud Deployment Guide
## School Management System (React + NestJS + MySQL)

> **Complete step-by-step guide to deploy your School Management System on Hostinger Cloud with 24/7 uptime.**

---

## 📁 PROJECT STRUCTURE

Your repository structure:

```
School-Management-System/
├── school-management-api/          # NestJS Backend
│   ├── src/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── package.json
│   └── .env
│
└── school-management-system/       # React Frontend (Vite)
    ├── src/
    ├── package.json
    └── .env
```


---

## 🔧 TECH STACK SUMMARY

| Layer | Technology | Deployment Method |
|-------|------------|-------------------|
| **Frontend** | React 18 + TypeScript + Vite | Static files in `public_html` |
| **UI Library** | Material UI (MUI) v7 | Bundled with frontend |
| **State Management** | React Query (TanStack Query) | Bundled with frontend |
| **Backend** | NestJS (Node.js + TypeScript) | Node.js Web App (24/7) |
| **Database** | MySQL with Prisma ORM | Hostinger MySQL Database |
| **Authentication** | JWT (JSON Web Tokens) | Backend handles |
| **PDF Generation** | PDFKit | Backend handles |

---

## 📋 DEPLOYMENT OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                     HOSTINGER CLOUD                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐│
│  │   MySQL DB      │    │  Node.js App    │    │  Static Site ││
│  │                 │◄───│  (NestJS API)   │◄───│  (React)     ││
│  │  Port: 3306     │    │  Port: 3001     │    │  public_html ││
│  └─────────────────┘    └─────────────────┘    └──────────────┘│
│         ▲                       ▲                      ▲        │
│         │                       │                      │        │
│  DB_HOST:3306          api.yourdomain.com      yourdomain.com  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## STEP 1: CREATE MYSQL DATABASE

### 1.1 Create Database in hPanel

1. Go to **hPanel → Websites → Manage → Databases → MySQL Databases**
2. Create a new database:
   - **Database name**: `school_management` (or your choice)
   - **Username**: `school_admin` (or your choice)
   - **Password**: Generate a strong password
3. Click **Create**

### 1.2 Note Your Database Credentials

```
DB_HOST     = mysql.hostinger.com  (or the host shown in hPanel)
DB_PORT     = 3306
DB_NAME     = u123456789_school_management
DB_USER     = u123456789_school_admin
DB_PASSWORD = YourSecurePassword123!
```

> ⚠️ **Note**: Hostinger prefixes your database/user names with your account ID (e.g., `u123456789_`).

---

## STEP 2: PREPARE BACKEND FOR DEPLOYMENT

### 2.1 Backend Package.json Scripts

Your `school-management-api/package.json` already has:

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:prod": "node dist/main",
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### 2.2 Create Production Environment File

Create `.env.production` in `school-management-api/`:

```env
# Database Configuration
DATABASE_URL="mysql://u123456789_school_admin:YourSecurePassword123!@mysql.hostinger.com:3306/u123456789_school_management"

# JWT Configuration
JWT_SECRET="your-very-long-secure-random-string-here-min-32-chars"
JWT_EXPIRES_IN="24h"

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS - Your frontend domain
CORS_ORIGIN="https://yourdomain.com,https://www.yourdomain.com"
```

### 2.3 Update main.ts for CORS

Ensure `src/main.ts` has proper CORS configuration:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for your frontend domain
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['https://yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
```

### 2.4 Prisma Schema Check

Ensure `prisma/schema.prisma` uses the environment variable:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

---

## STEP 3: DEPLOY NESTJS BACKEND

### 3.1 Create Node.js Web App in hPanel

1. Go to **hPanel → Websites → Add Website → Node.js App**
2. Choose deployment method:
   - **GitHub Repository** (Recommended) - Connect your GitHub account
   - **Upload ZIP** - Upload your code manually

### 3.2 Configure Node.js App Settings

| Setting | Value |
|---------|-------|
| **Application root directory** | `school-management-api` |
| **Node.js version** | `20.x` (or `18.x`) |
| **Build command** | See below |
| **Start command** | See below |

#### Build Command (copy exactly):
```bash
npm install && npx prisma generate && npm run build
```

#### Start Command (copy exactly):
```bash
npx prisma migrate deploy && npm run start:prod
```

> **Note**: The first deployment will run migrations. For subsequent deployments, you can use just `npm run start:prod` if no schema changes.

### 3.3 Add Environment Variables

In the Node.js App settings, go to **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `mysql://u123456789_school_admin:YourPassword@mysql.hostinger.com:3306/u123456789_school_management` |
| `JWT_SECRET` | `your-very-long-secure-random-string-here-min-32-chars` |
| `JWT_EXPIRES_IN` | `24h` |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://yourdomain.com,https://www.yourdomain.com` |

### 3.4 Deploy and Verify

1. Click **Deploy** or **Rebuild**
2. Wait for status to show **Running**
3. Test the API at: `https://app-xxxxx.hostingerapp.com/auth/login`
   - Should return 401 or login prompt (means it's working!)

---

## STEP 4: MAP BACKEND TO SUBDOMAIN

### 4.1 Create Subdomain

1. Go to **hPanel → Domains → Subdomains**
2. Create: `api.yourdomain.com`

### 4.2 Point Subdomain to Node.js App

1. In **Node.js App settings**, find **Domain binding** or **Custom domain**
2. Add `api.yourdomain.com` to the app

Or configure via DNS:
1. Go to **hPanel → Domains → DNS Zone**
2. Add a **CNAME** record:
   - **Name**: `api`
   - **Target**: Your Node.js app URL (e.g., `app-xxxxx.hostingerapp.com`)

### 4.3 Enable SSL for API Subdomain

1. Go to **hPanel → SSL**
2. Issue/Install SSL for `api.yourdomain.com`
3. Wait for propagation (usually 5-15 minutes)

Your API is now available at: **`https://api.yourdomain.com`**

---

## STEP 5: SEED THE DATABASE

After the backend is running, you need to create the initial admin user:

### Option A: Via SSH (if available on your plan)

```bash
cd school-management-api
npx prisma db seed
```

### Option B: Run seed in build command (one-time)

Temporarily change your **build command** to:

```bash
npm install && npx prisma generate && npm run build && npx prisma db seed
```

Deploy once, then change it back to:

```bash
npm install && npx prisma generate && npm run build
```

### Default Login Credentials

After seeding:
- **Username**: `superadmin`
- **Password**: `admin123`

---

## STEP 6: PREPARE FRONTEND FOR DEPLOYMENT

### 6.1 Create Production Environment File

Create `.env.production` in `school-management-system/`:

```env
VITE_API_URL=https://api.yourdomain.com
```

### 6.2 Build the Frontend Locally

```bash
cd school-management-system

# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist/` folder with all static files.

### 6.3 Verify the Build

The `dist/` folder should contain:
```
dist/
├── index.html
├── assets/
│   ├── index-xxxxx.js
│   ├── index-xxxxx.css
│   └── ...
└── ...
```

---

## STEP 7: DEPLOY FRONTEND (STATIC FILES)

### 7.1 Upload to public_html

1. Go to **hPanel → Files → File Manager**
2. Navigate to `public_html` folder for your domain
3. **Delete** any default files (index.php, etc.) if present
4. **Upload** all contents of the `dist/` folder:
   - Click **Upload** button
   - Select all files and folders from `dist/`
   - Or upload as ZIP and extract

### 7.2 Verify Frontend

1. Navigate to `https://yourdomain.com`
2. You should see the School Management login page
3. Login with `superadmin` / `admin123`

---

## STEP 8: CONFIGURE MAIN DOMAIN SSL

### 8.1 Enable SSL

1. Go to **hPanel → SSL**
2. Issue/Install SSL for:
   - `yourdomain.com`
   - `www.yourdomain.com`
3. Enable **Force HTTPS** redirect

### 8.2 Configure DNS (if needed)

In **hPanel → Domains → DNS Zone**, ensure:

| Type | Name | Value |
|------|------|-------|
| A | @ | `<Hostinger IP>` |
| A | www | `<Hostinger IP>` |
| CNAME | api | `app-xxxxx.hostingerapp.com` |

---

## 🔄 KEEPING EVERYTHING RUNNING 24/7

### Backend (NestJS)

✅ **Automatically managed by Hostinger**
- The Node.js Web App uses a process manager (like PM2)
- If your app crashes, it automatically restarts
- Logs are available in hPanel for debugging

**To check logs:**
1. Go to **Node.js App → Logs**
2. Look for errors if the app isn't working

### Frontend (React/Vite)

✅ **Always available**
- Static files are served directly by the web server
- No process to "keep alive"
- 100% uptime as long as files are in `public_html`

---

## 🔧 TROUBLESHOOTING

### Backend not starting?

1. Check **Environment Variables** are set correctly
2. Check **Logs** for error messages
3. Common issues:
   - Wrong DATABASE_URL format
   - Database user permissions
   - Port conflict

### Database connection failed?

1. Verify database credentials in hPanel
2. Ensure username has proper permissions
3. Check if Hostinger prefixed your database name

### CORS errors?

1. Update `CORS_ORIGIN` in environment variables
2. Include both `https://yourdomain.com` and `https://www.yourdomain.com`
3. Rebuild the app after changing env vars

### Frontend shows blank page?

1. Check browser console for errors
2. Verify `VITE_API_URL` was set correctly before build
3. Ensure all `dist/` files were uploaded

---

## 📝 QUICK REFERENCE

### URLs After Deployment

| Component | URL |
|-----------|-----|
| **Frontend** | `https://yourdomain.com` |
| **Backend API** | `https://api.yourdomain.com` |
| **Login** | `superadmin` / `admin123` |

### Key Files to Update

| File | Purpose |
|------|---------|
| `school-management-api/.env.production` | Backend environment variables |
| `school-management-system/.env.production` | Frontend API URL |
| `school-management-api/src/main.ts` | CORS configuration |

### Hostinger Panel Locations

| Task | Location |
|------|----------|
| Create MySQL Database | hPanel → Databases → MySQL |
| Create Node.js App | hPanel → Websites → Add Website → Node.js |
| Upload Static Files | hPanel → Files → File Manager |
| Manage SSL | hPanel → SSL |
| Configure DNS | hPanel → Domains → DNS Zone |

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Create MySQL database in hPanel
- [ ] Note database credentials
- [ ] Update backend `.env.production` with DB credentials
- [ ] Update frontend `.env.production` with API URL
- [ ] Test CORS configuration in `main.ts`

### Backend Deployment
- [ ] Create Node.js Web App in hPanel
- [ ] Set application root: `school-management-api`
- [ ] Set build command: `npm install && npx prisma generate && npm run build`
- [ ] Set start command: `npx prisma migrate deploy && npm run start:prod`
- [ ] Add all environment variables
- [ ] Deploy and verify "Running" status
- [ ] Seed database with initial data

### Subdomain Setup
- [ ] Create `api.yourdomain.com` subdomain
- [ ] Point subdomain to Node.js app
- [ ] Enable SSL for subdomain

### Frontend Deployment
- [ ] Build frontend locally: `npm run build`
- [ ] Upload `dist/` contents to `public_html`
- [ ] Enable SSL for main domain
- [ ] Force HTTPS redirect

### Post-Deployment
- [ ] Test login at `https://yourdomain.com`
- [ ] Verify API calls work (no CORS errors)
- [ ] Check fee collection, receipts, etc.
- [ ] Change default admin password!

---

## 📞 HOSTINGER SUPPORT

If you encounter issues specific to Hostinger:
- **Live Chat**: Available 24/7 in hPanel
- **Knowledge Base**: https://support.hostinger.com
- **Node.js App Docs**: Check hPanel help section

---

*Last Updated: January 2026*
