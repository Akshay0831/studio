#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo ""
    echo "========================================"
    echo "$1"
    echo "========================================"
    echo ""
}

# Check for previous instance
log_header "Checking for existing studio instance..."

# Find and kill previous process on port 8001, 8002, or 8003
for port in 8001 8002 8003; do
    pid=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        log_warning "Port $port is already in use by PID: $pid"
        read -p "Kill previous instance? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Killing process PID: $pid"
            kill -9 "$pid" 2>/dev/null || true
            sleep 2
        else
            log_error "Studio launcher exiting. Please close the existing instance first."
            exit 1
        fi
    fi
done

log_success "No conflicting instances found"

# Check Python environment
log_header "Checking Python environment"

if [[ ! -d .venv ]]; then
    log_info "Python virtual environment not found. Creating..."
    python -m venv .venv
fi

# Activate virtualenv
if [[ -f .venv/Scripts/activate ]]; then
    source .venv/Scripts/activate
elif [[ -f .venv/bin/activate ]]; then
    source .venv/bin/activate
else
    log_error "Unable to locate the virtualenv activation script."
    exit 1
fi

# Verify Python
if ! command -v python &> /dev/null; then
    log_error "Python not found in virtual environment."
    exit 1
fi

log_success "Python environment: $(python --version)"

# Install/update dependencies
log_header "Installing/updating backend dependencies"

python -m pip install --upgrade pip >/dev/null 2>&1
if ! pip install -r studio/backend/release_requirements.txt >/dev/null 2>&1; then
    log_error "Failed to install backend dependencies."
    exit 1
fi

# Check and install frontend dependencies
log_header "Checking frontend dependencies"

cd "$ROOT_DIR/studio/frontend"
if [[ ! -d node_modules ]]; then
    log_info "Frontend dependencies not found. Installing..."
    if ! npm install; then
        log_error "Failed to install frontend dependencies."
        exit 1
    fi
else
    log_success "Frontend dependencies already installed"
fi

# Build frontend
log_header "Building production frontend"

if ! npm run build; then
    log_error "Frontend build failed!"
    exit 1
fi

# Setup backend environment
cd "$ROOT_DIR"
export PYTHONPATH="$ROOT_DIR"

# Detect available port
log_header "Detecting available port"

for port in 8001 8002 8003; do
    if ! lsof -ti :$port >/dev/null 2>&1; then
        PORT=$port
        break
    fi
done

if [ -z "$PORT" ]; then
    log_error "No available ports found (8001-8003 are in use)"
    exit 1
fi

log_success "Available port: $PORT"

# Start server
SERVER_LOG_FILE="$ROOT_DIR/studio/server.log"
log_header "Starting Unified Editing Studio"
echo "Server URL: http://127.0.0.1:$PORT/"
echo "Server log: $SERVER_LOG_FILE"
echo ""
echo "Press CTRL+C to stop the server"
echo "========================================"
echo ""

# Start server with logging
python -m uvicorn studio.backend.app:app --host 127.0.0.1 --port "$PORT" >> "$SERVER_LOG_FILE" 2>&1
