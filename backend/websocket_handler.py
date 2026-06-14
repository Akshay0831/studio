import json
import logging
from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Any, Callable, Awaitable

logger = logging.getLogger("studio.backend.websocket_handler")

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.handlers: Dict[str, Callable[[WebSocket, Dict[str, Any]], Awaitable[None]]] = {}

    def register_handler(self, msg_type: str, handler: Callable[[WebSocket, Dict[str, Any]], Awaitable[None]]):
        self.handlers[msg_type] = handler
        logger.info(f"Registered handler for: {msg_type}")

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New WebSocket connection. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Active connections: {len(self.active_connections)}")

    async def handle_message(self, websocket: WebSocket, message: str):
        try:
            data = json.loads(message)
            msg_type = data.get("type")
            
            handler = self.handlers.get(msg_type)
            if handler:
                await handler(websocket, data)
            else:
                await websocket.send_json({"type": "error", "message": f"Unknown message type: {msg_type}"})
                
        except json.JSONDecodeError:
            await websocket.send_json({"type": "error", "message": "Invalid JSON"})
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
            await websocket.send_json({"type": "error", "message": str(e)})

manager = WebSocketManager()

# --- Registry Initialization ---
from studio.backend.art_service import art_service
from studio.backend.audio_service import audio_service

async def handle_generate_image(websocket: WebSocket, payload: Dict[str, Any]):
    prompt = payload.get("prompt")
    variation_count = payload.get("num_variations", 1)
    base_seed = payload.get("seed", 42)
    generation_config = payload.get("config", {})
    seeds = [base_seed + i for i in range(variation_count)]
    
    for i, seed in enumerate(seeds):
        async def stream_callback(chunk, index=i):
            await websocket.send_json({
                "type": "image_chunk",
                "variation_index": index,
                "data": chunk
            })
        
        generation_result = await art_service.generate(prompt, seed, generation_config, stream_callback)
        await websocket.send_json({
            "type": "generation_complete",
            "variation_index": i,
            "result": generation_result
        })

async def handle_regenerate_audio(websocket: WebSocket, payload: Dict[str, Any]):
    composition_config = payload.get("config", {})
    seed = payload.get("seed", 42)
    
    async def stream_callback(chunk):
        await websocket.send_json({
            "type": "audio_chunk",
            "data": chunk
        })
        
    composition_result = await audio_service.compose(composition_config, seed, stream_callback)
    await websocket.send_json({
        "type": "composition_complete",
        "result": composition_result
    })

async def handle_yjs_sync(websocket: WebSocket, data: Dict[str, Any]):
    update = data.get("update")
    for connection in manager.active_connections:
        if connection != websocket:
            await connection.send_json({
                "type": "yjs_update",
                "update": update
            })

# Register Core/Feature handlers
manager.register_handler("generate_image", handle_generate_image)
manager.register_handler("regenerate_audio", handle_regenerate_audio)
manager.register_handler("yjs_sync", handle_yjs_sync)

async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            message = await websocket.receive()
            if "text" in message:
                await manager.handle_message(websocket, message["text"])
            elif "bytes" in message:
                for connection in manager.active_connections:
                    if connection != websocket:
                        await connection.send_bytes(message["bytes"])
    except WebSocketDisconnect:
        manager.disconnect(websocket)
