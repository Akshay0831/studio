import json
import logging
from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Any

from studio.backend.art_service import art_service
from studio.backend.audio_service import audio_service

logger = logging.getLogger("studio.backend.websocket_handler")

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

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
            
            if msg_type == "generate_image":
                await self._handle_generate_image(websocket, data)
            elif msg_type == "regenerate_audio":
                await self._handle_regenerate_audio(websocket, data)
            elif msg_type == "yjs_sync":
                await self._handle_yjs_sync(websocket, data)
            else:
                await websocket.send_json({"type": "error", "message": f"Unknown message type: {msg_type}"})
                
        except json.JSONDecodeError:
            await websocket.send_json({"type": "error", "message": "Invalid JSON"})
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
            await websocket.send_json({"type": "error", "message": str(e)})

    async def _handle_generate_image(self, websocket: WebSocket, data: Dict[str, Any]):
        prompt = data.get("prompt")
        seed = data.get("seed", 42)
        config = data.get("config", {})
        
        async def stream_callback(chunk):
            await websocket.send_json({
                "type": "image_chunk",
                "data": chunk
            })
            
        result = await art_service.generate(prompt, seed, config, stream_callback)
        await websocket.send_json({
            "type": "generation_complete",
            "result": result
        })

    async def _handle_regenerate_audio(self, websocket: WebSocket, data: Dict[str, Any]):
        config = data.get("config", {})
        seed = data.get("seed", 42)
        
        async def stream_callback(chunk):
            await websocket.send_json({
                "type": "audio_chunk",
                "data": chunk
            })
            
        result = await audio_service.compose(config, seed, stream_callback)
        await websocket.send_json({
            "type": "composition_complete",
            "result": result
        })

    async def _handle_yjs_sync(self, websocket: WebSocket, data: Dict[str, Any]):
        # Broadcoast Yjs update to all other clients
        # In a real scenario, this would involve binary state merging
        update = data.get("update")
        for connection in self.active_connections:
            if connection != websocket:
                await connection.send_json({
                    "type": "yjs_update",
                    "update": update
                })

manager = WebSocketManager()

async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.handle_message(websocket, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
