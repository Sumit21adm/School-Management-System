# 🌍 Environment Configuration

The application relies on environment variables for configuration. Below are the required variables for both frontend and backend.

## Backend (`school-management-api/.env`)

| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `DATABASE_URL` | Connection string for MySQL | `mysql://root:password@localhost:3306/school_management` |
| `JWT_SECRET` | Secret key for signing tokens | `super-secret-key-change-in-prod` |
| `PORT` | API Server Port | `3001` |
| `FRONTEND_URL` | CORS Origin URL | `http://localhost:5173` |

**Note:** The `DATABASE_URL` uses the format: `mysql://USER:PASSWORD@HOST:PORT/DATABASE`

---

## Frontend (`school-management-system/.env`)

| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:3001` |

**Important:** React environment variables created with Vite must start with `VITE_` to be exposed to the client-side code.

---

## Development vs Production

### Development
- Copy `.env.example` (if available) to `.env`.
- The `run-mac.sh` / `run-linux.sh` scripts automatically create default `.env` files if missing.

### Production
- Ensure `JWT_SECRET` is strong and unique.
- `DATABASE_URL` should point to your production database instance.
- `VITE_API_URL` should point to your production domain (e.g., `https://api.schoolname.com`).
