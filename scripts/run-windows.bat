@echo off
REM ============================================
REM School Management System - Hybrid Runner
REM ============================================
REM MySQL runs in Docker, App runs with npm/node
REM Only requires: Docker + Node.js (no system MySQL)
REM ============================================

echo.
echo  ========================================
echo   School Management System (Hybrid)
echo   MySQL: Docker ^| App: npm/node
echo  ========================================
echo.

set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..\
set API_DIR=%PROJECT_DIR%backend
set FRONTEND_DIR=%PROJECT_DIR%frontend
set LOGS_DIR=%PROJECT_DIR%logs

REM Create logs directory
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

REM ============================================
REM Check Prerequisites
REM ============================================

REM Check Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Docker is not installed.
    echo.
    echo  Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/
    start https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Docker is not running. Attempting to start Docker Desktop...
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else (
        echo  [!] Could not find Docker Desktop executable.
        echo      Please start Docker Desktop manually.
        pause
        exit /b 1
    )
    
    echo  Waiting for Docker to start...
    :WAIT_DOCKER_START
    timeout /t 3 /nobreak >nul
    docker info >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        goto :WAIT_DOCKER_START
    )
)
echo  [OK] Docker is running

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Node.js is not installed.
    echo.
    echo  Please install Node.js 18+ from: https://nodejs.org/
    start https://nodejs.org/
    pause
    exit /b 1
)
echo  [OK] Node.js detected
echo.

REM ============================================
REM MySQL Configuration
REM ============================================

set MYSQL_CONTAINER=school-mysql-hybrid
set MYSQL_PORT=3306
set MYSQL_ROOT_PASSWORD=rootpassword
set MYSQL_DATABASE=school_management
set MYSQL_USER=school_user
set MYSQL_PASSWORD=school_pass

REM ============================================
REM Start MySQL in Docker
REM ============================================

REM Check if container exists and is running
docker ps --format "{{.Names}}" | findstr /C:"%MYSQL_CONTAINER%" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  [OK] MySQL container already running
    goto :MYSQL_READY
)

REM Check if container exists but stopped
docker ps -a --format "{{.Names}}" | findstr /C:"%MYSQL_CONTAINER%" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  Starting existing MySQL container...
    docker start %MYSQL_CONTAINER%
    goto :WAIT_MYSQL
)

REM Create new container
echo  Creating MySQL container...
docker run -d ^
    --name %MYSQL_CONTAINER% ^
    -e MYSQL_ROOT_PASSWORD=%MYSQL_ROOT_PASSWORD% ^
    -e MYSQL_DATABASE=%MYSQL_DATABASE% ^
    -e MYSQL_USER=%MYSQL_USER% ^
    -e MYSQL_PASSWORD=%MYSQL_PASSWORD% ^
    -p %MYSQL_PORT%:3306 ^
    -v school_mysql_data:/var/lib/mysql ^
    mysql:8.0

:WAIT_MYSQL
echo  Waiting for MySQL to be ready...
timeout /t 15 /nobreak >nul

:MYSQL_READY
echo  [OK] MySQL is ready
echo.

REM ============================================
REM Configure Environment
REM ============================================

(
    echo # Database (Docker MySQL)
    echo DATABASE_URL="mysql://%MYSQL_USER%:%MYSQL_PASSWORD%@localhost:%MYSQL_PORT%/%MYSQL_DATABASE%"
    echo.
    echo # Authentication
    echo JWT_SECRET="dev-jwt-secret-change-in-production"
    echo.
    echo # Server
    echo PORT=3001
) > "%API_DIR%\.env"

echo  [OK] Environment configured

REM ============================================
REM Install Dependencies
REM ============================================

echo  Installing API dependencies...
cd /d "%API_DIR%"
call npm install --silent 2>nul

echo  Installing Frontend dependencies...
cd /d "%FRONTEND_DIR%"
call npm install --silent 2>nul

echo  [OK] Dependencies installed
echo.

REM ============================================
REM Run Database Migrations
REM ============================================

echo  Running database migrations...
cd /d "%API_DIR%"
call npx prisma generate --schema=prisma/schema.prisma 2>nul
call npx prisma db push --accept-data-loss 2>nul

echo  [OK] Database ready
echo.

REM ============================================
REM Start Application
REM ============================================

echo  Starting API server on port 3001...
start "School API" /MIN /B cmd /c "cd /d %API_DIR% && npm run start:dev > "%LOGS_DIR%\api.log" 2>&1"

echo  Starting Frontend on port 5173...
start "School Frontend" /MIN /B cmd /c "cd /d %FRONTEND_DIR% && npm run dev > "%LOGS_DIR%\frontend.log" 2>&1"

echo.
echo  Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo  ========================================
echo   Application Started!
echo  ========================================
echo.
echo   Frontend: http://localhost:5173
echo   API:      http://localhost:3001/api
echo.
echo   MySQL:    localhost:%MYSQL_PORT%
echo             User: %MYSQL_USER%
echo             Pass: %MYSQL_PASSWORD%
echo             DB:   %MYSQL_DATABASE%
echo.
echo   [INFO] App started in background.
echo          Logs: logs\api.log, logs\frontend.log
echo          Use 'scripts/stop-windows.bat' to stop.
echo.

start http://localhost:5173

echo  Exiting launcher...
timeout /t 3 /nobreak >nul

