#!/bin/bash

# Unified Editing Studio - Unix/Linux Installer
set -euo pipefail

echo "========================================"
echo "Unified Editing Studio - Unix/Linux Installer"
echo "========================================"
echo ""
echo "This script will install the Unified Editing Studio on your system."
echo ""
echo "Requirements:"
echo "• Internet connection (for first-time setup)"
echo "• Python 3.9+ and Node.js 18+"
echo ""
read -p "Continue? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" ]]; then
    exit 0
fi

echo ""
echo "Checking system requirements..."

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
    
    if [[ $PYTHON_MAJOR -gt 3 ]] || [[ $PYTHON_MAJOR -eq 3 && $PYTHON_MINOR -ge 9 ]]; then
        echo "✓ Python $PYTHON_VERSION found"
    else
        echo "❌ Python 3.9+ required but found $PYTHON_VERSION"
        echo ""
        echo "Please download and install Python 3.9+ from:"
        echo "https://www.python.org/downloads/"
        exit 1
    fi
else
    echo "❌ Python 3 not found"
    echo ""
    echo "Please install Python 3.9+:"
    echo "• macOS: brew install python3"
    echo "• Ubuntu/Debian: sudo apt install python3 python3-pip"
    echo "• Fedora: sudo dnf install python3 python3-pip"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [[ $NODE_MAJOR -ge 18 ]]; then
        echo "✓ Node.js $NODE_VERSION found"
    else
        echo "❌ Node.js 18+ required but found $NODE_VERSION"
        echo ""
        echo "Please download and install Node.js 18+ from:"
        echo "https://nodejs.org/"
        exit 1
    fi
else
    echo "❌ Node.js not found"
    echo ""
    echo "Please install Node.js 18+:"
    echo "• macOS: brew install node"
    echo "• Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "• Fedora: sudo dnf install nodejs npm"
    exit 1
fi

echo ""
echo "Checking for virtual environment..."
if [[ ! -d .venv ]]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    if [[ $? -ne 0 ]]; then
        echo "❌ Failed to create virtual environment."
        exit 1
    fi
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

echo ""
echo "Activating virtual environment..."
source .venv/bin/activate
if [[ $? -ne 0 ]]; then
    echo "❌ Failed to activate virtual environment."
    exit 1
fi

echo ""
echo "Installing backend dependencies..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r backend/release_requirements.txt
if [[ $? -ne 0 ]]; then
    echo "❌ Failed to install backend dependencies."
    exit 1
fi
echo "✓ Backend dependencies installed"

echo ""
echo "Checking frontend..."
if [[ -d "frontend" ]]; then
    if [[ ! -d "frontend/node_modules" ]]; then
        echo "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
        echo "✓ Frontend dependencies installed"
    else
        echo "✓ Frontend dependencies already installed"
    fi
    
    echo "Building frontend..."
    cd frontend
    npm run build
    cd ..
    echo "✓ Frontend built successfully"
else
    echo "WARNING: Frontend directory not found"
fi

echo ""
echo "========================================"
echo "Installation completed successfully!"
echo "========================================"
echo ""
echo "To launch the studio:"
echo "1. Run: python3 installer/gui_launcher.py"
echo "2. Or run: ./launch_release.sh"
echo ""
echo "Would you like to create desktop shortcuts? (y/n)"
read -p "Create shortcuts? " SHORTCUTS

if [[ "$SHORTCUTS" == "y" ]]; then
    echo "Creating desktop shortcuts..."
    
    DESKTOP_DIR="$HOME/Desktop"
    if [[ ! -d "$DESKTOP_DIR" ]]; then
        DESKTOP_DIR="$HOME"
    fi
    
    # Create desktop shortcut for GUI launcher
    cat > "$DESKTOP_DIR/Unified Editing Studio Launcher.desktop" << EOL
[Desktop Entry]
Version=1.0
Type=Application
Name=Unified Editing Studio
Comment=Launch Unified Editing Studio
Exec=python3 "$(pwd)/installer/gui_launcher.py"
Icon=$(pwd)/studio/icon.svg
Terminal=false
Categories=Graphics;AudioVideo;
EOL
    
    # Make it executable
    chmod +x "$DESKTOP_DIR/Unified Editing Studio Launcher.desktop"
    
    echo "✓ Desktop shortcut created"
fi

echo ""
echo "Installation complete! You can now launch the studio."
echo "Double-click the desktop shortcut or run the launch commands above."