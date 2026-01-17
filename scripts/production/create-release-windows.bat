@echo off
REM ============================================
REM School Management System - Release Builder
REM ============================================
REM Creates a production-ready zip file with
REM built artifacts and "click-to-run" scripts
REM ============================================

setlocal EnableDelayedExpansion

echo.
echo  ========================================
echo   Building Release Package (SQLite)
echo  ========================================
echo.

set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..\..
set RELEASE_DIR=%PROJECT_DIR%\release_build
set OUTPUT_DIR=%PROJECT_DIR%\releases
set ZIP_NAME=school-management-system-release.zip

REM Navigate to project directory
cd /d "%PROJECT_DIR%"

REM 1. Clean previous builds
echo  [1/7] Cleaning previous builds...
if exist "%RELEASE_DIR%" rmdir /S /Q "%RELEASE_DIR%"
if exist "%PROJECT_DIR%\%ZIP_NAME%" del /Q "%PROJECT_DIR%\%ZIP_NAME%"
mkdir "%RELEASE_DIR%"

REM 2. Build Backend
echo  [2/7] Building Backend...
cd /d "%PROJECT_DIR%\backend"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Backend build failed!
    pause
    exit /b 1
)
cd /d "%PROJECT_DIR%"

REM 3. Build Frontend
echo  [3/7] Building Frontend...
cd /d "%PROJECT_DIR%\frontend"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Frontend build failed!
    pause
    exit /b 1
)
cd /d "%PROJECT_DIR%"

REM 4. Prepare Release Directory
echo  [4/7] Assembling release content...

REM --- Backend ---
mkdir "%RELEASE_DIR%\backend"
xcopy /E /I /Y "%PROJECT_DIR%\backend\dist" "%RELEASE_DIR%\backend\dist" >nul
copy /Y "%PROJECT_DIR%\backend\package.json" "%RELEASE_DIR%\backend\" >nul

mkdir "%RELEASE_DIR%\backend\prisma"
mkdir "%RELEASE_DIR%\backend\uploads"

REM Convert Schema to SQLite
echo        Converting Prisma Schema to SQLite...
node "%SCRIPT_DIR%convert-schema-sqlite.js" "%PROJECT_DIR%\backend\prisma\schema.prisma" "%RELEASE_DIR%\backend\prisma\schema.prisma"

REM Compile Seed Script (ts -> js)
echo        Compiling Seed Script...
cd /d "%PROJECT_DIR%\backend"
call npx tsc prisma/seed.ts --outDir "%RELEASE_DIR%\backend\prisma" --module commonjs --target es2018 --skipLibCheck --esModuleInterop

REM Handle tsc output structure
if exist "%RELEASE_DIR%\backend\prisma\prisma\seed.js" (
    move /Y "%RELEASE_DIR%\backend\prisma\prisma\seed.js" "%RELEASE_DIR%\backend\prisma\seed.js" >nul
    rmdir /S /Q "%RELEASE_DIR%\backend\prisma\prisma"
)
cd /d "%PROJECT_DIR%"

REM --- Frontend ---
mkdir "%RELEASE_DIR%\frontend"
xcopy /E /I /Y "%PROJECT_DIR%\frontend\dist" "%RELEASE_DIR%\frontend\dist" >nul
copy /Y "%PROJECT_DIR%\frontend\package.json" "%RELEASE_DIR%\frontend\" >nul
copy /Y "%PROJECT_DIR%\frontend\server.js" "%RELEASE_DIR%\frontend\" >nul

REM --- Runner Scripts ---
echo        Adding runner scripts...
copy /Y "%SCRIPT_DIR%templates\run-release-mac.command" "%RELEASE_DIR%\run_app_mac.command" >nul
copy /Y "%SCRIPT_DIR%templates\run-release-windows.bat" "%RELEASE_DIR%\run_app_windows.bat" >nul
copy /Y "%SCRIPT_DIR%templates\stop-release-mac.command" "%RELEASE_DIR%\stop_app_mac.command" >nul
copy /Y "%SCRIPT_DIR%templates\stop-release-windows.bat" "%RELEASE_DIR%\stop_app_windows.bat" >nul

REM 5. Modify Backend package.json for Production
echo  [5/7] Configuring production package.json...
node -e "const fs = require('fs'); const pkg = require('%RELEASE_DIR:\=/%/backend/package.json'); pkg.scripts.seed = 'node prisma/seed.js'; if (pkg.prisma) { pkg.prisma.seed = 'node prisma/seed.js'; } pkg.scripts['start:prod'] = 'node dist/src/main'; pkg.dependencies = pkg.dependencies || {}; pkg.dependencies.prisma = '6.19.0'; delete pkg.devDependencies; fs.writeFileSync('%RELEASE_DIR:\=/%/backend/package.json', JSON.stringify(pkg, null, 2));"

REM 6. Create Zip archive
echo  [6/7] Creating Zip archive...
cd /d "%PROJECT_DIR%"
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM Rename release_build to school-management-release
if exist "school-management-release" rmdir /S /Q "school-management-release"
move /Y release_build school-management-release >nul

REM Use PowerShell to create zip (available on Windows 10+)
powershell -Command "Compress-Archive -Path 'school-management-release' -DestinationPath '%OUTPUT_DIR%\%ZIP_NAME%' -Force"

REM Clean up
rmdir /S /Q school-management-release

echo  [7/7] Done!
echo.
echo  ========================================
echo   Release Created Successfully! (SQLite)
echo   File: releases\%ZIP_NAME%
echo  ========================================
echo.

pause
