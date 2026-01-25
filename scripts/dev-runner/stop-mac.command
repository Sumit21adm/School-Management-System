#!/bin/bash
# ============================================
# School Management System - Stop Script
# ============================================

echo ""
echo " ========================================"
echo "  Stopping School Management System"
echo " ========================================"
echo ""

# Function to kill process on port
kill_on_port() {
    local PORT=$1
    local NAME=$2
    local PID=$(lsof -ti:$PORT)
    
    if [ -n "$PID" ]; then
        echo " Stopping $NAME (PID: $PID)..."
        kill -9 $PID 2>/dev/null
        echo " [OK] $NAME stopped"
    else
        echo " [INFO] $NAME not running on port $PORT"
    fi
}

# Stop API (Port 3001)
kill_on_port 3001 "API Server"

# Stop Frontend (Port 5173)
kill_on_port 5173 "Frontend"

echo ""

# Check MySQL Container
MYSQL_CONTAINER="school-mysql-hybrid"
if docker ps --format '{{.Names}}' | grep -q "^${MYSQL_CONTAINER}$"; then
    echo " MySQL container '$MYSQL_CONTAINER' is running."
    read -p " Do you want to stop MySQL as well? (y/N): " STOP_MYSQL
    if [[ "$STOP_MYSQL" =~ ^[Yy]$ ]]; then
        echo " Stopping MySQL..."
        docker stop "$MYSQL_CONTAINER"
        echo " [OK] MySQL stopped"
    else
        echo " [INFO] MySQL left running"
    fi
else
    echo " [INFO] MySQL container is not running"
fi

echo ""
echo " ========================================"
echo "  All Application Services Stopped"
echo " ========================================"
echo ""
