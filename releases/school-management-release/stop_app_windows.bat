@echo off
REM ============================================
REM School Management System - Stop Application
REM ============================================
REM This script stops all running instances
REM ============================================

echo.
echo  ========================================
echo   Stopping School Management System
echo  ========================================
echo.

REM Kill node processes running on ports 3000 and 3001
echo  Stopping API server (port 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo  Stopping Frontend server (port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo  [OK] Application stopped successfully.
echo.
pause
