@echo off
setlocal enabledelayedexpansion
set ROOT_DIR=%~dp0..
cd /d "%ROOT_DIR%"

echo ========================================
echo Unified Editing Studio - Release Launcher
echo ========================================
echo.

REM Check for previous instance
echo Checking for existing studio instance...
netstat -ano | findstr :8001 >nul 2>&1
if %errorlevel% equ 0 (
    set /p KILL="Port 8001 is already in use. Kill previous instance? (y/n): "
    if /i "!KILL!"=="y" (
        echo Killing previous instance...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001') do (
            taskkill /F /PID %%a >nul 2>&1
        )
        timeout /t 2 /nobreak >nul
    ) else (
        echo Studio launcher exiting. Please close the existing instance first.
        exit /b 1
    )
)

REM Check Python environment
echo.
echo Checking Python environment...
if not exist .venv (
    echo Python virtual environment not found. Creating...
    py -3 -m venv .venv
)

call .venv\Scripts\activate
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found in virtual environment.
    exit /b 1
)

REM Install/update dependencies
echo.
echo Installing/updating backend dependencies...
python -m pip install --upgrade pip >nul 2>&1
pip install -r studio\backend\release_requirements.txt >nul 2>&1

REM Check and install frontend dependencies
echo.
echo Checking frontend dependencies...
cd /d "%ROOT_DIR%\studio\frontend"
if not exist node_modules (
    echo Frontend dependencies not found. Installing...
    npm install
) else (
    echo Frontend dependencies already installed.
)

REM Build frontend
echo.
echo Building production frontend...
npm run build

if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    exit /b 1
)

REM Setup backend environment
cd /d "%ROOT_DIR%"
set PYTHONPATH=%ROOT_DIR%

REM Detect available port
echo.
echo Detecting available port...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001') do (
    set USED_PORT=%%a
)
if defined USED_PORT (
    echo Port 8001 is in use, trying 8002...
    set PORT=8002
    netstat -ano | findstr :8002 >nul 2>&1
    for /f "tokens=5" %%b in ('netstat -ano ^| findstr :8002') do (
        set USED_PORT=%%b
    )
    if defined USED_PORT (
        set PORT=8003
    )
)

echo.
echo ========================================
echo Starting Unified Editing Studio
echo ========================================
echo Server URL: http://127.0.0.1:%PORT%/
echo Press CTRL+C to stop the server
echo ========================================
echo.

REM Start server
set SERVER_LOG_FILE=%ROOT_DIR%\studio\server.log
echo Server log: %SERVER_LOG_FILE%
echo.
python -m uvicorn studio.backend.app:app --host 127.0.0.1 --port %PORT% > "%SERVER_LOG_FILE%" 2>&1
