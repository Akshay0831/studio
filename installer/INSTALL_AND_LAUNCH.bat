@echo off
title Unified Editing Studio - Easy Install & Launch

echo.
echo ========================================
echo      Unified Editing Studio
echo   Easy Installation & Launcher
echo ========================================
echo.

echo 🚀 Welcome to Unified Editing Studio!
echo.
echo This installer will:
echo 1. Check your system requirements
echo 2. Install all necessary dependencies
echo 3. Build the application
echo 4. Launch the studio for you
echo.

echo Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found!
    echo.
    echo Please download Python 3.9+ from:
    echo https://www.python.org/downloads/
    echo.
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    echo ✅ Python found
)

echo.
echo Checking for virtual environment...
if not exist .venv (
    echo Creating virtual environment...
    py -3 -m venv .venv
    call .venv\Scripts\activate
    echo ✅ Virtual environment created
) else (
    call .venv\Scripts\activate
    echo ✅ Virtual environment found
)

echo.
echo Installing backend dependencies...
python -m pip install --upgrade pip >nul 2>&1
pip install -r backend\release_requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

echo.
echo Checking frontend...
cd frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies found
)

echo.
echo Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)
echo ✅ Frontend built

cd ..

echo.
echo ========================================
echo 🎉 Installation Complete!
echo ========================================
echo.
echo Your Unified Editing Studio is ready!
echo.
echo Starting studio now...
echo.

REM Start the studio in background
start cmd /k "call .venv\Scripts\activate && python -m uvicorn studio.backend.app:app --host 127.0.0.1 --port 8000"

echo.
echo Opening browser...
timeout /t 3 /nobreak >nul
start http://127.0.0.1:8000

echo.
echo ✅ Studio is running at: http://127.0.0.1:8000
echo.
echo To launch again later, just double-click:
echo • INSTALL_AND_LAUNCH.bat (for easy install and launch)
echo • launch_studio.bat (for quick launch only)
echo • gui_launcher.py (for GUI interface)
echo.
echo Press any key to exit...
pause >nul