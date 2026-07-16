@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Unified Editing Studio - Windows Installer
echo ========================================
echo.
echo This script will install the Unified Editing Studio on your system.
echo.
echo Requirements:
echo • Internet connection (for first-time setup)
echo • Administrator privileges (optional, for system integration)
echo.
set /p CONFIRM="Continue? (y/n): "
if /i "!CONFIRM!" neq "y" exit /b 0

echo.
echo Checking system requirements...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python 3.9+ is required but not found.
    echo.
    echo Please download and install Python 3.9+ from:
    echo https://www.python.org/downloads/
    echo.
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

echo ✓ Python found
echo.

echo Checking for virtual environment...
if not exist .venv (
    echo Creating Python virtual environment...
    py -3 -m venv .venv
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment already exists
)

echo.
echo Activating virtual environment...
call .venv\Scripts\activate
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment.
    pause
    exit /b 1
)

echo.
echo Installing backend dependencies...
pip install --upgrade pip >nul 2>&1
pip install -r backend\release_requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies.
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed

echo.
echo Checking frontend...
if exist frontend (
    if not exist frontend\node_modules (
        echo Installing frontend dependencies...
        cd frontend
        npm install
        cd ..
        echo ✓ Frontend dependencies installed
    ) else (
        echo ✓ Frontend dependencies already installed
    )
    
    echo Building frontend...
    cd frontend
    npm run build
    cd ..
    echo ✓ Frontend built successfully
) else (
    echo WARNING: Frontend directory not found
)

echo.
echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo To launch the studio:
echo 1. Double-click 'studio\installer\gui_launcher.py'
echo 2. Or run 'studio\launch_release.bat'
echo.
echo Would you like to create desktop shortcuts? (y/n)
set /p SHORTCUTS=""

if /i "%SHORTCUTS%"=="y" (
    echo Creating desktop shortcuts...
    
    # Create desktop shortcut for GUI launcher
    echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\shortcut.vbs"
    echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Unified Editing Studio Launcher.lnk" >> "%TEMP%\shortcut.vbs"
    echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\shortcut.vbs"
    echo oLink.TargetPath = "%~dp0gui_launcher.py" >> "%TEMP%\shortcut.vbs"
    echo oLink.Description = "Launch Unified Editing Studio" >> "%TEMP%\shortcut.vbs"
    echo oLink.WorkingDirectory = "%~dp0.." >> "%TEMP%\shortcut.vbs"
    echo oLink.IconLocation = "%~dp0..\\icon.ico" >> "%TEMP%\shortcut.vbs"
    echo oLink.Save >> "%TEMP%\shortcut.vbs"
    cscript //nologo "%TEMP%\shortcut.vbs"
    del "%TEMP%\shortcut.vbs"
    
    echo ✓ Desktop shortcuts created
)

echo.
echo Installation complete! You can now launch the studio.
pause