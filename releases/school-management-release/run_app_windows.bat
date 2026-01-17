@echo off
REM ============================================
REM School Management System - Release Runner
REM ============================================
REM This script runs the pre-built application
REM with ZERO dependencies (except Node.js)
REM ============================================

setlocal EnableDelayedExpansion

echo.
echo  ========================================
echo   School Management System (Release)
echo  ========================================
echo.

set SCRIPT_DIR=%~dp0
set API_DIR=%SCRIPT_DIR%backend
set FRONTEND_DIR=%SCRIPT_DIR%frontend
set LOGS_DIR=%SCRIPT_DIR%logs

REM Create logs directory
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

REM ============================================
REM Check Prerequisites
REM ============================================

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
REM Configure Environment (SQLite)
REM ============================================

REM Create/update .env file for API
echo DATABASE_URL=file:./dev.db> "%API_DIR%\.env"
echo JWT_SECRET=release-jwt-secret-changeme>> "%API_DIR%\.env"
echo PORT=3001>> "%API_DIR%\.env"

echo  [OK] Environment configured

REM ============================================
REM Install Dependencies
REM ============================================

echo  Installing dependencies (this may take a moment)...

echo    Backend...
cd /d "%API_DIR%"
call npm install --omit=dev --no-audit >nul 2>nul

echo    Frontend...
cd /d "%FRONTEND_DIR%"
call npm install --omit=dev --no-audit >nul 2>nul

echo  [OK] Dependencies ready
echo.

REM ============================================
REM Run Database Migrations
REM ============================================

echo  Running database migrations (SQLite)...
cd /d "%API_DIR%"
call npx prisma generate >nul 2>nul
call npx prisma db push --accept-data-loss >nul 2>nul
call npx prisma db seed >nul 2>nul

echo  [OK] Database ready
echo.

REM ============================================
REM Start Application
REM ============================================

echo  Starting API server...
start "School API" /MIN cmd /c "cd /d %API_DIR% && node dist/src/main > "%LOGS_DIR%\api.log" 2>&1"

echo  Starting Frontend...
start "School Frontend" /MIN cmd /c "cd /d %FRONTEND_DIR% && node server.js > "%LOGS_DIR%\frontend.log" 2>&1"

echo.
echo  Waiting for services to start...
timeout /t 5 /nobreak >nul

echo.
echo  ========================================
echo   Application Started!
echo  ========================================
echo.
echo   Frontend: http://localhost:3000
echo   API:      http://localhost:3001/api
echo.
echo   [INFO] App started in background.
echo          Logs: logs\api.log, logs\frontend.log
echo          Use Ctrl+C to stop checking, but processes will continue.
echo.

start http://localhost:3000

pause
