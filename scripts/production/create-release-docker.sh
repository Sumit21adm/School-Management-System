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
TEMPLATES_DIR="$SCRIPT_DIR/templates"

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
npm run build
cd "$PROJECT_DIR"

# 3. Build Frontend
echo " [3/6] Building Frontend..."
cd "$PROJECT_DIR/frontend"
npm run build
cd "$PROJECT_DIR"

# 4. Prepare Release Directory
echo " [4/6] Assembling release content..."

# --- Root Files ---
cp "$TEMPLATES_DIR/docker-compose.yml" "$RELEASE_DIR/"

# Copy and Setup Launcher Scripts
cp "$TEMPLATES_DIR/run-release-mac-docker.command" "$RELEASE_DIR/start_app_mac.command"
cp "$TEMPLATES_DIR/stop-release-mac-docker.command" "$RELEASE_DIR/stop_app_mac.command"
chmod +x "$RELEASE_DIR/start_app_mac.command"
chmod +x "$RELEASE_DIR/stop_app_mac.command"

# --- Backend ---
echo "       Preparing Backend..."
mkdir -p "$RELEASE_DIR/backend"
# Copy Artifacts
cp -r "$PROJECT_DIR/backend/dist" "$RELEASE_DIR/backend/"
cp "$PROJECT_DIR/backend/package.json" "$RELEASE_DIR/backend/"

cp -r "$PROJECT_DIR/backend/prisma" "$RELEASE_DIR/backend/"

# Copy Dockerfile
cp "$TEMPLATES_DIR/Dockerfile.backend" "$RELEASE_DIR/backend/Dockerfile"

# Note: We do NOT copy node_modules. Docker will install them.

# --- Frontend ---
echo "       Preparing Frontend..."
mkdir -p "$RELEASE_DIR/frontend"
# Copy Artifacts
cp -r "$PROJECT_DIR/frontend/dist" "$RELEASE_DIR/frontend/"

# Copy Configuration
cp "$TEMPLATES_DIR/Dockerfile.frontend" "$RELEASE_DIR/frontend/Dockerfile"
cp "$TEMPLATES_DIR/nginx.conf" "$RELEASE_DIR/frontend/nginx.conf"


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
