import torch
import os
import logging
from typing import Optional, Any, Dict
from studio.backend.config import settings

logger = logging.getLogger("studio.backend.inference_dispatcher")

class InferenceDispatcher:
    def __init__(self):
        self.local_gpu_type = self._detect_gpu()
        self.replicate_api_key = settings.REPLICATE_API_KEY
        self.runpod_api_key = settings.RUNPOD_API_KEY
        
        logger.info(f"InferenceDispatcher initialized. Local GPU: {self.local_gpu_type or 'None'}")
        if self.replicate_api_key:
            logger.info("Remote API (Replicate) configured.")
        if self.runpod_api_key:
            logger.info("Remote API (RunPod) configured.")

    def _detect_gpu(self) -> Optional[str]:
        """Detect available GPU acceleration."""
        if torch.cuda.is_available():
            return "cuda"
        elif torch.backends.mps.is_available():
            return "mps"
        # Check for ROCm (typically exposes itself as cuda in torch, but we can be specific)
        elif os.path.exists("/opt/rocm"):
            return "rocm"
        return None

    async def route_inference(
        self,
        operation: str,
        params: Dict[str, Any],
        prefer_local: bool = True
    ) -> Dict[str, Any]:
        """
        Routes an inference operation to the best available hardware.
        """
        if settings.FORCE_CPU:
            logger.info(f"Routing {operation} to CPU (FORCE_CPU enabled)")
            return await self._run_cpu(operation, params)

        if self.local_gpu_type and prefer_local:
            try:
                logger.info(f"Routing {operation} to local GPU ({self.local_gpu_type})")
                return await self._run_local(operation, params)
            except Exception as e:
                logger.warning(f"Local GPU inference failed: {e}. Falling back to remote/CPU.")
                return await self._fallback(operation, params)
        else:
            return await self._fallback(operation, params)

    async def _fallback(self, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handles fallback to remote APIs or CPU."""
        if self.replicate_api_key or self.runpod_api_key:
            try:
                logger.info(f"Routing {operation} to remote API")
                return await self._run_remote(operation, params)
            except Exception as e:
                logger.error(f"Remote inference failed: {e}. Final fallback to CPU.")
                return await self._run_cpu(operation, params)
        else:
            logger.info(f"No remote APIs configured. Routing {operation} to CPU.")
            return await self._run_cpu(operation, params)

    async def _run_local(self, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Returns the local GPU execution strategy."""
        return {
            "backend": "local_gpu",
            "device": self.local_gpu_type,
            "status": "ready"
        }

    async def _run_remote(self, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Returns the remote API execution strategy."""
        provider = "replicate" if self.replicate_api_key else "runpod"
        return {
            "backend": "remote_api",
            "provider": provider,
            "status": "ready"
        }

    async def _run_cpu(self, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Returns the CPU execution strategy."""
        return {
            "backend": "cpu",
            "device": "cpu",
            "status": "ready"
        }

dispatcher = InferenceDispatcher()
