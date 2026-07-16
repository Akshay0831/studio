#!/bin/bash

echo "========================================"
echo "Unified Editing Studio - Quick Launch"
echo "========================================"
echo ""
echo "Checking if studio is already running..."

# Check if backend is running
if netstat -tlnp 2>/dev/null | grep -q ":8000 "; then
    echo "Backend server is already running at http://127.0.0.1:8000"
    echo "Opening browser..."
    if command -v xdg-open &> /dev/null; then
        xdg-open http://127.0.0.1:8000
    elif command -v open &> /dev/null; then
        open http://127.0.0.1:8000
    else
        echo "Please open your browser and navigate to http://127.0.0.1:8000"
    fi
    exit 0
fi

echo "Starting Unified Editing Studio..."
echo ""
echo "Backend: Starting on http://127.0.0.1:8000"
echo "Frontend: Will be served from the same address"
echo ""

# Check if virtual environment exists
if [[ ! -d ".venv" ]]; then
    echo "Virtual environment not found. Please run './unix_installer.sh' first."
    exit 1
fi

# Activate virtual environment and start server
source .venv/bin/activate
python -m uvicorn studio.backend.app:app --host 127.0.0.1 --port 8000

echo ""
echo "Studio stopped. Press any key to exit..."
read -n 1 -s