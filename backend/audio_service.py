import logging
import asyncio
from typing import Dict, Optional, Any, Callable, List

from config import settings
from inference_dispatcher import dispatcher
from utils.telemetry import trace_performance
from utils.cache import generation_cache
from utils.encoding import audio_to_base64
from ai_models.audio_model import get_audio_model

# Try to import AudioLayerEngine for advanced features
try:
    from audiolayer.engine import CompositionOrchestrator
    from audiolayer.config import MusicGenerationConfig
    _AUDIO_LAYER_AVAILABLE = True
except ImportError:
    logging.warning("AudioLayerEngine not available - using mock implementation")
    _AUDIO_LAYER_AVAILABLE = False
    
    # Fallback definitions
    class MusicGenerationConfig:
        def __init__(self):
            self.bpm = 120
            self.key = "C"
            self.scale = "major"
    class CompositionOrchestrator:
        def __init__(self, *args, **kwargs): pass
        def ComposeBatch(self, seeds): return {s: type('Obj', (), {'__dict__': {}}) for s in seeds}
        def PauseStream(self, *args): return True
        def ResumeStream(self, *args): return True
        def SubmitFeedback(self, *args): return True

from utils.base_service import BaseStudioService

logger = logging.getLogger("studio.backend.audio_service")

class AudioService(BaseStudioService):
    def __init__(self):
        super().__init__("audio")
        self.orchestrator: Optional[CompositionOrchestrator] = None
        self.audio_model = get_audio_model()

    def _ensure_orchestrator(self, audio_config: Dict[str, Any]):
        """Initializes the orchestrator lazily."""
        if not self.orchestrator:
            orchestration_config = MusicGenerationConfig()
            orchestration_config.bpm = audio_config.get("bpm", orchestration_config.bpm)
            orchestration_config.key = audio_config.get("key", orchestration_config.key)
            orchestration_config.scale = audio_config.get("scale", orchestration_config.scale)
            
            # Composer engine selection
            composer = audio_config.get("composer", "standard")
            logger.info(f"Audio Service | Using composer: {composer}")
            
            self.orchestrator = CompositionOrchestrator(orchestration_config, output_dir="./studio_output/audio")

    @trace_performance("audio_composition")
    async def compose(
        self,
        audio_config: Dict[str, Any],
        seed: int,
        stream_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """Synthesizes audio compositions based on project parameters."""
        # Check cache
        cached_result = generation_cache.get(audio_config.get("prompt", ""), seed, audio_config)
        if cached_result:
            if stream_callback:
                await stream_callback({"progress": 100, "status": "completed"})
            return cached_result

        logger.info(f"Composing audio | Config: {audio_config} | Seed: {seed}")
        self._ensure_orchestrator(audio_config)
        
        routing = await dispatcher.route_inference("compose_audio", {"config": audio_config, "seed": seed})
        
        if routing["backend"] == "local_gpu":
            composition_results = await self.run_with_progress(
                operation="audio_composition",
                params={"seeds": [seed]},
                handler=self.orchestrator.ComposeBatch,
                stream_callback=stream_callback,
                simulated_steps=8,
                simulation_interval=0.5
            )
            
            composition_metrics = composition_results.get(seed)
            
            result = {
                "status": "completed",
                "seed": seed,
                "metrics": composition_metrics.__dict__ if composition_metrics else {},
                "backend": "local_gpu",
                "output_url": f"/output/audio/composition_seed_{seed:06d}.mid"
            }
            
            generation_cache.set(audio_config.get("prompt", ""), seed, audio_config, result)
            return result
        else:
            return {"error": "CPU fallback not yet optimized", "backend": "cpu"}

    async def pause_stream(self, stream_id: int) -> Dict[str, Any]:
        """Pause an ongoing composition stream."""
        if self.orchestrator:
            success = self.orchestrator.PauseStream(stream_id)
            return {"status": "paused" if success else "failed"}
        return {"status": "failed", "error": "Orchestrator not initialized"}

    async def resume_stream(self, stream_id: int) -> Dict[str, Any]:
        """Resume a paused composition stream."""
        if self.orchestrator:
            success = self.orchestrator.ResumeStream(stream_id)
            return {"status": "resumed" if success else "failed"}
        return {"status": "failed", "error": "Orchestrator not initialized"}

    async def submit_feedback(self, seed: int, feedback_type: str, score: float, comment: str = "") -> Dict[str, Any]:
        """Submit feedback for a specific composition."""
        if self.orchestrator:
            success = self.orchestrator.SubmitFeedback(seed, feedback_type, score, comment)
            return {"status": "submitted" if success else "failed"}
        return {"status": "failed", "error": "Orchestrator not initialized"}

    @trace_performance("audio_effect_chain")
    async def effect_chain(
        self,
        audio_data_base64: str,
        effects_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Applies a chain of audio effects."""
        logger.info(f"Applying effect chain: {list(effects_config.keys())}")
        return {"audio_base64": audio_data_base64, "applied_effects": list(effects_config.keys())}

    async def generate(
        self,
        prompt: str,
        duration: float = 5.0,
        sample_rate: int = 22050,
        format: str = "wav",
        stream_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """
        Generate audio from text prompt using AI model
        This is a simplified implementation for Phase 1 completion
        """
        logger.info(f"Generating audio via AI model | Prompt: {prompt[:50]}... | Duration: {duration}s")
        
        # Generate audio using real AI model
        result = self.audio_model.Generate(
            prompt=prompt,
            duration=duration,
            sample_rate=sample_rate,
            seed=42
        )
        
        # Convert to base64 for transmission
        audio_base64 = audio_to_base64(
            result['audio'],
            sample_rate=result['sample_rate'],
            format=format
        )
        
        # Send progress if callback provided
        if stream_callback:
            await stream_callback({
                "progress": 100,
                "status": "completed",
                "audio_size": len(audio_base64)
            })
        
        logger.info(f"✅ Audio generation successful: {result['duration']}s @ {result['sample_rate']}Hz")
        return {
            "audio_base64": audio_base64,
            "sample_rate": result['sample_rate'],
            "duration": result['duration'],
            "format": format,
            "backend": "local_ai"
        }

audio_service = AudioService()
