import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Callable, Any, Optional

from fastapi import WebSocket, WebSocketDisconnect
from config import settings

logger = logging.getLogger("studio.backend.websocket_manager")

class WebSocketConnection:
    """Tracks a single WebSocket connection with lifecycle information."""
    
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.connected_at = datetime.now()
        self.last_activity = datetime.now()
        self.message_count = 0
        self.active = True
        
    def update_activity(self):
        self.last_activity = datetime.now()
        self.message_count += 1
        
    def is_idle(self, timeout_seconds: int = 300) -> bool:
        return (datetime.now() - self.last_activity) > timedelta(seconds=timeout_seconds)

class EnhancedWebSocketManager:
    """Manages WebSocket connections with timeouts and cleanup."""
    
    def __init__(self, idle_timeout: int = 300, max_message_timeout: int = 30):
        self.active_connections: Dict[str, WebSocketConnection] = {}
        self.handlers: Dict[str, Callable[[WebSocketConnection, Dict[str, Any]], Any]] = {}
        self.idle_timeout = idle_timeout
        self.max_message_timeout = max_message_timeout
        
    def register_handler(self, message_type: str, handler: Callable[[WebSocketConnection, Dict[str, Any]], Any]):
        self.handlers[message_type] = handler
        logger.debug(f"Registered handler: {message_type}")
        
    async def connect(self, websocket: WebSocket, client_id: Optional[str] = None) -> str:
        await websocket.accept()
        connection_id = client_id or f"client_{int(time.time())}_{len(self.active_connections)}"
        
        self.active_connections[connection_id] = WebSocketConnection(websocket)
        logger.info(f"Client connected | ID: {connection_id} | Total: {len(self.active_connections)}")
        return connection_id
        
    def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            self.active_connections[connection_id].active = False
            del self.active_connections[connection_id]
            logger.info(f"Client disconnected | ID: {connection_id} | Remaining: {len(self.active_connections)}")
            
    async def cleanup_idle_connections(self):
        """Remove idle connections that haven't sent messages."""
        to_remove = []
        for connection_id, conn in self.active_connections.items():
            if conn.is_idle(self.idle_timeout):
                to_remove.append(connection_id)
                
        for connection_id in to_remove:
            await self.close_connection(connection_id, "Idle timeout")
            logger.warning(f"Closed idle connection | ID: {connection_id}")
            
    async def close_connection(self, connection_id: str, reason: str = "Closed"):
        if connection_id in self.active_connections:
            conn = self.active_connections[connection_id]
            try:
                await conn.websocket.close(code=1000, reason=reason)
            except Exception as e:
                logger.warning(f"Error closing connection {connection_id}: {e}")
            self.disconnect(connection_id)
            
    async def handle_message(self, connection_id: str, raw_message: str):
        if connection_id not in self.active_connections:
            return
            
        conn = self.active_connections[connection_id]
        conn.update_activity()
        
        try:
            import json
            payload = json.loads(raw_message)
            message_type = payload.get("type")
            
            handler = self.handlers.get(message_type)
            if handler:
                if "worktree" not in payload:
                    payload["worktree"] = "main"
                await handler(conn.websocket, payload)
            else:
                await conn.websocket.send_json({
                    "type": "error",
                    "message": f"Handler not found: {message_type}"
                })
        except json.JSONDecodeError:
            await conn.websocket.send_json({"type": "error", "message": "Invalid JSON payload"})
        except Exception as e:
            logger.error(f"WS Execution error for {connection_id}: {e}")
            await conn.websocket.send_json({"type": "error", "message": str(e)})
            
    async def broadcast_json(self, message: Dict[str, Any], exclude_id: Optional[str] = None):
        if not self.active_connections:
            return
            
        payload = json.dumps(message)
        for connection_id, conn in self.active_connections.items():
            if connection_id == exclude_id:
                continue
                
            try:
                await conn.websocket.send_text(payload)
            except Exception:
                logger.debug(f"Failed to send to {connection_id}")
                
    async def handle_websocket_endpoint(self, websocket: WebSocket):
        connection_id = await self.connect(websocket)
        
        try:
            while self.active_connections.get(connection_id) and self.active_connections[connection_id].active:
                try:
                    message = await asyncio.wait_for(
                        websocket.receive(),
                        timeout=self.max_message_timeout
                    )
                    
                    if "text" in message:
                        await self.handle_message(connection_id, message["text"])
                    elif "bytes" in message:
                        for connection in self.active_connections.values():
                            if connection.websocket != websocket:
                                await connection.websocket.send_bytes(message["bytes"])
                                
                except asyncio.TimeoutError:
                    logger.debug(f"No activity from {connection_id}, checking cleanup")
                    await self.cleanup_idle_connections()
                    continue
                    
        except WebSocketDisconnect:
            self.disconnect(connection_id)
        except Exception as e:
            logger.error(f"WebSocket error for {connection_id}: {e}")
            self.disconnect(connection_id)
        finally:
            if connection_id in self.active_connections:
                await self.close_connection(connection_id, "Error occurred")

def get_connection_stats() -> Dict[str, Any]:
    """Get statistics about all WebSocket connections."""
    return {
        "total_connections": len(websocket_manager.active_connections),
        "active_connections": sum(1 for c in websocket_manager.active_connections.values() if c.active),
        "idle_connections": sum(1 for c in websocket_manager.active_connections.values() if c.is_idle()),
        "total_messages": sum(c.message_count for c in websocket_manager.active_connections.values()),
        "idle_timeout": websocket_manager.idle_timeout,
        "max_message_timeout": websocket_manager.max_message_timeout
    }

websocket_manager = EnhancedWebSocketManager(
    idle_timeout=settings.INFERENCE_TIMEOUT if hasattr(settings, "INFERENCE_TIMEOUT") else 300,
    max_message_timeout=30
)
