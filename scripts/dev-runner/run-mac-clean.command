#!/bin/bash
# ============================================
# School Management System - Clean Runner
# ============================================
# MySQL runs in Docker, App runs with npm/node
# Resets Database to CLEAN state (Minimal Seed)
# ============================================

set -e

echo ""
echo " ========================================"
echo "  School Management System (CLEAN MODE)"
echo "  Resets DB & Starts App"
echo " ========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
API_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
LOGS_DIR="$PROJECT_DIR/logs"

# Create logs directory if not exists
mkdir -p "$LOGS_DIR"

# ============================================
# Check Prerequisites
# ============================================

# Check Docker
if ! command -v docker &> /dev/null; then
    echo " [!] Docker is not installed."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null 2>&1; then
    echo " [!] Docker is not running. Starting Docker Desktop..."
    open -a Docker
    while ! docker info &> /dev/null 2>&1; do
        sleep 3
    done
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo " [!] Node.js is not installed."
    exit 1
fi

# ============================================
# Start MySQL in Docker
# ============================================

MYSQL_CONTAINER="school-mysql-hybrid"
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD="rootpassword"
MYSQL_DATABASE="school_management"
MYSQL_USER="school_user"
MYSQL_PASSWORD="school_pass"

# Check if MySQL container exists
if docker ps -a --format '{{.Names}}' | grep -q "^${MYSQL_CONTAINER}$"; then
    if docker ps --format '{{.Names}}' | grep -q "^${MYSQL_CONTAINER}$"; then
        echo " [OK] MySQL container running"
    else
        echo " Starting MySQL container..."
        docker start "$MYSQL_CONTAINER"
    fi
else
    echo " Creating MySQL container..."
    docker run -d \
        --name "$MYSQL_CONTAINER" \
        -e MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
        -e MYSQL_DATABASE="$MYSQL_DATABASE" \
        -e MYSQL_USER="$MYSQL_USER" \
        -e MYSQL_PASSWORD="$MYSQL_PASSWORD" \
        -p $MYSQL_PORT:3306 \
        -v school_mysql_data:/var/lib/mysql \
        mysql:8.0
fi

# Wait for MySQL
echo " Waiting for MySQL..."
MAX_ATTEMPTS=30
ATTEMPT=0
while ! docker exec "$MYSQL_CONTAINER" mysqladmin ping -h localhost -u root -p"$MYSQL_ROOT_PASSWORD" --silent 2>/dev/null; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
        echo " [!] MySQL failed to start."
        exit 1
    fi
    sleep 2
done
echo " [OK] MySQL is ready"

# ============================================
# Configure Environment
# ============================================

cat > "$API_DIR/.env" << EOF
DATABASE_URL="mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@localhost:${MYSQL_PORT}/${MYSQL_DATABASE}"
JWT_SECRET="dev-jwt-secret-change-in-production"
PORT=3001
EOF

echo "VITE_API_URL=http://localhost:3001" > "$FRONTEND_DIR/.env"

# ============================================
# Database Reset & Seed (CLEAN)
# ============================================

echo " 🧹 Resetting Database to Clean State..."
cd "$API_DIR"
npx prisma generate --schema=prisma/schema.prisma

# Force reset DB and push schema
# This drops data and re-creates tables
if npx prisma db push --force-reset --accept-data-loss; then
    echo "    Database reset successful."
else
    echo "    [!] Database reset failed."
    exit 1
fi

echo " 🌱 Seeding with Minimal Data (Admin Only)..."
# Runs 'ts-node prisma/seed.ts' defined in package.json
if npx prisma db seed; then
    echo "    Seeding successful."
else
    echo "    [!] Seeding failed."
    exit 1
fi

# ============================================
# Start Application
# ============================================

# Start API
echo " Starting API server..."
cd "$API_DIR"
nohup npm run start:dev > "$LOGS_DIR/api.log" 2>&1 &
API_PID=$!

# Start Frontend
echo " Starting Frontend..."
cd "$FRONTEND_DIR"
nohup npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait for startup
echo " Waiting for services..."
sleep 8

# Verify processes
if ! kill -0 $API_PID 2>/dev/null; then
    echo " [!] API failed to start. Check logs/api.log"
    tail -20 "$LOGS_DIR/api.log"
    exit 1
fi

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo " [!] Frontend failed to start. Check logs/frontend.log"
    tail -20 "$LOGS_DIR/frontend.log"
    exit 1
fi

echo ""
echo " ========================================"
echo "  CLEAN APP STARTED!"
echo "  Admin User: superadmin / password123"
echo " ========================================"
echo "  Frontend: http://localhost:5173"
echo "  API:      http://localhost:3001"
echo ""

# Open browser
open "http://localhost:5173"

exit 0
