import torch
import os
import logging
from typing import Optional, Any, Dict, Callable, List
from studio.backend.config import settings
from studio.backend.utils.gpu import get_vram_info

from studio.backend.utils.batch_processor import batch_processor
from studio.backend.utils.inference_strategies import LocalGPUStrategy, RemoteAPIStrategy, CPUStrategy

logger = logging.getLogger("studio.backend.inference_dispatcher")

class InferenceDispatcher:
    def __init__(self):
        self.local_gpu_type = self._detect_gpu()
        self.batch_processor = batch_processor
        
        # Initialize strategies
        self.strategies = {
            "local_gpu": LocalGPUStrategy(self.local_gpu_type),
            "remote_replicate": RemoteAPIStrategy("replicate", settings.REPLICATE_API_KEY),
            "remote_runpod": RemoteAPIStrategy("runpod", settings.RUNPOD_API_KEY),
            "cpu": CPUStrategy()
        }
        
        logger.info(f"InferenceDispatcher initialized. Local GPU: {self.local_gpu_type or 'None'}")

    async def dispatch(self, operation: str, params: Dict[str, Any], callback: Optional[Callable] = None) -> Any:
        return await self.dispatch_batched(operation, params, callback)

    async def dispatch_batched(self, operation: str, params: Dict[str, Any], callback: Optional[Callable] = None) -> Any:
        routing = await self.route_inference(operation, params)
        if routing["backend"] == "local_gpu":
            return await self.batch_processor.submit(operation, params, callback)
        else:
            return {"error": f"Backend {routing['backend']} not yet supported via batcher", "routing": routing}

    def _detect_gpu(self) -> Optional[str]:
        if torch.cuda.is_available(): return "cuda"
        elif torch.backends.mps.is_available(): return "mps"
        elif os.path.exists("/opt/rocm"): return "rocm"
        return None

    async def route_inference(
        self,
        operation: str,
        params: Dict[str, Any],
        prefer_local: bool = True
    ) -> Dict[str, Any]:
        if settings.FORCE_CPU:
            return await self.strategies["cpu"].execute(operation, params)

        # 1. Try Local GPU
        local = self.strategies["local_gpu"]
        if local.is_available() and prefer_local:
            if self.local_gpu_type != "cuda" or self._has_enough_vram():
                return await local.execute(operation, params)

        # 2. Try Remote APIs
        for key in ["remote_replicate", "remote_runpod"]:
            strat = self.strategies[key]
            if strat.is_available():
                return await strat.execute(operation, params)

        # 3. Final Fallback: CPU
        return await self.strategies["cpu"].execute(operation, params)

    def _has_enough_vram(self, threshold_mb: int = 1000) -> bool:
        vram = get_vram_info()
        return vram["free_mb"] > threshold_mb if vram else False

dispatcher = InferenceDispatcher()
