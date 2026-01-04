# 🔐 Authentication Feature

The system uses industry-standard JWT (JSON Web Token) authentication to secure API endpoints and manage user sessions.

## Architecture

1. **Login Flow**
   - User sends `username` and `password` to `/auth/login`.
   - Backend validates credentials against `User` table (passwords hashed with `bcrypt`).
   - If valid, returns a **JWT Access Token**.

2. **Route Protection (Backend)**
   - **`JwtAuthGuard`**: A NestJS Guard that intercepts requests.
   - Validates the `Authorization: Bearer <token>` header.
   - Extracts user data and attaches it to the request object.
   - If invalid/expired, returns `401 Unauthorized`.

3. **Session Management (Frontend)**
   - Token is stored in `localStorage` (or `httpOnly` cookie).
   - Axios interceptor attaches the token to every outgoing API request.
   - **Auto Logout**: If API returns 401, frontend clears state and redirects to Login.

## Roles & Permissions
*(Current Status: Basic Role Implementation)*
- **Admin**: Full access.
- **Staff**: Limited access (configurable via code logic).

## Key Files
- `auth.service.ts`: Login logic and Token generation.
- `jwt.strategy.ts`: Passport strategy for validating tokens.
