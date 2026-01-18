@echo off
REM ============================================
REM School Management System - Stop Script (Release)
REM ============================================

echo.
echo  ========================================
echo   Stopping School Management System
echo  ========================================
echo.

REM Stop API (Port 3001)
echo  Stopping API Server (Port 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
    echo  [OK] API Server stopped
)

echo.

REM Stop Frontend (Port 5173)
echo  Stopping Frontend (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
    echo  [OK] Frontend stopped
)

echo.
echo  ========================================
echo   All Application Services Stopped
echo  ========================================
echo.
pause
