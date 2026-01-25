@echo off
REM ============================================
REM School Management System - Stop Script (Windows)
REM ============================================

echo.
echo  ========================================
echo   Stopping School Management System
echo  ========================================
echo.

REM Function-like block to kill process by port
REM Argument: Port number
:KILL_PORT
set "PORT=%1"
set "NAME=%2"
echo  Checking for %NAME% on port %PORT%...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
    set "PID=%%a"
    if defined PID (
        echo  Found PID %%a. Killing...
        taskkill /F /PID %%a >nul 2>nul
        echo  [OK] %NAME% stopped
        goto :CONTINUE_KILL
    )
)
echo  [INFO] %NAME% not running on port %PORT%
:CONTINUE_KILL
exit /b 0

REM Call "functions" using a loop trick or just inline since batch is limited
REM Using inline logical blocks for clarity

REM Stop API (Port 3001)
echo  Stopping API Server (Port 3001)...
set "FOUND_API="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    set "PID=%%a"
    if not defined FOUND_API (
        echo  Found PID %%a. Killing...
        taskkill /F /PID %%a >nul 2>nul
        echo  [OK] API Server stopped
        set "FOUND_API=1"
    )
)
if not defined FOUND_API echo  [INFO] API Server not running

echo.

REM Stop Frontend (Port 5173)
echo  Stopping Frontend (Port 5173)...
set "FOUND_FRONTEND="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    set "PID=%%a"
    if not defined FOUND_FRONTEND (
        echo  Found PID %%a. Killing...
        taskkill /F /PID %%a >nul 2>nul
        echo  [OK] Frontend stopped
        set "FOUND_FRONTEND=1"
    )
)
if not defined FOUND_FRONTEND echo  [INFO] Frontend not running

echo.

REM Check MySQL Container
set "MYSQL_CONTAINER=school-mysql-hybrid"
docker ps --format "{{.Names}}" | findstr /C:"%MYSQL_CONTAINER%" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  MySQL container '%MYSQL_CONTAINER%' is running.
    set /p STOP_MYSQL=" Do you want to stop MySQL as well? (y/N): "
    if /i "%STOP_MYSQL%"=="y" (
        echo  Stopping MySQL...
        docker stop %MYSQL_CONTAINER%
        echo  [OK] MySQL stopped
    ) else (
        echo  [INFO] MySQL left running
    )
) else (
    echo  [INFO] MySQL container is not running
)

echo.
echo  ========================================
echo   All Application Services Stopped
echo  ========================================
echo.
pause
