# Admin Portal

Vendor/Admin Portal for managing the School Management SaaS platform.

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma 5.x
- **Database**: MySQL
- **Auth**: JWT + Passport
- **Payments**: Razorpay + Stripe

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update values:
```bash
cp .env.example .env
```

### 3. Setup Database
```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed default data
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run start:dev
```

The API will be available at `http://localhost:3002/admin/api`

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@schoolsaas.com | admin123 |

## API Modules

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/admin/api/auth` | Login, profile |
| Organizations | `/admin/api/organizations` | School/tenant management |
| Plans | `/admin/api/plans` | Subscription plans |
| Subscriptions | `/admin/api/subscriptions` | Active subscriptions |
| Invoices | `/admin/api/invoices` | Billing & invoices |
| Payments | `/admin/api/payments` | Razorpay & Stripe |
| Analytics | `/admin/api/analytics` | Dashboard stats |

## Scripts

```bash
npm run build         # Build for production
npm run start:dev     # Development with hot reload
npm run start:prod    # Run production build
npm run prisma:studio # Open Prisma Studio
```
