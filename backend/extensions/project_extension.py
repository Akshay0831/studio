import logging
from typing import Dict, Any
from fastapi import WebSocket
from project_service import project_service

logger = logging.getLogger("studio.backend.extensions.project")

async def handle_refine_prompt(websocket: WebSocket, message_payload: Dict[str, Any]):
    prompt = message_payload.get("prompt")
    style_preset = message_payload.get("style_preset")
    
    refined = await project_service.refine_prompt(prompt, style_preset)
    
    await websocket.send_json({
        "type": "prompt_refined",
        "original": prompt,
        "refined": refined
    })

async def handle_analyze_scene(websocket: WebSocket, message_payload: Dict[str, Any]):
    image_b64 = message_payload.get("image_b64")
    audio_metadata = message_payload.get("audio_metadata")
    
    analysis = await project_service.analyze_scene(image_b64, audio_metadata)
    
    await websocket.send_json({
        "type": "scene_analysis_complete",
        "analysis": analysis
    })

async def handle_update_project_config(websocket: WebSocket, message_payload: Dict[str, Any]):
    # This might be handled via Yjs primarily, but we can have explicit sync here if needed.
    config = message_payload.get("config")
    logger.info(f"Project config updated: {config}")
    # In a real app, we might persist this to a DB.
    await websocket.send_json({
        "type": "project_config_synced",
        "status": "ok"
    })

def register(manager):
    manager.register_handler("refine_prompt", handle_refine_prompt)
    manager.register_handler("analyze_scene", handle_analyze_scene)
    manager.register_handler("update_project_config", handle_update_project_config)
    logger.info("Project Extension: Handlers registered.")
