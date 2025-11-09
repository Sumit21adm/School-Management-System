#!/bin/bash

echo "🔍 Verifying School Management System Setup"
echo "==========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success=0
failed=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((success++))
    else
        echo -e "${RED}✗${NC} $2 (Missing: $1)"
        ((failed++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((success++))
    else
        echo -e "${RED}✗${NC} $2 (Missing: $1)"
        ((failed++))
    fi
}

echo "📁 Checking Project Structure..."
check_file "package.json" "Root package.json"
check_file "turbo.json" "Turborepo configuration"
check_file "docker-compose.yml" "Docker Compose file"
check_file ".gitignore" "Git ignore file"
check_file "README.md" "Main README"
check_file "QUICKSTART.md" "Quick Start Guide"
check_file "DEPLOYMENT.md" "Deployment Guide"
check_file "CONTRIBUTING.md" "Contributing Guide"
check_file "setup.sh" "Setup script"
echo ""

echo "🎨 Checking Frontend..."
check_dir "apps/web" "Frontend directory"
check_file "apps/web/package.json" "Frontend package.json"
check_file "apps/web/vite.config.ts" "Vite configuration"
check_file "apps/web/tailwind.config.js" "Tailwind configuration"
check_file "apps/web/src/App.tsx" "Main App component"
check_file "apps/web/src/pages/LoginPage.tsx" "Login page"
check_file "apps/web/src/pages/DashboardPage.tsx" "Dashboard page"
echo ""

echo "⚙️  Checking Backend..."
check_dir "apps/api" "Backend directory"
check_file "apps/api/package.json" "Backend package.json"
check_file "apps/api/prisma/schema.prisma" "Prisma schema"
check_file "apps/api/prisma/seed.ts" "Database seed script"
check_file "apps/api/src/main.ts" "Main application file"
check_file "apps/api/src/app.module.ts" "App module"
check_file "apps/api/src/auth/auth.module.ts" "Auth module"
check_file "apps/api/src/auth/auth.service.ts" "Auth service"
check_file "apps/api/src/auth/auth.controller.ts" "Auth controller"
check_file "apps/api/src/students/students.module.ts" "Students module"
check_file "apps/api/src/classes/classes.module.ts" "Classes module"
check_file "apps/api/src/prisma/prisma.service.ts" "Prisma service"
check_file "apps/api/.env.example" "Environment example"
echo ""

echo "🧪 Running Build Tests..."

# Test frontend build
echo -n "Building frontend... "
cd apps/web
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    ((success++))
else
    echo -e "${RED}✗${NC}"
    ((failed++))
fi
cd ../..

# Test backend build
echo -n "Building backend... "
cd apps/api
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    ((success++))
else
    echo -e "${RED}✗${NC}"
    ((failed++))
fi
cd ../..

echo ""
echo "📊 Verification Summary"
echo "======================"
echo -e "${GREEN}Passed: $success${NC}"
echo -e "${RED}Failed: $failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! System is ready to run.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run './setup.sh' to set up the database"
    echo "2. Start development servers with 'npm run dev'"
    echo "3. Access the app at http://localhost:5173"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the errors above.${NC}"
    exit 1
fi
