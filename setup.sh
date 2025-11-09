#!/bin/bash

# School Management System - Setup Script
# This script helps you set up the project for local development

set -e

echo "🏫 School Management System - Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ npm $(npm --version) detected"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✅ Docker detected - will start database containers"
    DOCKER_AVAILABLE=true
else
    echo "⚠️  Docker not detected - you'll need to set up MySQL manually"
    DOCKER_AVAILABLE=false
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd apps/web
npm install
cd ../..

# Install backend dependencies
echo "Installing backend dependencies..."
cd apps/api
npm install
cd ../..

echo ""
echo "✅ Dependencies installed successfully"
echo ""

# Start Docker containers if available
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "🐳 Starting MySQL and phpMyAdmin..."
    docker-compose up -d
    
    echo "⏳ Waiting for MySQL to be ready..."
    sleep 10
    
    echo "✅ Database containers started"
    echo "   MySQL: localhost:3306"
    echo "   phpMyAdmin: http://localhost:8080"
    echo ""
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd apps/api
npm run prisma:generate

# Push database schema
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "📊 Creating database schema..."
    npm run prisma:push
    
    echo "🌱 Seeding database with initial data..."
    npm run prisma:seed
    
    echo ""
    echo "✅ Database setup complete!"
    echo ""
fi

cd ../..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo ""

if [ "$DOCKER_AVAILABLE" = false ]; then
    echo "1. Set up MySQL database manually"
    echo "2. Update DATABASE_URL in apps/api/.env"
    echo "3. Run: cd apps/api && npm run prisma:push && npm run prisma:seed"
    echo "4. Start the applications:"
else
    echo "1. Start the applications:"
fi

echo ""
echo "   Backend:  cd apps/api && npm run start:dev"
echo "   Frontend: cd apps/web && npm run dev"
echo ""
echo "   Or run both: npm run dev (from root)"
echo ""
echo "2. Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001/api/v1"

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "   phpMyAdmin: http://localhost:8080"
fi

echo ""
echo "3. Login with:"
echo "   Email: admin@school.com"
echo "   Password: admin123"
echo ""
echo "Happy coding! 🚀"
