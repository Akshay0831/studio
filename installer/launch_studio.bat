@echo off
echo ========================================
echo Unified Editing Studio - Quick Launch
echo ========================================
echo.
echo Checking if studio is already running...

REM Check if backend is running
netstat -ano | findstr :8000 >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend server is already running at http://127.0.0.1:8000
    echo Opening browser...
    start http://127.0.0.1:8000
    exit /b 0
)

echo Starting Unified Editing Studio...
echo.
echo Backend: Starting on http://127.0.0.1:8000
echo Frontend: Will be served from the same address
echo.

REM Check if virtual environment exists
if not exist .venv (
    echo Virtual environment not found. Please run 'windows_installer.bat' first.
    pause
    exit /b 1
)

REM Activate virtual environment and start server
call .venv\Scripts\activate
python -m uvicorn studio.backend.app:app --host 127.0.0.1 --port 8000

echo.
echo Studio stopped. Press any key to exit...
pause >nul