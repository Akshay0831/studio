from fastapi import FastAPI, WebSocket
from studio.backend.config import settings
from studio.backend.routes import art, audio
from studio.backend.inference_dispatcher import dispatcher
from studio.backend.websocket_handler import websocket_endpoint
from studio.backend.utils.gpu import get_vram_info
from studio.backend.utils.telemetry import telemetry
from fastapi.staticfiles import StaticFiles
import time
import os

app = FastAPI(
    title="Unified Editing Studio API",
    description="Interactive backend for real-time AI sprite and music generation",
    version="1.0.0"
)

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
    return {
        "status": "ok",
        "gpu_available": dispatcher.local_gpu_type is not None,
        "gpu_type": dispatcher.local_gpu_type,
        "vram": get_vram_info(),
        "performance": telemetry.get_summary(),
        "uptime_seconds": time.time() - start_time
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=settings.SERVER_HOST, port=settings.SERVER_PORT, reload=settings.DEBUG)
