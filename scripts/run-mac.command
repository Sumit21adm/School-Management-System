#!/bin/bash
# ============================================
# School Management System - Hybrid Runner
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
    echo ""
    echo " Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    open "https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null 2>&1; then
    echo " [!] Docker is not running. Starting Docker Desktop..."
    open -a Docker
    echo ""
    echo " Waiting for Docker to start..."
    while ! docker info &> /dev/null 2>&1; do
        sleep 3
    done
fi
echo " [OK] Docker is running"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo " [!] Node.js is not installed."
    echo ""
    echo " Please install Node.js 18+ from: https://nodejs.org/"
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
    # Container exists, check if running
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

# Wait for MySQL to be ready
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

# Create/update .env file for API
cat > "$API_DIR/.env" << EOF
# Database (Docker MySQL)
DATABASE_URL="mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@localhost:${MYSQL_PORT}/${MYSQL_DATABASE}"

# Authentication
JWT_SECRET="dev-jwt-secret-change-in-production"

# Server
PORT=3001
EOF

# Create frontend .env file
echo "VITE_API_URL=http://localhost:3001" > "$FRONTEND_DIR/.env"

echo " [OK] Environment configured"

# ============================================
# Install Dependencies (Clean for Architecture Compatibility)
# ============================================

# Remove node_modules AND package-lock.json to ensure native modules are 
# compiled for this architecture. This fixes npm's optional dependency bug
# (https://github.com/npm/cli/issues/4828) which causes @rollup/rollup-darwin-x64
# or @rollup/rollup-darwin-arm64 to be missing when switching machines.
echo " Cleaning dependencies for architecture compatibility..."

# Clean npm cache to ensure fresh downloads
npm cache clean --force 2>/dev/null

if [ -d "$API_DIR/node_modules" ]; then
    rm -rf "$API_DIR/node_modules"
fi
if [ -f "$API_DIR/package-lock.json" ]; then
    rm -f "$API_DIR/package-lock.json"
fi

if [ -d "$FRONTEND_DIR/node_modules" ]; then
    rm -rf "$FRONTEND_DIR/node_modules"
fi
if [ -f "$FRONTEND_DIR/package-lock.json" ]; then
    rm -f "$FRONTEND_DIR/package-lock.json"
fi

echo " Installing API dependencies..."
cd "$API_DIR"
npm install

echo " Installing Frontend dependencies..."
cd "$FRONTEND_DIR"
npm install

# Fix for npm optional dependency bug (https://github.com/npm/cli/issues/4828)
# npm install fails to install platform-specific optional dependencies correctly
# Workaround: use npm pack to download and manually extract native modules
ARCH=$(uname -m)
install_native_module() {
    local PKG_NAME=$1
    if [ ! -d "node_modules/$PKG_NAME" ]; then
        echo "   Installing $PKG_NAME..."
        npm pack "$PKG_NAME" --silent 2>/dev/null
        if [ -f "${PKG_NAME}-"*.tgz ]; then
            tar -xzf "${PKG_NAME}-"*.tgz 2>/dev/null
            mv package "node_modules/$PKG_NAME"
            rm -f "${PKG_NAME}-"*.tgz
        fi
    fi
}

if [ "$ARCH" = "x86_64" ]; then
    echo " Installing native modules for Intel Mac (x64)..."
    install_native_module "lightningcss-darwin-x64"
    install_native_module "@tailwindcss/oxide-darwin-x64"
    install_native_module "@rollup/rollup-darwin-x64"
    # Create symlinks for fallback resolution
    ln -sf ../lightningcss-darwin-x64/lightningcss.darwin-x64.node node_modules/lightningcss/lightningcss.darwin-x64.node 2>/dev/null || true
    ln -sf ../oxide-darwin-x64/tailwindcss-oxide.darwin-x64.node node_modules/@tailwindcss/oxide/tailwindcss-oxide.darwin-x64.node 2>/dev/null || true
elif [ "$ARCH" = "arm64" ]; then
    echo " Installing native modules for Apple Silicon (arm64)..."
    install_native_module "lightningcss-darwin-arm64"
    install_native_module "@tailwindcss/oxide-darwin-arm64"
    install_native_module "@rollup/rollup-darwin-arm64"
    # Create symlinks for fallback resolution
    ln -sf ../lightningcss-darwin-arm64/lightningcss.darwin-arm64.node node_modules/lightningcss/lightningcss.darwin-arm64.node 2>/dev/null || true
    ln -sf ../oxide-darwin-arm64/tailwindcss-oxide.darwin-arm64.node node_modules/@tailwindcss/oxide/tailwindcss-oxide.darwin-arm64.node 2>/dev/null || true
fi

echo " [OK] Dependencies installed"
echo ""

# ============================================
# Run Database Migrations
# ============================================

echo " Running database migrations..."
cd "$API_DIR"
npx prisma generate --schema=prisma/schema.prisma
npx prisma db push --accept-data-loss

echo " Seeding database with default data..."
npx prisma db seed || npm run seed || echo " [WARN] Seeding skipped (may already exist)"

echo " [OK] Database ready"
echo ""

# ============================================
# Start Application
# ============================================

# Start API
echo " Starting API server on port 3001..."
cd "$API_DIR"
nohup npm run start:dev > "$LOGS_DIR/api.log" 2>&1 &
API_PID=$!

# Start Frontend
echo " Starting Frontend on port 5173..."
cd "$FRONTEND_DIR"
nohup npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait for startup
echo ""
echo " Waiting for services to start..."
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
echo "  Application Started in Background!"
echo " ========================================"
echo ""
echo "  Frontend: http://localhost:5173"
echo "  API:      http://localhost:3001/api"
echo ""
echo "  MySQL:    localhost:3306"
echo "            User: $MYSQL_USER"
echo "            Pass: $MYSQL_PASSWORD"
echo "            DB:   $MYSQL_DATABASE"
echo ""
echo "  Logs:     logs/api.log, logs/frontend.log"
echo "  PIDs:     API=$API_PID, Frontend=$FRONTEND_PID"
echo ""

# Open browser
open "http://localhost:5173"

echo " [INFO] The terminal window can now be closed."
echo "        Use 'scripts/stop-mac.command' to stop the application."
echo ""

exit 0
