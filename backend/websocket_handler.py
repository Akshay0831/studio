import json
import logging
import importlib
import os
from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Any, Callable, Awaitable
from studio.backend.utils.telemetry import trace_performance

logger = logging.getLogger("studio.backend.websocket_handler")

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.handlers: Dict[str, Callable[[WebSocket, Dict[str, Any]], Awaitable[None]]] = {}

    def register_handler(self, message_type: str, handler: Callable[[WebSocket, Dict[str, Any]], Awaitable[None]]):
        self.handlers[message_type] = handler
        logger.debug(f"Registered handler: {message_type}")

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected | Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected | Remaining: {len(self.active_connections)}")

    @trace_performance("ws_handle_message")
    async def handle_message(self, websocket: WebSocket, raw_message: str):
        try:
            payload = json.loads(raw_message)
            message_type = payload.get("type")
            # Route message to worktree context (main or experimental)
            target_worktree = payload.get("worktree", "main")
            
            handler = self.handlers.get(message_type)
            if handler:
                if "worktree" not in payload:
                    payload["worktree"] = target_worktree
                await handler(websocket, payload)
            else:
                await websocket.send_json({"type": "error", "message": f"Handler not found: {message_type}"})
                
        except json.JSONDecodeError:
            await websocket.send_json({"type": "error", "message": "Invalid JSON payload"})
        except Exception as e:
            logger.error(f"WS Execution error: {e}")
            await websocket.send_json({"type": "error", "message": str(e)})

    async def broadcast_json(self, message: Dict[str, Any]):
        """Broadcasts a JSON message to all connected clients efficiently."""
        if not self.active_connections:
            return
            
        payload = json.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                pass

manager = WebSocketManager()

def load_extensions():
    """Dynamically loads studio extensions."""
    extensions_dir = os.path.join(os.path.dirname(__file__), "extensions")
    if not os.path.exists(extensions_dir):
        logger.warning("Extensions directory not found.")
        return

    for filename in os.listdir(extensions_dir):
        if filename.endswith("_extension.py"):
            module_name = filename[:-3]
            try:
                module = importlib.import_module(f"studio.backend.extensions.{module_name}")
                if hasattr(module, "register"):
                    module.register(manager)
                    logger.info(f"Extension loaded: {module_name}")
            except Exception as e:
                logger.error(f"Failed to load extension {module_name}: {e}")

async def handle_yjs_sync(websocket: WebSocket, payload: Dict[str, Any]):
    """Synchronizes Yjs state across clients."""
    update_data = payload.get("update")
    for connection in manager.active_connections:
        if connection != websocket:
            await connection.send_json({"type": "yjs_update", "update": update_data})

manager.register_handler("yjs_sync", handle_yjs_sync)

# Initialize extensions on startup
load_extensions()

async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            message = await websocket.receive()
            if "text" in message:
                await manager.handle_message(websocket, message["text"])
            elif "bytes" in message:
                # Direct binary broadcast for performance (Yjs)
                for connection in manager.active_connections:
                    if connection != websocket:
                        await connection.send_bytes(message["bytes"])
    except WebSocketDisconnect:
        manager.disconnect(websocket)
