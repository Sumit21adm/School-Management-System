#!/bin/bash
# ============================================
# Production Setup Script for Hostinger
# ============================================
# Run this script on your Hostinger server
# after uploading the deployment package
# ============================================

set -e

echo ""
echo " =========================================="
echo "  School Management System - Production Setup"
echo " =========================================="
echo ""

# Check if running on server
if [ ! -f ".env.example" ]; then
    echo " [!] Error: .env.example not found"
    echo "     Please run this script from the deployment package directory"
    exit 1
fi

# Install PM2 globally if not installed
echo " [1/7] Checking PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "     Installing PM2..."
    npm install -g pm2
else
    echo "     PM2 already installed"
fi

# Install backend dependencies
echo " [2/7] Installing backend dependencies..."
cd school-management-api
npm install --production
cd ..

# Setup environment file
echo " [3/7] Setting up environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "     ⚠️  IMPORTANT: Edit .env file with your database credentials!"
    echo "     Database URL format: mysql://USER:PASSWORD@localhost:3306/DATABASE"
else
    echo "     .env file already exists, skipping"
fi

# Create logs directory
echo " [4/7] Creating logs directory..."
mkdir -p logs

# Generate Prisma Client
echo " [5/7] Generating Prisma Client..."
cd school-management-api
npx prisma generate

# Run database migrations
echo " [6/7] Running database migrations..."
echo "     ⚠️  Make sure your database is created and .env is configured!"
read -p "     Continue with migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma db push
    
    # Run seed
    read -p "     Run database seed (create admin user)? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run seed
    fi
fi
cd ..

# Setup PM2
echo " [7/7] Setting up PM2..."
pm2 delete school-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo " =========================================="
echo "  Setup Complete!"
echo " =========================================="
echo ""
echo "  Application Status:"
pm2 status
echo ""
echo "  Useful Commands:"
echo "  - View logs:    pm2 logs school-api"
echo "  - Restart:      pm2 restart school-api"
echo "  - Stop:         pm2 stop school-api"
echo "  - Monitor:      pm2 monit"
echo ""
echo "  Default Credentials:"
echo "  Username: superadmin"
echo "  Password: admin123"
echo ""
echo "  ⚠️  Remember to:"
echo "  1. Configure your domain/subdomain in Hostinger hPanel"
echo "  2. Point it to port 3001 for API"
echo "  3. Set up frontend serving (static files from school-management-system/dist)"
echo "  4. Configure SSL certificate"
echo "  5. Change default admin password!"
echo ""
