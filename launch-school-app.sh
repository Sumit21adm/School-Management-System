#!/bin/bash

# School Management System Launcher
# Modern React + NestJS Application

echo "🏫 School Management System - Modern Stack"
echo "=========================================="
echo ""

# Check if MySQL is running
if ! brew services list | grep -q "mysql.*started"; then
    echo "⚠️  MySQL service is not running. Starting MySQL..."
    brew services start mysql
    sleep 3
    echo "✅ MySQL started"
else
    echo "✅ MySQL is already running"
fi

# Check if dependencies are installed
if [ ! -d "school-management-api/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd school-management-api
    npm install
    cd ..
fi

if [ ! -d "school-management-system/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd school-management-system
    npm install
    cd ..
fi

# Check if database exists and run migrations
echo "🔧 Setting up database..."
cd school-management-api
npx prisma generate 2>/dev/null
# npx prisma migrate deploy 2>/dev/null || npx prisma db push 2>/dev/null
cd ..

echo ""
echo "🚀 Starting applications..."
echo ""

# Start backend in background
echo "Starting Backend API on port 3001..."
cd school-management-api
npm run start:dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend in background
echo "Starting Frontend on port 5173..."
cd school-management-system
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for services to fully start
sleep 5

echo ""
echo "✅ All services started!"
echo ""
echo "📱 Access your application:"
echo "   Frontend:    http://localhost:5173"
echo "   Backend API: http://localhost:3001"
echo "   MySQL:       localhost:3306"
echo ""
echo "🔐 Default credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 To stop services:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or run: pkill -f 'nest start' && pkill -f 'vite'"
echo ""

# Open browser
sleep 2
open http://localhost:5173 2>/dev/null || xdg-open http://localhost:5173 2>/dev/null

# Keep script running
echo "Press Ctrl+C to stop all services..."
wait
