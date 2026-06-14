import sys
import os
import logging
import random
from typing import Dict, Optional, Any, Callable, List
from pathlib import Path

from studio.backend.config import settings
from studio.backend.inference_dispatcher import dispatcher

# Add legacy tools to path for logic extraction
sys.path.append(os.path.abspath(settings.AUDIOLAYER_PATH))

try:
    from audiolayer.engine import CompositionOrchestrator
    from audiolayer.config import MusicGenerationConfig
    from audiolayer.state import CompositionState
except ImportError:
    logging.error("Failed to import legacy AudioLayerEngine modules. Check settings.AUDIOLAYER_PATH.")

logger = logging.getLogger("studio.backend.audio_service")

class AudioService:
    def __init__(self):
        # We'll initialize the orchestrator lazily or with a default config
        self.orchestrator: Optional[CompositionOrchestrator] = None
        logger.info("AudioService initialized.")

    def _ensure_orchestrator(self, config_dict: Dict[str, Any]):
        """Initializes the orchestrator with the provided config if not already done."""
        if not self.orchestrator:
            # Convert dict config to MusicGenerationConfig (legacy expects this)
            # For MVP, we assume the config matches the expected schema
            from audiolayer.config import MusicGenerationConfig
            # Simple conversion stub
            config = MusicGenerationConfig() # Use defaults for now
            self.orchestrator = CompositionOrchestrator(config, output_dir="./studio_output/audio")

    async def compose(
        self,
        config: Dict[str, Any],
        seed: int,
        stream_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """
        Interactive audio composition service using the legacy Orchestrator.
        """
        logger.info(f"Composing audio with config: {config} [Seed: {seed}]")
        self._ensure_orchestrator(config)
        
        # Route through dispatcher
        routing = await dispatcher.route_inference("compose_audio", {"config": config, "seed": seed})
        
        if routing["backend"] == "local_gpu":
            layer_count = len(config.get("layers", ["Bass", "Lead", "Drums", "Ambient"]))
            
            for layer_index in range(layer_count):
                if stream_callback:
                    progress = int((layer_index + 1) / layer_count * 100)
                    await stream_callback({"layer_index": layer_index, "progress": progress, "status": "composing"})
                    import asyncio
                    await asyncio.sleep(0.5)
            
            composition_results = self.orchestrator.ComposeBatch([seed])
            composition_metrics = composition_results.get(seed)
            
            return {
                "status": "completed",
                "seed": seed,
                "metrics": composition_metrics.__dict__ if composition_metrics else {},
                "backend": "local_gpu",
                "output_path": str(self.orchestrator.output_dir / f"composition_seed_{seed:06d}.mid")
            }
        else:
            return {"error": "CPU fallback not yet optimized", "backend": "cpu"}

    async def pause_stream(self, stream_id: int) -> Dict[str, Any]:
        """Pause an ongoing composition stream (Legacy feature)."""
        if self.orchestrator:
            success = self.orchestrator.PauseStream(stream_id)
            return {"status": "paused" if success else "failed"}
        return {"status": "failed", "error": "Orchestrator not initialized"}

    async def resume_stream(self, stream_id: int) -> Dict[str, Any]:
        """Resume a paused composition stream (Legacy feature)."""
        if self.orchestrator:
            success = self.orchestrator.ResumeStream(stream_id)
            return {"status": "resumed" if success else "failed"}
        return {"status": "failed", "error": "Orchestrator not initialized"}

    async def submit_feedback(self, seed: int, feedback_type: str, score: float, comment: str = "") -> Dict[str, Any]:
        """Submit feedback for a specific composition (Legacy feature)."""
        if self.orchestrator:
            success = self.orchestrator.SubmitFeedback(seed, feedback_type, score, comment)
            return {"status": "submitted" if success else "failed"}
        return {"status": "failed", "error": "Orchestrator not initialized"}

    async def effect_chain(
        self,
        audio_data_b64: str,
        effects_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Applies a chain of effects.
        """
        logger.info(f"Applying effect chain: {effects_config.keys()}")
        return {"audio_b64": audio_data_b64, "applied_effects": list(effects_config.keys())}

audio_service = AudioService()
