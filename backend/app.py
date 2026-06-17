from fastapi import FastAPI, WebSocket
from studio.backend.config import settings
from studio.backend.routes import art, audio
from studio.backend.inference_dispatcher import dispatcher
from studio.backend.websocket_handler import websocket_endpoint, manager
from studio.backend.utils.gpu import get_vram_info
from studio.backend.utils.telemetry import telemetry
from fastapi.middleware.cors import CORSMiddleware
import time
import os
import asyncio

app = FastAPI(
    title="Unified Editing Studio API",
    description="Interactive backend for real-time AI sprite and music generation",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# Ensure output directory exists
os.makedirs(settings.STUDIO_OUTPUT_PATH, exist_ok=True)
app.mount("/output", StaticFiles(directory=settings.STUDIO_OUTPUT_PATH), name="output")

@app.websocket("/ws")
async def websocket_route(websocket: WebSocket):
    await websocket_endpoint(websocket)

start_time = time.time()

@app.get("/api/health")
async def health_check():
    from studio.backend.utils.dependency_manager import DependencyManager
    return {
        "status": "ok",
        "gpu_available": dispatcher.local_gpu_type is not None,
        "gpu_type": dispatcher.local_gpu_type,
        "vram": get_vram_info(),
        "performance": telemetry.get_summary(),
        "engines": DependencyManager.get_health_report(),
        "uptime_seconds": time.time() - start_time
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=settings.SERVER_HOST, port=settings.SERVER_PORT, reload=settings.DEBUG)
