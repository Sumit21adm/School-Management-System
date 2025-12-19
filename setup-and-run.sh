#!/bin/bash

# setup-and-run.sh
# Comprehensive setup script for local development on a new machine.

set -e # Exit on error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting School Management System Setup...${NC}"

# 1. Prerequisite Checks
echo -e "\n${YELLOW}Step 1: Checking Prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js (v18+) and try again.${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git.${NC}"
    exit 1
fi

# Check for MySQL (Command or Port)
if lsof -Pi :3306 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "✅ MySQL is running on port 3306."
else
    echo -e "${YELLOW}⚠️  MySQL does not seem to be running on port 3306.${NC}"
    echo -e "Attempting to start via brew..."
    if command -v brew &> /dev/null; then
        brew services start mysql || echo "Failed to start mysql service."
        sleep 5
    else
        echo -e "${RED}❌ Please ensure MySQL is installed and running on port 3306 before proceeding.${NC}"
        # We don't exit here, to allow for Docker or other setups, but migrations might fail.
    fi
fi

# 2. Environment Setup
echo -e "\n${YELLOW}Step 2: Configuring Environment...${NC}"

# Backend .env
if [ ! -f "school-management-api/.env" ]; then
    echo "Creating backend .env file..."
    cat > school-management-api/.env <<EOL
DATABASE_URL="mysql://root:password@localhost:3306/school_management"
JWT_SECRET="super-secret-jwt-key-change-me"
PORT=3001
EOL
    echo -e "✅ Backend .env created with default credentials (root/password)."
    echo -e "${YELLOW}👉 If your MySQL password is different, please edit school-management-api/.env now.${NC}"
else
    echo "✅ Backend .env exists."
fi

# Frontend .env
if [ ! -f "school-management-system/.env" ]; then
    echo "Creating frontend .env file..."
    cat > school-management-system/.env <<EOL
VITE_API_URL=http://localhost:3001/api
EOL
    echo -e "✅ Frontend .env created."
else
    echo "✅ Frontend .env exists."
fi

# 3. Install Dependencies
echo -e "\n${YELLOW}Step 3: Installing Dependencies...${NC}"

echo "📦 Backend (NestJS)..."
cd school-management-api
npm install
cd ..

echo "📦 Frontend (React)..."
cd school-management-system
npm install
cd ..

# 4. Database Migration
echo -e "\n${YELLOW}Step 4: Setting up Database Schema...${NC}"
cd school-management-api
echo "Generating Prisma Client..."
npx prisma generate

echo "Pushing Schema to DB..."
# db push is better for local dev prototyping than migrate deploy if migrations folder is messy
npx prisma db push --accept-data-loss
cd ..

# 5. Start Services
echo -e "\n${GREEN}Step 5: Starting Services...${NC}"

trap 'kill 0' SIGINT

cd school-management-api
echo "Starting Backend on Port 3001..."
npm run start:dev &

cd ../school-management-system
echo "Starting Frontend on Port 5173..."
npm run dev &

wait
