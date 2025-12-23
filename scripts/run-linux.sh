#!/bin/bash
# ============================================
# School Management System - Hybrid Runner (Linux)
# ============================================
# MySQL runs in Docker, App runs with npm/node
# Only requires: Docker + Node.js (no system MySQL)
# ============================================

set -e

echo ""
echo " ========================================"
echo "  School Management System (Hybrid)"
echo "  MySQL: Docker | App: npm/node"
echo " ========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
API_DIR="$PROJECT_DIR/school-management-api"
FRONTEND_DIR="$PROJECT_DIR/school-management-system"
LOGS_DIR="$PROJECT_DIR/logs"

# Create logs directory if not exists
mkdir -p "$LOGS_DIR"

# ============================================
# Check Prerequisites
# ============================================

# Check Docker
if ! command -v docker &> /dev/null; then
    echo " [!] Docker is not installed."
    echo ""
    echo " Install Docker: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null 2>&1; then
    echo " [!] Docker is not running."
    echo " Please start Docker daemon: sudo systemctl start docker"
    exit 1
fi
echo " [OK] Docker is running"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo " [!] Node.js is not installed."
    echo ""
    echo " Install Node.js 18+: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo " [!] Node.js version 18+ required. Current: $(node -v)"
    exit 1
fi
echo " [OK] Node.js $(node -v) detected"
echo ""

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
        echo " [OK] MySQL container already running"
    else
        echo " Starting existing MySQL container..."
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
echo " Waiting for MySQL to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0
while ! docker exec "$MYSQL_CONTAINER" mysqladmin ping -h localhost -u root -p"$MYSQL_ROOT_PASSWORD" --silent 2>/dev/null; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
        echo " [!] MySQL failed to start. Check: docker logs $MYSQL_CONTAINER"
        exit 1
    fi
    sleep 2
done
echo " [OK] MySQL is ready"
echo ""

# ============================================
# Configure Environment
# ============================================

cat > "$API_DIR/.env" << EOF
# Database (Docker MySQL)
DATABASE_URL="mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@localhost:${MYSQL_PORT}/${MYSQL_DATABASE}"

# Authentication
JWT_SECRET="dev-jwt-secret-change-in-production"

# Server
PORT=3001
EOF

echo " [OK] Environment configured"

# ============================================
# Install Dependencies
# ============================================

echo " Installing API dependencies..."
cd "$API_DIR"
npm install --silent 2>/dev/null

echo " Installing Frontend dependencies..."
cd "$FRONTEND_DIR"
npm install --silent 2>/dev/null

echo " [OK] Dependencies installed"
echo ""

# ============================================
# Run Database Migrations
# ============================================

echo " Running database migrations..."
cd "$API_DIR"
npx prisma generate --schema=prisma/schema.prisma 2>/dev/null
npx prisma db push --accept-data-loss 2>/dev/null

echo " [OK] Database ready"
echo ""

# ============================================
# Start Application
# ============================================

cleanup() {
    echo ""
    echo " Stopping services..."
    kill $API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo ""
    echo " MySQL container is still running."
    echo " To stop MySQL: docker stop $MYSQL_CONTAINER"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo " Starting API server on port 3001..."
cd "$API_DIR"
npm run start:dev > "$LOGS_DIR/api.log" 2>&1 &
API_PID=$!

echo " Starting Frontend on port 5173..."
cd "$FRONTEND_DIR"
npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

echo ""
echo " Waiting for services to start..."
sleep 8

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
echo "  Application Started!"
echo " ========================================"
echo ""
echo "  Frontend: http://localhost:5173"
echo "  API:      http://localhost:3001/api"
echo ""
echo "  MySQL:    localhost:3306"
echo "            User: $MYSQL_USER"
echo "            DB:   $MYSQL_DATABASE"
echo ""

# Open browser if xdg-open available
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:5173"
fi

echo " Press Ctrl+C to stop app (MySQL stays running)"
echo ""

wait $API_PID $FRONTEND_PID
