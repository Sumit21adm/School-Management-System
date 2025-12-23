#!/bin/bash
# ============================================
# Hostinger Cloud Deployment Script
# ============================================
# Creates a production-ready deployment package
# ============================================

set -e

echo ""
echo " =========================================="
echo "  Creating Hostinger Deployment Package"
echo " =========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="$PROJECT_DIR/deployment-package"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Clean previous deployment
echo " [1/8] Cleaning previous deployment..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Build Backend
echo " [2/8] Building backend..."
cd "$PROJECT_DIR/school-management-api"
npm install --production=false
npm run build

# Build Frontend
echo " [3/8] Building frontend..."
cd "$PROJECT_DIR/school-management-system"
npm install
npm run build

# Copy Backend
echo " [4/8] Copying backend files..."
mkdir -p "$DEPLOY_DIR/school-management-api"
cp -r "$PROJECT_DIR/school-management-api/dist" "$DEPLOY_DIR/school-management-api/"
cp -r "$PROJECT_DIR/school-management-api/prisma" "$DEPLOY_DIR/school-management-api/"
cp "$PROJECT_DIR/school-management-api/package.json" "$DEPLOY_DIR/school-management-api/"
cp "$PROJECT_DIR/school-management-api/package-lock.json" "$DEPLOY_DIR/school-management-api/" 2>/dev/null || true

# Copy Frontend Build
echo " [5/8] Copying frontend build..."
mkdir -p "$DEPLOY_DIR/school-management-system"
cp -r "$PROJECT_DIR/school-management-system/dist" "$DEPLOY_DIR/school-management-system/"

# Copy Configuration Files
echo " [6/8] Copying configuration..."
cp "$PROJECT_DIR/ecosystem.config.js" "$DEPLOY_DIR/"
cp "$PROJECT_DIR/.env.production.example" "$DEPLOY_DIR/.env.example"
cp "$PROJECT_DIR/scripts/setup-production.sh" "$DEPLOY_DIR/"
chmod +x "$DEPLOY_DIR/setup-production.sh"

# Copy Documentation
echo " [7/8] Copying documentation..."
cp "$PROJECT_DIR/DEPLOYMENT.md" "$DEPLOY_DIR/" 2>/dev/null || echo "Note: DEPLOYMENT.md not found, skipping"

# Create deployment info
cat > "$DEPLOY_DIR/DEPLOYMENT_INFO.txt" << EOF
School Management System - Deployment Package
==============================================

Build Date: $(date)
Git Commit: $(cd "$PROJECT_DIR" && git rev-parse --short HEAD 2>/dev/null || echo "N/A")
Git Branch: $(cd "$PROJECT_DIR" && git branch --show-current 2>/dev/null || echo "N/A")

Package Contents:
- Backend API (compiled)
- Frontend (production build)
- Database migrations
- PM2 configuration
- Setup scripts

Next Steps:
1. Upload this package to your Hostinger server
2. Follow instructions in DEPLOYMENT.md
3. Run setup-production.sh on the server

EOF

# Create ZIP archive
echo " [8/8] Creating deployment archive..."
cd "$PROJECT_DIR"
zip -r "deployment-package-${TIMESTAMP}.zip" deployment-package/ -q

echo ""
echo " =========================================="
echo "  Deployment Package Created!"
echo " =========================================="
echo ""
echo "  Package: deployment-package-${TIMESTAMP}.zip"
echo "  Size: $(du -h "deployment-package-${TIMESTAMP}.zip" | cut -f1)"
echo "  Location: $PROJECT_DIR"
echo ""
echo "  Next Steps:"
echo "  1. Upload ZIP to Hostinger via hPanel"
echo "  2. Extract on server"
echo "  3. Run: bash setup-production.sh"
echo "  4. Configure .env file"
echo "  5. Start with: pm2 start ecosystem.config.js"
echo ""
