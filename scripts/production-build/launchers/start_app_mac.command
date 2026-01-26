#!/bin/bash
# ============================================
# School Management System - Docker Launcher
# ============================================

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo ""
echo " 🚀 Starting School Management System..."
echo " ========================================"

# --- 1. Docker Pre-flight Check ---

# Function to check if Docker Daemon is ready
is_docker_running() {
    docker info >/dev/null 2>&1
}

# Check if Docker executable exists
if ! command -v docker &> /dev/null; then
    echo " ❌ Docker is not installed."
    
    # Check for Homebrew
    if command -v brew &> /dev/null; then
        echo "    Homebrew found."
        read -p "    Would you like to install Docker via Homebrew? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "    Installing Docker..."
            brew install --cask docker
            
            # Start Docker for the first time
            echo "    Starting Docker Desktop..."
            open -a Docker
        else
            echo "    Please install Docker Desktop to continue: https://www.docker.com/products/docker-desktop/"
            open "https://www.docker.com/products/docker-desktop/"
            read -p "    Press [Enter] once Docker is installed..."
        fi
    else
        echo "    Please install Docker Desktop manually: https://www.docker.com/products/docker-desktop/"
        open "https://www.docker.com/products/docker-desktop/"
        read -p "    Press [Enter] once Docker is installed..."
    fi
fi

# Need to re-check specific path if just installed? usually brew puts in path.

# --- 2. Check if Docker Daemon is running ---
echo " 🔄 Checking Docker Engine status..."
if ! is_docker_running; then
    echo "    Docker is not running."
    echo "    Attempting to start Docker Desktop..."
    open -a Docker
    
    echo "    Waiting for Docker to start..."
    # Wait loop
    while ! is_docker_running; do
        sleep 2
        printf "."
    done
    echo ""
    echo "    ✅ Docker is ready!"
fi

# --- 3. Start Application ---
echo ""
echo " 🐳 Starting Containers..."
# Use strict project name so data persists across folder renames
docker-compose -p school_management_system up -d --build

echo ""
echo " ========================================"
echo "  ✅ Application Started Successfully!"
echo "  👉 Frontend: http://localhost:3000"
echo "  👉 Backend API: http://localhost:3001"
echo " ========================================"
echo ""

# Open Browser
sleep 2
open "http://localhost:3000"

# Keep window open briefly so user sees output, then close
read -t 5 -p "Closing window in 5 seconds..."
