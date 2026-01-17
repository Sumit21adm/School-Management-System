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
REM Build Application (if needed)
REM ============================================

REM Determine if we're inside the repo (has parent with backend/frontend source)
set PROJECT_ROOT=%SCRIPT_DIR%..\..
set PROJECT_BACKEND=%PROJECT_ROOT%\backend
set PROJECT_FRONTEND=%PROJECT_ROOT%\frontend

REM Check if backend dist exists, build if not
if not exist "%API_DIR%\dist" (
    echo  Building backend ^(first run^)...
    if exist "%PROJECT_BACKEND%\src" (
        cd /d "%PROJECT_BACKEND%"
        call npm install >nul 2>nul
        call npm run build >nul 2>nul
        if exist "%PROJECT_BACKEND%\dist" (
            xcopy /E /I /Y "%PROJECT_BACKEND%\dist" "%API_DIR%\dist" >nul
        )
    ) else (
        cd /d "%API_DIR%"
        call npm run build >nul 2>nul
    )
    if not exist "%API_DIR%\dist" (
        echo  [!] Backend build failed.
        pause
        exit /b 1
    )
    echo  [OK] Backend built successfully
) else (
    echo  [OK] Backend already built
)

REM Check if frontend dist exists, build if not
if not exist "%FRONTEND_DIR%\dist" (
    echo  Building frontend ^(first run^)...
    if exist "%PROJECT_FRONTEND%\src" (
        cd /d "%PROJECT_FRONTEND%"
        call npm install >nul 2>nul
        call npm run build >nul 2>nul
        if exist "%PROJECT_FRONTEND%\dist" (
            xcopy /E /I /Y "%PROJECT_FRONTEND%\dist" "%FRONTEND_DIR%\dist" >nul
        )
    ) else (
        cd /d "%FRONTEND_DIR%"
        call npm run build >nul 2>nul
    )
    if not exist "%FRONTEND_DIR%\dist" (
        echo  [!] Frontend build failed.
        pause
        exit /b 1
    )
    echo  [OK] Frontend built successfully
) else (
    echo  [OK] Frontend already built
)
echo.

REM ============================================
REM Start Application (Hidden Background)
REM ============================================

REM Create VBScript to launch processes hidden
set HIDDEN_LAUNCHER=%SCRIPT_DIR%hidden_launcher.vbs

echo  Starting API server (hidden)...
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%API_DIR%"
echo WshShell.Run "cmd /c node dist/src/main ^> ""%LOGS_DIR%\api.log"" 2^>^&1", 0, False
) > "%HIDDEN_LAUNCHER%"
cscript //nologo "%HIDDEN_LAUNCHER%"

echo  Starting Frontend (hidden)...
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%FRONTEND_DIR%"
echo WshShell.Run "cmd /c node server.js ^> ""%LOGS_DIR%\frontend.log"" 2^>^&1", 0, False
) > "%HIDDEN_LAUNCHER%"
cscript //nologo "%HIDDEN_LAUNCHER%"

REM Clean up launcher script
del "%HIDDEN_LAUNCHER%" >nul 2>&1

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
echo   [INFO] App is running as HIDDEN background processes.
echo          No visible windows - processes cannot be accidentally closed!
echo          Logs: logs\api.log, logs\frontend.log
echo.
echo   To stop the application, run: stop_app_windows.bat
echo.

start http://localhost:3000

pause
