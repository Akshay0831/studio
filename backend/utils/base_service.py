import logging
import asyncio
from typing import Dict, Any, Optional, Callable, List
from studio.backend.inference_dispatcher import dispatcher
from studio.backend.utils.cache import generation_cache
from studio.backend.utils.telemetry import trace_performance

class BaseStudioService:
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.logger = logging.getLogger(f"studio.backend.{service_name}")
        self.logger.info(f"{service_name.capitalize()}Service initialized.")

    async def run_with_progress(
        self,
        operation: str,
        params: Dict[str, Any],
        handler: Callable[..., Any],
        stream_callback: Optional[Callable] = None,
        simulated_steps: int = 10,
        simulation_interval: float = 0.3
    ) -> Any:
        """Runs a blocking operation in a thread with simulated progress for UI feedback."""
        
        async def simulate_progress():
            for i in range(1, simulated_steps):
                if stream_callback:
                    await stream_callback({
                        "progress": int((i / simulated_steps) * 100), 
                        "status": "processing",
                        "operation": operation
                    })
                await asyncio.sleep(simulation_interval)

        progress_task = asyncio.create_task(simulate_progress())
        try:
            # Run the actual heavy lifting in a thread
            result = await asyncio.to_thread(handler, **params)
            
            if stream_callback:
                await stream_callback({"progress": 100, "status": "completed", "operation": operation})
            
            return result
        finally:
            progress_task.cancel()

    def get_cached_result(self, key_parts: List[Any]) -> Optional[Any]:
        """Base method for cache retrieval. Implementation specific to sub-services."""
        return None

    async def route_and_execute(self, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Routes to the best hardware and prepares execution strategy."""
        return await dispatcher.route_inference(operation, params)
