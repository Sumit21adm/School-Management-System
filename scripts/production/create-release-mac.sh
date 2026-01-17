#!/bin/bash
# ============================================
# School Management System - Release Builder
# ============================================
# Creates a production-ready zip file with
# built artifacts and "click-to-run" scripts
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
RELEASE_DIR="$PROJECT_DIR/release_build"
OUTPUT_DIR="$PROJECT_DIR/releases"
ZIP_NAME="school-management-system-release.zip"

echo ""
echo " ========================================"
echo "  Building Release Package (SQLite)"
echo " ========================================"
echo ""

# 1. Clean previous builds
echo " [1/7] Cleaning previous builds..."
rm -rf "$RELEASE_DIR"
rm -f "$PROJECT_DIR/$ZIP_NAME"
mkdir -p "$RELEASE_DIR"

# 2. Build Backend
echo " [2/7] Building Backend..."
cd "$PROJECT_DIR/backend"
npm run build
cd "$PROJECT_DIR"

# 3. Build Frontend
echo " [3/7] Building Frontend..."
cd "$PROJECT_DIR/frontend"
npm run build
cd "$PROJECT_DIR"

# 4. Prepare Release Directory
echo " [4/7] Assembling release content..."

# --- Backend ---
mkdir -p "$RELEASE_DIR/backend"
cp -r "$PROJECT_DIR/backend/dist" "$RELEASE_DIR/backend/"
# Modified package.json will be needed (no headers, generic start)
# taking generic one and cleaning it up later or just using as is but ensuring no ts-node specific checks blocks us
cp "$PROJECT_DIR/backend/package.json" "$RELEASE_DIR/backend/"

mkdir -p "$RELEASE_DIR/backend/prisma"
mkdir -p "$RELEASE_DIR/backend/uploads"
# Convert Schema
echo "       Converting Prisma Schema to SQLite..."
node "$SCRIPT_DIR/convert-schema-sqlite.js" "$PROJECT_DIR/backend/prisma/schema.prisma" "$RELEASE_DIR/backend/prisma/schema.prisma"

# Compile Seed Script (ts -> js)
echo "       Compiling Seed Script..."
cd "$PROJECT_DIR/backend"
# We use tsc to compile just the seed script
npx tsc prisma/seed.ts --outDir "$RELEASE_DIR/backend/prisma" --module commonjs --target es2018 --skipLibCheck --esModuleInterop
# Rename to seed.js if needed (tsc output structure might vary depending on rootDir)
# verify where it put it. closely. usually if input is prisma/seed.ts and outDir is X, it puts it in X/prisma/seed.js or X/seed.js
# Let's verify existing structure handling.
# A simpler way is to just bundle it? No, tsc is fine.
if [ -f "$RELEASE_DIR/backend/prisma/prisma/seed.js" ]; then
    mv "$RELEASE_DIR/backend/prisma/prisma/seed.js" "$RELEASE_DIR/backend/prisma/seed.js"
    rm -rf "$RELEASE_DIR/backend/prisma/prisma"
fi

# Copy .env.example or create generic one if not exists (checked in runner)

# --- Frontend ---
mkdir -p "$RELEASE_DIR/frontend"
cp -r "$PROJECT_DIR/frontend/dist" "$RELEASE_DIR/frontend/"
cp "$PROJECT_DIR/frontend/package.json" "$RELEASE_DIR/frontend/"
cp "$PROJECT_DIR/frontend/server.js" "$RELEASE_DIR/frontend/"

# --- Runner Scripts ---
echo "       Adding runner scripts..."
cp "$SCRIPT_DIR/templates/run-release-mac.command" "$RELEASE_DIR/run_app_mac.command"
cp "$SCRIPT_DIR/templates/run-release-windows.bat" "$RELEASE_DIR/run_app_windows.bat"
cp "$SCRIPT_DIR/templates/stop-release-mac.command" "$RELEASE_DIR/stop_app_mac.command"
cp "$SCRIPT_DIR/templates/stop-release-windows.bat" "$RELEASE_DIR/stop_app_windows.bat"
chmod +x "$RELEASE_DIR/run_app_mac.command"
chmod +x "$RELEASE_DIR/stop_app_mac.command"

# 5. Modify Backend package.json for Production
# Adjust prisma seed command to run JS instead of TS
echo " [5/7] Configuring production package.json..."
# Use node to edit json properly
node -e "
const fs = require('fs');
const pkg = require('$RELEASE_DIR/backend/package.json');
pkg.scripts.seed = 'node prisma/seed.js';
if (pkg.prisma) {
  pkg.prisma.seed = 'node prisma/seed.js';
}
pkg.scripts['start:prod'] = 'node dist/src/main';
pkg.dependencies = pkg.dependencies || {};
pkg.dependencies.prisma = '6.19.0';
delete pkg.devDependencies;
fs.writeFileSync('$RELEASE_DIR/backend/package.json', JSON.stringify(pkg, null, 2));
"

# 6. Install ONLY Prod Dependencies in Release (Optional, usually we let user do it, but for zip maybe we don't?
# The request was 'zip file that i can share... click on run'. 
# Including node_modules makes zip HUGE. Better to let runner install.
# Runner is already set to install.

# 7. Zip the Release
echo " [6/7] Creating Zip archive..."
cd "$PROJECT_DIR"
mkdir -p "$OUTPUT_DIR"
mv release_build school-management-release
zip -r -q "$OUTPUT_DIR/$ZIP_NAME" school-management-release
rm -rf school-management-release

echo " [7/7] Done!"
echo ""
echo " ========================================"
echo "  Release Created Successfully! (SQLite)"
echo "  File: releases/$ZIP_NAME"
echo " ========================================"
echo ""
