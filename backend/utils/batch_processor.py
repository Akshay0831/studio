import asyncio
import time
import logging
from typing import Dict, Any, List, Callable, Optional, Awaitable
from dataclasses import dataclass, field
from utils.gpu import get_vram_info

logger = logging.getLogger("studio.backend.utils.batch_processor")

@dataclass
class BatchTask:
    task_id: str
    operation: str
    params: Dict[str, Any]
    future: asyncio.Future
    callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None
    timestamp: float = field(default_factory=time.time)

class BatchProcessor:
    def __init__(self, max_batch_size: int = 4, wait_time_ms: int = 50):
        self.max_batch_size = max_batch_size
        self.wait_time_ms = wait_time_ms
        self.queues: Dict[str, List[BatchTask]] = {}
        self.locks: Dict[str, asyncio.Lock] = {}
        self.handlers: Dict[str, Callable[[List[BatchTask]], Awaitable[List[Any]]]] = {}
        self.is_running = False

    def register_handler(self, operation: str, handler: Callable[[List[BatchTask]], Awaitable[List[Any]]]):
        self.handlers[operation] = handler
        logger.debug(f"Registered batch handler for: {operation}")

    async def submit(
        self, 
        operation: str, 
        params: Dict[str, Any], 
        callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None
    ) -> Any:
        """Submits a task to be processed in a batch."""
        if not self.is_running:
            self.start()

        import uuid
        task_id = str(uuid.uuid4())
        loop = asyncio.get_running_loop()
        future = loop.create_future()
        
        task = BatchTask(task_id=task_id, operation=operation, params=params, future=future, callback=callback)
        
        if operation not in self.queues:
            self.queues[operation] = []
            self.locks[operation] = asyncio.Lock()
            
        async with self.locks[operation]:
            self.queues[operation].append(task)
            
        return await future

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        asyncio.create_task(self._process_loop())
        logger.info("BatchProcessor loop started.")

    async def _process_loop(self):
        while self.is_running:
            await asyncio.sleep(self.wait_time_ms / 1000.0)
            
            for operation in list(self.queues.keys()):
                async with self.locks[operation]:
                    if not self.queues[operation]:
                        continue
                    
                    # Determine dynamic batch size based on VRAM
                    current_batch_size = self._get_dynamic_batch_size(operation)
                    
                    if len(self.queues[operation]) >= current_batch_size or \
                       (time.time() - self.queues[operation][0].timestamp) > (self.wait_time_ms / 1000.0):
                        
                        batch = self.queues[operation][:current_batch_size]
                        self.queues[operation] = self.queues[operation][current_batch_size:]
                        
                        # Process batch in background
                        asyncio.create_task(self._execute_batch(operation, batch))

    def _get_dynamic_batch_size(self, operation: str) -> int:
        """Adjusts batch size based on VRAM availability."""
        vram = get_vram_info()
        if not vram or vram["device_type"] != "cuda":
            return self.max_batch_size
            
        free_mb = vram["free_mb"]
        # Basic heuristic: 1GB per image for SDXL-like models
        if free_mb < 2000:
            return 1
        elif free_mb < 4000:
            return 2
        return self.max_batch_size

    async def _execute_batch(self, operation: str, batch: List[BatchTask]):
        """Executes a batch of tasks using the registered handler."""
        logger.info(f"Executing batch: {operation} | Size: {len(batch)}")
        
        try:
            handler = self.handlers.get(operation)
            if not handler:
                raise ValueError(f"No batch handler registered for {operation}")
                
            results = await handler(batch)
            
            for i, task in enumerate(batch):
                if not task.future.done():
                    if i < len(results):
                        task.future.set_result(results[i])
                    else:
                        task.future.set_exception(ValueError("Result count mismatch in batch execution"))
        except Exception as e:
            logger.error(f"Batch execution failed for {operation}: {e}")
            for task in batch:
                if not task.future.done():
                    task.future.set_exception(e)

batch_processor = BatchProcessor()
