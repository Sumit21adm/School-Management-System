#!/bin/bash
# ============================================
# School Management System - Release Runner
# ============================================
# This script runs the pre-built application
# with ZERO dependencies (except Node.js)
# ============================================

set -e

echo ""
echo " ========================================"
echo "  School Management System (Release)"
echo " ========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
LOGS_DIR="$SCRIPT_DIR/logs"

# Create logs directory if not exists
mkdir -p "$LOGS_DIR"

# ============================================
# Check Prerequisites
# ============================================

# Check Node.js
if ! command -v node &> /dev/null; then
    echo " [!] Node.js is not installed."
    echo ""
    echo " Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
fi
echo " [OK] Node.js $(node -v) detected"
echo ""

# ============================================
# Configure Environment (SQLite)
# ============================================

# Create/update .env file for API
# Using file:./dev.db relative to prisma schema location usually, or absolute?
# Prisma SQLite default is relative to schema file.
cat > "$API_DIR/.env" << EOF
# Database (SQLite)
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="release-jwt-secret-changeme"

# Server
PORT=3001
EOF

echo " [OK] Environment configured"

# ============================================
# Install Dependencies
# ============================================

echo " Installing dependencies (this may take a moment)..."

echo "   Backend..."
cd "$API_DIR"
npm install --omit=dev --no-audit

echo "   Frontend..."
cd "$FRONTEND_DIR"
npm install --omit=dev --no-audit

echo " [OK] Dependencies ready"
echo ""

# ============================================
# Run Database Migrations
# ============================================

echo " Running database migrations (SQLite)..."
cd "$API_DIR"
# Generate client for SQLite (schema is already converted in build step)
npx prisma generate
# Push schema to create dev.db
npx prisma db push --accept-data-loss
# Seed data
npx prisma db seed || echo " [WARN] Seeding skipped"

echo " [OK] Database ready"
echo ""

# ============================================
# Start Application
# ============================================

# Start API
echo " Starting API server..."
cd "$API_DIR"
nohup node dist/src/main > "$LOGS_DIR/api.log" 2>&1 &
API_PID=$!

# Start Frontend
echo " Starting Frontend..."
cd "$FRONTEND_DIR"
nohup node server.js > "$LOGS_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait for startup
echo " Waiting for services to start..."
sleep 5

if ! kill -0 $API_PID 2>/dev/null; then
    echo " [!] API failed to start. Check logs/api.log"
    echo " --- API Log Output ---"
    tail -n 20 "$LOGS_DIR/api.log"
    echo " ----------------------"
    exit 1
fi

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo " [!] Frontend failed to start. Check logs/frontend.log"
    exit 1
fi

echo ""
echo " ========================================"
echo "  Application Started!"
echo " ========================================"
echo ""
echo "  Frontend: http://localhost:3000"
echo "  API:      http://localhost:3001/api"
echo ""
echo "  PIDs:     API=$API_PID, Frontend=$FRONTEND_PID"
echo ""

open "http://localhost:3000"

echo " [INFO] Use 'ctrl+c' or close this window to stop (processes may linger)."
echo "        To kill all: kill $API_PID $FRONTEND_PID"
echo ""

# Keep script running
wait
