from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.requests import Request
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from config import settings
from routes import art, audio, enhanced, backup, scaling, config
from inference_dispatcher import dispatcher
from websocket_handler import websocket_endpoint, manager
from utils.gpu import get_vram_info
from utils.telemetry import telemetry
from utils.monitoring import (
    health_monitor,
    get_monitoring_data,
    LoggingMiddleware,
    REQUESTS_CACHE
)
from utils.error_handling import (
    custom_exception_handler,
    validation_exception_handler,
    pydantic_exception_handler,
    general_error_middleware
)
from utils.rate_limiter import rate_limit_middleware
from utils.monitoring import LoggingMiddleware, health_monitor
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import time
import os
import asyncio
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("studio.backend.app")

import logging

app = FastAPI(
    title="Unified Editing Studio API",
    description="Interactive backend for real-time sprite and music generation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add middleware in order
app.add_middleware(LoggingMiddleware)

# Add global error handler
app.add_exception_handler(Exception, custom_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(ValidationError, pydantic_exception_handler)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# Background task for system status broadcasting
async def broadcast_status_loop():
    while True:
        try:
            status = {
                "type": "system_status",
                "status": "ok",
                "vram": get_vram_info(),
                "timestamp": time.time(),
                "active_connections": len(manager.active_connections)
            }
            await manager.broadcast_json(status)
        except Exception:
            pass
        await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(broadcast_status_loop())

app.include_router(art.router, prefix="/api")
app.include_router(audio.router, prefix="/api")
app.include_router(enhanced.router, prefix="/api")
app.include_router(backup.router, prefix="/api")
app.include_router(scaling.router, prefix="/api")
app.include_router(config.router, prefix="/api")

@app.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "ok", "message": "Unified Editing Studio API is running"}

# Ensure output directory exists
os.makedirs(settings.STUDIO_OUTPUT_PATH, exist_ok=True)
app.mount("/output", StaticFiles(directory=settings.STUDIO_OUTPUT_PATH), name="output")

STUDIO_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIST = STUDIO_ROOT / "frontend" / "dist"

start_time = time.time()

@app.get("/api/health")
async def health_check():
    """Health check endpoint with comprehensive system status."""
    from utils.dependency_manager import DependencyManager

    health_data = {
        "status": "ok",
        "gpu_available": dispatcher.local_gpu_type is not None,
        "gpu_type": dispatcher.local_gpu_type,
        "vram": get_vram_info(),
        "performance": telemetry.get_summary(),
        "engines": DependencyManager.get_health_report(),
        "uptime_seconds": round(time.time() - start_time, 2),
        "version": "1.0.0",
        "monitoring": {
            "total_requests": health_monitor.request_count,
            "uptime_seconds": health_monitor.uptime_seconds,
            "avg_response_time": health_monitor.avg_response_time,
            "success_rate": health_monitor.success_rate
        }
    }

    logger.info("Health check requested")

    return health_data


@app.get("/api/monitoring")
async def get_monitoring():
    """Get detailed monitoring and statistics."""
    return await get_monitoring_data()


@app.get("/api/requests")
async def get_recent_requests(limit: int = 20):
    """Get recent request logs (for debugging)."""
    return {
        "requests": REQUESTS_CACHE[-limit:] if REQUESTS_CACHE else []
    }


if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="frontend_assets")

    @app.get("/", include_in_schema=False)
    async def serve_frontend_root():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend_spa(request: Request, full_path: str):
        if full_path.startswith("api/") or full_path.startswith("output/") or full_path == "ws" or "." in full_path:
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    async def frontend_status():
        return {
            "status": "ok",
            "message": "Studio backend is running. Build the frontend with npm run build to serve the UI."
        }

@app.websocket("/ws")
async def websocket_route(websocket: WebSocket):
    await websocket_endpoint(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=settings.SERVER_HOST, port=settings.SERVER_PORT, reload=settings.DEBUG)
