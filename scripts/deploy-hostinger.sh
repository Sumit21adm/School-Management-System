#!/bin/bash
# ============================================
# Hostinger Cloud Deployment Script
# ============================================
# Creates a production-ready deployment package
# ============================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/deployment-package"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting Hostinger Deployment Build..."
echo "📂 Project Root: $PROJECT_ROOT"

# 1. Clean previous build
echo "🧹 Cleaning previous builds..."
cd "$PROJECT_ROOT"
rm -rf .next
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# 2. Build Next.js
echo "🏗️  Building Next.js application..."
# Check if standalone output is configured
if ! grep -q "output: 'standalone'" next.config.ts; then
    echo "⚠️  WARNING: 'output: standalone' not found in next.config.ts"
    echo "    Please verify configuration for optimal deployment."
fi

npm run build

# 3. Prepare Package Structure
echo "📦 Assembling deployment package..."

# Check if standalone build exists
if [ ! -d ".next/standalone" ]; then
    echo "❌ Error: Standalone build not found. Ensure 'output: standalone' is in next.config.ts"
    exit 1
fi

# Copy standalone build files
cp -r .next/standalone/* "$DIST_DIR/"

# Copy static assets (Required for standalone mode)
echo "   - Copying static assets..."
mkdir -p "$DIST_DIR/.next/static"
cp -r .next/static/* "$DIST_DIR/.next/static/"

# Copy public assets
echo "   - Copying public folder..."
cp -r public "$DIST_DIR/"

# Copy Prisma schema and migrations (for db setup)
echo "   - Copying database configuration..."
mkdir -p "$DIST_DIR/prisma"
cp prisma/schema.prisma "$DIST_DIR/prisma/"
if [ -d "prisma/migrations" ]; then
    cp -r prisma/migrations "$DIST_DIR/prisma/"
fi

# Copy PM2 config
echo "   - Copying PM2 config..."
cp ecosystem.config.js "$DIST_DIR/"

# Optimize package.json for Hostinger (Build skip & Start command)
echo "   - Optimizing package.json for deployment..."
cd "$DIST_DIR"
node -e "
  const fs = require('fs');
  const pkg = require('./package.json');
  pkg.scripts.build = 'echo \"Build skipped (using standalone)\"';
  pkg.scripts.start = 'node server.js';
  fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
"
cd "$PROJECT_ROOT"

# Create helper scripts for the server
echo "   - Creating server helper scripts..."
cat > "$DIST_DIR/start.sh" << 'EOF'
#!/bin/bash
export NODE_ENV=production
# Run migrations if needed (uncomment if you want auto-migration)
# npx prisma migrate deploy

# Start server
node server.js
EOF
chmod +x "$DIST_DIR/start.sh"

# 4. Create ZIP archive
echo "🗜️  Compressing package..."
cd "$DIST_DIR"
zip -r "../deployment-package-${TIMESTAMP}.zip" . -q
cd "$PROJECT_ROOT"

# 5. Summary
getPackageSize() {
    du -h "deployment-package-${TIMESTAMP}.zip" | cut -f1
}

echo ""
echo "✅ Build Complete!"
echo "================================================================"
echo "📄 File: deployment-package-${TIMESTAMP}.zip"
echo "📦 Size: $(getPackageSize)"
echo "📍 Path: $PROJECT_ROOT/deployment-package-${TIMESTAMP}.zip"
echo "================================================================"
echo ""
echo "🚀 Deployment Instructions:"
echo "1. Upload the ZIP file to your Hostinger File Manager (public_html or app root)."
echo "2. Extract the contents."
echo "3. Create a .env file with your production environment variables."
echo "4. Run 'npm install' inside the extracted folder (to ensure sharp/platform deps)."
echo "   (Note: Standalone build includes most deps, but verifying is good practice)."
echo "5. Start the app using PM2: 'pm2 start ecosystem.config.js'"
echo "================================================================"
