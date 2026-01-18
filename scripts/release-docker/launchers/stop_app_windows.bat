@echo off
cd /d "%~dp0"

echo.
echo  ========================================
echo   Stopping School Management System...
echo  ========================================
echo.

docker-compose -p school_management_system down

echo.
echo  [OK] Application Stopped.
timeout /t 3
