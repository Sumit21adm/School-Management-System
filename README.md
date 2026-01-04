# 🏫 School Management System

A modern, full-featured school management application built with **Next.js 16**, **Prisma**, and **Material UI**.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://www.prisma.io/)
[![MUI](https://img.shields.io/badge/MUI-7-007FFF?logo=mui)](https://mui.com/)

## ✨ Features

- **Admissions Management** - Student enrollment and registration
- **Fee Management** - Fee structure, collection, and reporting
- **Examination System** - Exam scheduling, marks entry, and results
- **Academic Sessions** - Session and promotion management
- **Role-Based Access** - Admin, Accountant, Coordinator, Teacher roles
- **Offline Capability** - Works without constant internet connection
- **PDF Generation** - Receipts, reports, and documents

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Initialize database
npx prisma migrate dev

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 📁 Project Structure

| Directory | Description |
|-----------|-------------|
| `src/` | Application source code (Next.js App Router) |
| `prisma/` | Database schema and migrations |
| `public/` | Static assets |
| `docs/` | [Comprehensive documentation](./docs/README.md) |
| `scripts/` | Utility and deployment scripts |
| `deprecated/` | Legacy application (preserved for reference) |

## 📚 Documentation

Full documentation is available in the [`docs/`](./docs/README.md) folder:

- [Getting Started](./docs/getting-started/README.md) - Installation & setup
- [Modules](./docs/modules/README.md) - Feature documentation
- [API Docs](./docs/api-docs.md) - API reference
- [Database Schema](./docs/database-schema.md) - Data model

## 🛠️ Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🚢 Deployment

See deployment scripts in `scripts/`:
- `deploy-hostinger.sh` - Deploy to Hostinger
- `setup-production.sh` - Production setup

## 📄 License

Private - All rights reserved.

---

*Built with ❤️ using Next.js*
