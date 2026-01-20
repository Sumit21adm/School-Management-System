#!/bin/bash
# ============================================
# School Management System - Docker Release Builder
# ============================================
# Creates a production-ready zip file with
# built artifacts and Docker containers
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
RELEASE_DIR="$PROJECT_DIR/release_build_docker"
OUTPUT_DIR="$PROJECT_DIR/releases"
ZIP_NAME="school-management-system-docker.zip"
CONFIG_DIR="$SCRIPT_DIR/config"
LAUNCHERS_DIR="$SCRIPT_DIR/launchers"

echo ""
echo " ========================================"
echo "  Building Release Package (Docker)"
echo " ========================================"
echo ""

# 1. Clean previous builds
echo " [1/6] Cleaning previous builds..."
rm -rf "$RELEASE_DIR"
rm -f "$OUTPUT_DIR/$ZIP_NAME"
mkdir -p "$RELEASE_DIR"
mkdir -p "$OUTPUT_DIR"

# 2. Build Backend
echo " [2/6] Building Backend..."
cd "$PROJECT_DIR/backend"
# Generate Prisma Client to ensure types exist
npx prisma generate
npm run build
cd "$PROJECT_DIR"

# 3. Build Frontend
echo " [3/6] Building Frontend..."
cd "$PROJECT_DIR/frontend"
# Force local API URL for Docker release
VITE_API_URL=http://localhost:3001 npm run build
cd "$PROJECT_DIR"

# 4. Prepare Release Directory
echo " [4/6] Assembling release content..."

# --- Root Files ---
cp "$CONFIG_DIR/docker-compose.yml" "$RELEASE_DIR/"

# Copy and Setup Launcher Scripts
cp "$LAUNCHERS_DIR/start_app_mac.command" "$RELEASE_DIR/start_app_mac.command"
cp "$LAUNCHERS_DIR/stop_app_mac.command" "$RELEASE_DIR/stop_app_mac.command"
cp "$LAUNCHERS_DIR/start_app_windows.bat" "$RELEASE_DIR/start_app_windows.bat"
cp "$LAUNCHERS_DIR/stop_app_windows.bat" "$RELEASE_DIR/stop_app_windows.bat"

chmod +x "$RELEASE_DIR/start_app_mac.command"
chmod +x "$RELEASE_DIR/stop_app_mac.command"

# --- Backend ---
echo "       Preparing Backend..."
mkdir -p "$RELEASE_DIR/backend"
# Copy Artifacts
cp -r "$PROJECT_DIR/backend/dist" "$RELEASE_DIR/backend/"
cp "$PROJECT_DIR/backend/package.json" "$RELEASE_DIR/backend/"

cp -r "$PROJECT_DIR/backend/prisma" "$RELEASE_DIR/backend/"
# Remove existing migrations (they are MySQL specific and will conflict)
rm -rf "$RELEASE_DIR/backend/prisma/migrations"


# 4a. Helper for cross-platform sed
# ---------------------------------
sedi() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "$@"
    else
        sed -i "$@"
    fi
}

# Convert Prisma Schema to PostgreSQL for Docker Release
echo "       Converting Schema to PostgreSQL..."
sedi 's/provider = "mysql"/provider = "postgresql"/g' "$RELEASE_DIR/backend/prisma/schema.prisma"
sedi 's/@db.LongText/@db.Text/g' "$RELEASE_DIR/backend/prisma/schema.prisma"
sedi 's/@db.MediumText/@db.Text/g' "$RELEASE_DIR/backend/prisma/schema.prisma"

# Compile Seed Script (TS -> JS) for Production
echo "       Compiling Seed Script..."
cd "$PROJECT_DIR/backend"
# Ensure we have dependencies for tsc if running in CI without global install,
# but usually npx handles it. We assume node_modules exists or npx downloads it.
npx tsc prisma/seed.ts --outDir "$RELEASE_DIR/backend/prisma" --module commonjs --target es2018 --skipLibCheck --esModuleInterop
# Rename to seed.js if nested
if [ -f "$RELEASE_DIR/backend/prisma/prisma/seed.js" ]; then
    mv "$RELEASE_DIR/backend/prisma/prisma/seed.js" "$RELEASE_DIR/backend/prisma/seed.js"
    rm -rf "$RELEASE_DIR/backend/prisma/prisma"
fi
cd "$PROJECT_DIR"

# Modify package.json to run JS seed
echo "       Update package.json for prod seed..."
node -e "
const fs = require('fs');
const pkg = require('$RELEASE_DIR/backend/package.json');
pkg.scripts.seed = 'node prisma/seed.js';
if (pkg.prisma) pkg.prisma.seed = 'node prisma/seed.js';
fs.writeFileSync('$RELEASE_DIR/backend/package.json', JSON.stringify(pkg, null, 2));
"


# Copy Dockerfile
cp "$CONFIG_DIR/Dockerfile.backend" "$RELEASE_DIR/backend/Dockerfile"

# Note: We do NOT copy node_modules. Docker will install them.

# --- Frontend ---
echo "       Preparing Frontend..."
mkdir -p "$RELEASE_DIR/frontend"
# Copy Artifacts
cp -r "$PROJECT_DIR/frontend/dist" "$RELEASE_DIR/frontend/"

# Copy Configuration
cp "$CONFIG_DIR/Dockerfile.frontend" "$RELEASE_DIR/frontend/Dockerfile"
cp "$CONFIG_DIR/nginx.conf" "$RELEASE_DIR/frontend/nginx.conf"


# 5. Zip the Release
echo " [5/6] Creating Zip archive..."
cd "$PROJECT_DIR"
# Rename folder for nicer zip extraction
mv release_build_docker school-management-docker
zip -r -q "$OUTPUT_DIR/$ZIP_NAME" school-management-docker
rm -rf school-management-docker

echo " [6/6] Done!"
echo ""
echo " ========================================"
echo "  Docker Release Created Successfully!"
echo "  File: releases/$ZIP_NAME"
echo " ========================================"
echo ""
