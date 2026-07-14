import logging
from typing import Dict, Any
from fastapi import WebSocket
from audio_service import audio_service

logger = logging.getLogger("studio.backend.extensions.audio")

async def handle_regenerate_audio(websocket: WebSocket, message_payload: Dict[str, Any]):
    audio_config = message_payload.get("config", {})
    seed = message_payload.get("seed", 42)
    layer_index = message_payload.get("layer_index")
    target_worktree = message_payload.get("worktree", "main")
    
    async def stream_callback(progress_data):
        await websocket.send_json({
            "type": "audio_chunk",
            "worktree": target_worktree,
            "layer_index": layer_index,
            "metadata": progress_data
        })
        
    logger.info(f"Audio Extension | Regenerating | Seed: {seed} | Worktree: {target_worktree}")
    result = await audio_service.compose(audio_config, seed, stream_callback)
    await websocket.send_json({
        "type": "composition_complete",
        "worktree": target_worktree,
        "layer_index": layer_index,
        "result": result
    })

def register(manager):
    manager.register_handler("regenerate_audio", handle_regenerate_audio)
    logger.info("Audio Extension: Handlers registered.")
