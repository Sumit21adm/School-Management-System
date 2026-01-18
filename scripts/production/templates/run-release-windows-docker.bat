@echo off
setlocal
cd /d "%~dp0"

echo.
echo  ========================================
echo   School Management System - Docker Launcher
echo  ========================================
echo.

:: 1. Check if Docker is installed
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Docker is not running or not installed.
    echo.
    echo  Please ensure Docker Desktop is installed and running.
    echo  Download: https://www.docker.com/products/docker-desktop/
    echo.
    echo  Attempting to launch Docker Desktop anyway...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>nul
    
    echo  Waiting for Docker to start...
    timeout /t 10
    
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo  [FATAL] Docker still not detected. Please start Docker manually and try again.
        pause
        exit /b 1
    )
)

echo  [OK] Docker is running.
echo.

:: 2. Start Containers
echo  Starting Application Containers...
docker-compose up -d

echo.
echo  ========================================
echo   Application Started Successfully!
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:3001
echo  ========================================
echo.

:: 3. Open Browser
timeout /t 3 >nul
start http://localhost:3000

echo  Closing window in 5 seconds...
timeout /t 5
