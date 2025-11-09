# School Management System

A comprehensive, multi-tenant School Management System (SMS) built with React, NestJS, Prisma, and MySQL. This system provides end-to-end solutions for K-12 and college institutions.

## 🚀 Features

### Core Modules
- **Authentication & Authorization**: JWT-based auth with RBAC/ABAC
- **Student Management**: Admissions, profiles, guardians, transfers
- **Teacher/Staff Management**: Employee records, departments, designations
- **Attendance**: Daily/period-wise tracking for students and staff
- **Academic Structure**: Classes, sections, subjects, academic years
- **Timetable**: Automated scheduling with conflict detection
- **Exams & Grading**: Exam management, marks entry, report cards
- **Fees & Payments**: Fee plans, invoicing, online payments (Razorpay/Stripe)
- **Announcements**: Targeted communications to students/parents/staff
- **Audit Logging**: Complete audit trail for sensitive operations

### Coming Soon
- Library Management
- Transport Management
- Hostel Management
- Online Exams
- Reports & Analytics
- Parent Portal
- SMS/Email Notifications

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Zustand** for state management
- **React Hook Form + Zod** for forms and validation

### Backend
- **NestJS** (Node.js framework)
- **Prisma ORM** for database management
- **MySQL 8+** / MariaDB 10.6+
- **JWT** for authentication
- **bcrypt** for password hashing

### Infrastructure
- **Turborepo** for monorepo management
- **Docker** for MySQL and phpMyAdmin
- **GitHub Actions** for CI/CD (planned)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18+ (recommended: 20+)
- **npm** 8+ or **pnpm** 8+
- **Docker** and **Docker Compose** (for local database)
- **Git**

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Sumit21adm/School-Management-System.git
cd School-Management-System
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd apps/web
npm install

# Install backend dependencies
cd ../api
npm install
```

### 3. Set Up Database

Start MySQL and phpMyAdmin using Docker:

```bash
# From the root directory
docker-compose up -d
```

This will start:
- MySQL on port 3306
- phpMyAdmin on http://localhost:8080

**phpMyAdmin Access:**
- URL: http://localhost:8080
- Server: mysql
- Username: root
- Password: password

### 4. Configure Environment Variables

The backend `.env` file is already configured for local development:

```env
# apps/api/.env
DATABASE_URL="mysql://root:password@localhost:3306/school_management"
JWT_SECRET="development-secret-key-please-change-in-production"
JWT_EXPIRATION="7d"
PORT=3001
NODE_ENV=development
```

**⚠️ Important:** Change `JWT_SECRET` in production!

### 5. Run Database Migrations

```bash
cd apps/api
npx prisma generate
npx prisma db push
```

This will:
- Generate Prisma Client
- Create all database tables based on the schema

### 6. Seed Initial Data (Optional)

Create a seed script to populate initial data:

```bash
cd apps/api
npx prisma db seed
```

## 🚀 Running the Application

### Development Mode

You can run both frontend and backend simultaneously or separately:

#### Option 1: Run Everything Together (from root)

```bash
npm run dev
```

#### Option 2: Run Separately

**Terminal 1 - Backend (API):**
```bash
cd apps/api
npm run start:dev
```
API will be available at: http://localhost:3001/api/v1

**Terminal 2 - Frontend (Web):**
```bash
cd apps/web
npm run dev
```
Frontend will be available at: http://localhost:5173

### Production Build

```bash
# Build all apps
npm run build

# Run production backend
cd apps/api
npm run start:prod

# Serve production frontend (requires a static server)
cd apps/web
npm run preview
```

## 🔑 Default Credentials

For testing purposes, use these credentials:

```
Email: admin@school.com
Password: admin123
```

**Note:** You'll need to manually create this user in the database or create a seed script.

## 📁 Project Structure

```
School-Management-System/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   ├── src/
│   │   │   ├── auth/           # Authentication module
│   │   │   ├── prisma/         # Prisma service
│   │   │   ├── common/         # Shared utilities
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── web/                    # React Frontend
│       ├── src/
│       │   ├── pages/          # Page components
│       │   ├── components/     # Reusable components
│       │   ├── services/       # API services
│       │   ├── hooks/          # Custom hooks
│       │   ├── lib/            # Utility functions
│       │   ├── types/          # TypeScript types
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── package.json
│
├── packages/                   # Shared packages (future)
│   ├── ui/                     # Shared UI components
│   └── types/                  # Shared TypeScript types
│
├── docker-compose.yml          # Local database setup
├── turbo.json                  # Turborepo configuration
├── package.json                # Root package.json
└── README.md
```

## 🗄️ Database Schema

The system uses a comprehensive database schema with:
- **Multi-tenancy**: Row-level isolation with `tenantId`
- **RBAC**: Role-Based Access Control
- **Audit Logging**: Complete audit trail
- **Academic Structure**: Year, Class, Section, Subject
- **People**: Students, Guardians, Staff
- **Attendance**: Student and teacher tracking
- **Exams**: Exams, papers, marks, grades
- **Fees**: Plans, invoices, payments
- **Communications**: Announcements

View the complete schema in `apps/api/prisma/schema.prisma`

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- SQL injection prevention (Prisma ORM)
- Role-based access control (RBAC)
- Audit logging for sensitive operations

## 📚 API Documentation

Once the backend is running, API documentation will be available at:
- Swagger UI: http://localhost:3001/api/v1/docs (Coming soon)

### Key Endpoints:

```
POST   /api/v1/auth/login       - User login
POST   /api/v1/auth/register    - User registration
GET    /api/v1/                 - Health check
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests for specific app
cd apps/api
npm run test

cd apps/web
npm run test
```

## 🚢 Deployment

### Shared Hosting (cPanel with Node.js)

1. Build the applications
2. Upload backend to cPanel Node.js app
3. Upload frontend build to public_html
4. Configure MySQL database via phpMyAdmin
5. Set up environment variables in cPanel

### VPS/Cloud (Docker)

1. Build Docker images
2. Deploy using Docker Compose or Kubernetes
3. Configure environment variables
4. Set up SSL certificates
5. Configure reverse proxy (Nginx)

Detailed deployment guides coming soon!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@schoolms.com or create an issue in the repository.

## 🗺️ Roadmap

See the [Project Description.txt](Project%20Description.txt) for the complete feature roadmap and sprint plans.

### Phase 0 - Foundation ✅ (Current)
- [x] Project setup with Turborepo
- [x] React frontend with Vite and Tailwind
- [x] NestJS backend with Prisma
- [x] MySQL database schema
- [x] Authentication (JWT)
- [x] Basic dashboard UI
- [ ] RBAC implementation
- [ ] Audit logging

### Phase 1 - Core Features (In Progress)
- [ ] Student management
- [ ] Attendance tracking
- [ ] Fee management
- [ ] Announcements
- [ ] Academic structure (completed models)

### Phase 2 - Advanced Features
- [ ] Exam management
- [ ] Timetable builder
- [ ] Report cards
- [ ] Parent portal

### Phase 3 - Additional Modules
- [ ] Library management
- [ ] Transport management
- [ ] Hostel management
- [ ] Online exams

## 🙏 Acknowledgments

- Built following the comprehensive [Project Description](Project%20Description.txt)
- Inspired by modern SaaS architectures
- Community feedback and contributions

---

**Built with ❤️ for educational institutions worldwide**
