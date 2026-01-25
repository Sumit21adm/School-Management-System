#!/bin/bash
# ============================================
# School Management System - Stop Script
# ============================================

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo ""
echo " 🛑 Stopping School Management System..."
echo " ========================================"

if ! command -v docker &> /dev/null; then
    echo " Error: Docker not found. Is it installed?"
    read -p "Press [Enter] to exit..."
    exit 1
fi

# Use strict project name to target the correct containers
docker-compose -p school_management_system down

echo ""
echo " ✅ Application Stopped."
read -t 3 -p "Closing..."
