"""
Advanced Queue Processing System for Unified Editing Studio
Implements priority queues, rate limiting, and batch processing.
"""
import asyncio
import time
import threading
import logging
import json
import uuid
import heapq
from typing import Dict, Any, List, Optional, Callable, Union, AsyncGenerator
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor
from collections import deque, defaultdict

logger = logging.getLogger("studio.backend.queue")

class TaskPriority(Enum):
    """Task priority levels"""
    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4
    BACKGROUND = 5

class TaskStatus(Enum):
    """Task execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRY = "retry"

@dataclass
class QueueTask:
    """Individual task in the queue"""
    task_id: str
    priority: TaskPriority
    status: TaskStatus
    payload: Dict[str, Any]
    created_at: float
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    retry_count: int = 0
    max_retries: int = 3
    timeout: int = 300  # seconds
    metadata: Dict[str, Any] = field(default_factory=dict)
    error_message: Optional[str] = None
    
    def __lt__(self, other):
        """For priority queue comparison"""
        return self.priority.value < other.priority.value

class RateLimiter:
    """Rate limiter for task processing"""
    
    def __init__(self, max_requests: int = 100, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = deque()
        self.lock = threading.Lock()
        
    async def can_proceed(self) -> bool:
        """Check if request can proceed under rate limit"""
        current_time = time.time()
        
        with self.lock:
            # Remove old requests
            while (self.requests and 
                   current_time - self.requests[0] > self.time_window):
                self.requests.popleft()
            
            # Check if under limit
            if len(self.requests) < self.max_requests:
                self.requests.append(current_time)
                return True
            
            return False
    
    async def wait_if_needed(self):
        """Wait until request can proceed"""
        while not await self.can_proceed():
            await asyncio.sleep(0.1)

class BatchProcessor:
    """Processes tasks in batches for efficiency"""
    
    def __init__(self, batch_size: int = 10, batch_timeout: int = 5):
        self.batch_size = batch_size
        self.batch_timeout = batch_timeout
        self.current_batch = []
        self.batch_timer = None
        self.processor_func = None
        self.lock = threading.Lock()
        
    async def add_task(self, task: QueueTask):
        """Add task to batch processor"""
        with self.lock:
            self.current_batch.append(task)
            
            if len(self.current_batch) >= self.batch_size:
                await self._process_batch()
            elif self.batch_timer is None:
                self.batch_timer = asyncio.create_task(self._batch_timeout())
    
    async def _batch_timeout(self):
        """Process batch after timeout"""
        await asyncio.sleep(self.batch_timeout)
        with self.lock:
            if self.current_batch:
                await self._process_batch()
            self.batch_timer = None
    
    async def _process_batch(self):
        """Process current batch"""
        batch = self.current_batch
        self.current_batch = []
        
        if batch and self.processor_func:
            try:
                # Group tasks by type for efficient processing
                task_groups = defaultdict(list)
                for task in batch:
                    task_groups[task.metadata.get("task_type", "general")].append(task)
                
                # Process each group
                for task_type, tasks in task_groups.items():
                    await self.processor_func(task_type, tasks)
                    
            except Exception as e:
                logger.error(f"Batch processing failed: {e}")
                # Retry failed tasks
                for task in batch:
                    if task.status == TaskStatus.FAILED and task.retry_count < task.max_retries:
                        task.retry_count += 1
                        task.status = TaskStatus.PENDING
                        # Re-queue for retry
                        await self.add_task(task)

class QueueProcessor:
    """Main queue processing system"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {
            "max_concurrent_tasks": 10,
            "default_timeout": 300,
            "max_retries": 3,
            "enable_rate_limiting": True,
            "rate_limit_max": 100,
            "rate_limit_window": 60,
            "batch_size": 5,
            "batch_timeout": 2,
            "queue_ttl": 3600  # 1 hour
        }
        
        # Priority queues
        self.queues = defaultdict(list)  # Priority -> Tasks
        self.pending_tasks = []  # Priority queue
        self.running_tasks = {}  # task_id -> Task
        self.completed_tasks = {}  # task_id -> Task
        self.failed_tasks = {}  # task_id -> Task
        
        # Rate limiter
        self.rate_limiter = RateLimiter(
            max_requests=self.config.get("rate_limit_max", 100),
            time_window=self.config.get("rate_limit_window", 60)
        )
        
        # Batch processor
        self.batch_processor = BatchProcessor(
            batch_size=self.config.get("batch_size", 5),
            batch_timeout=self.config.get("batch_timeout", 2)
        )
        
        # Task handlers
        self.task_handlers = {}
        self.task_factories = {}
        
        # Background tasks
        self.processing_task = None
        self.cleanup_task = None
        self.monitoring_task = None
        self.is_running = False
        
        # Statistics
        self.stats = {
            "total_processed": 0,
            "successful": 0,
            "failed": 0,
            "retries": 0,
            "average_processing_time": 0.0,
            "queue_length": 0
        }
        
        # Thread pool for CPU-bound tasks
        self.thread_pool = ThreadPoolExecutor(
            max_workers=self.config.get("max_concurrent_tasks", 10)
        )
        
    def start(self):
        """Start the queue processor"""
        self.is_running = True
        
        # Start processing task
        self.processing_task = asyncio.create_task(self._processing_loop())
        
        # Start cleanup task
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        # Start monitoring task
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        
        logger.info("Queue processor started")
        
    def stop(self):
        """Stop the queue processor"""
        self.is_running = False
        
        if self.processing_task:
            self.processing_task.cancel()
            
        if self.cleanup_task:
            self.cleanup_task.cancel()
            
        if self.monitoring_task:
            self.monitoring_task.cancel()
            
        self.thread_pool.shutdown(wait=True)
        logger.info("Queue processor stopped")
    
    def register_task_handler(self, task_type: str, handler: Callable):
        """Register a task handler for specific task types"""
        self.task_handlers[task_type] = handler
        
    def register_task_factory(self, task_type: str, factory: Callable):
        """Register a task factory for creating tasks"""
        self.task_factories[task_type] = factory
    
    async def enqueue_task(self, task_type: str, payload: Dict[str, Any], 
                          priority: TaskPriority = TaskPriority.NORMAL,
                          **kwargs) -> str:
        """Enqueue a new task"""
        # Create task
        task = QueueTask(
            task_id=str(uuid.uuid4()),
            priority=priority,
            status=TaskStatus.PENDING,
            payload=payload,
            created_at=time.time(),
            timeout=kwargs.get("timeout", self.config.get("default_timeout", 300)),
            max_retries=kwargs.get("max_retries", self.config.get("max_retries", 3)),
            metadata={"task_type": task_type, **kwargs}
        )
        
        # Add to priority queue
        heapq.heappush(self.pending_tasks, task)
        self.queues[priority].append(task)
        
        # Update stats
        self.stats["queue_length"] += 1
        
        logger.debug(f"Enqueued task {task.task_id} of type {task_type}")
        return task.task_id
    
    async def dequeue_task(self) -> Optional[QueueTask]:
        """Dequeue the next task to process"""
        if not self.pending_tasks:
            return None
            
        # Apply rate limiting if enabled
        if self.config.get("enable_rate_limiting", True):
            await self.rate_limiter.wait_if_needed()
        
        # Get highest priority task
        task = heapq.heappop(self.pending_tasks)
        
        # Remove from priority queue
        if task in self.queues[task.priority]:
            self.queues[task.priority].remove(task)
        
        # Update task status
        task.status = TaskStatus.RUNNING
        task.started_at = time.time()
        
        # Track running task
        self.running_tasks[task.task_id] = task
        
        # Update stats
        self.stats["queue_length"] -= 1
        
        logger.debug(f"Dequeued task {task.task_id}")
        return task
    
    async def complete_task(self, task_id: str, result: Any = None):
        """Mark a task as completed"""
        if task_id in self.running_tasks:
            task = self.running_tasks[task_id]
            task.status = TaskStatus.COMPLETED
            task.completed_at = time.time()
            
            # Move to completed tasks
            self.completed_tasks[task_id] = task
            del self.running_tasks[task_id]
            
            # Update stats
            self.stats["total_processed"] += 1
            self.stats["successful"] += 1
            
            processing_time = task.completed_at - task.started_at
            self._update_average_processing_time(processing_time)
            
            logger.debug(f"Completed task {task_id}")
    
    async def fail_task(self, task_id: str, error_message: str = None):
        """Mark a task as failed"""
        if task_id in self.running_tasks:
            task = self.running_tasks[task_id]
            
            # Check if should retry
            if task.retry_count < task.max_retries:
                task.retry_count += 1
                task.status = TaskStatus.RETRY
                task.error_message = error_message
                
                # Re-queue for retry
                heapq.heappush(self.pending_tasks, task)
                self.queues[task.priority].append(task)
                
                self.stats["retries"] += 1
                logger.debug(f"Retrying task {task_id} (attempt {task.retry_count})")
            else:
                task.status = TaskStatus.FAILED
                task.error_message = error_message
                task.completed_at = time.time()
                
                # Move to failed tasks
                self.failed_tasks[task_id] = task
                del self.running_tasks[task_id]
                
                # Update stats
                self.stats["total_processed"] += 1
                self.stats["failed"] += 1
                
                processing_time = task.completed_at - task.started_at
                self._update_average_processing_time(processing_time)
                
                logger.error(f"Failed task {task_id}: {error_message}")
    
    async def _processing_loop(self):
        """Main processing loop"""
        while self.is_running:
            try:
                # Get task to process
                task = await self.dequeue_task()
                
                if task:
                    # Process task
                    await self._process_task(task)
                else:
                    # No tasks, wait a bit
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                logger.error(f"Error in processing loop: {e}")
                await asyncio.sleep(1)
    
    async def _process_task(self, task: QueueTask):
        """Process a single task"""
        try:
            # Get task handler
            task_type = task.metadata.get("task_type", "general")
            handler = self.task_handlers.get(task_type)
            
            if handler:
                # Execute task with timeout
                await asyncio.wait_for(
                    self._execute_handler(handler, task),
                    timeout=task.timeout
                )
                await self.complete_task(task.task_id)
            else:
                raise ValueError(f"No handler found for task type: {task_type}")
                
        except asyncio.TimeoutError:
            await self.fail_task(task.task_id, f"Task timed out after {task.timeout} seconds")
        except Exception as e:
            await self.fail_task(task.task_id, str(e))
    
    async def _execute_handler(self, handler: Callable, task: QueueTask):
        """Execute a task handler"""
        # Check if handler is async
        if asyncio.iscoroutinefunction(handler):
            await handler(task)
        else:
            # Run in thread pool for CPU-bound tasks
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(self.thread_pool, handler, task)
    
    async def _cleanup_loop(self):
        """Cleanup loop for old tasks"""
        while self.is_running:
            try:
                current_time = time.time()
                ttl = self.config.get("queue_ttl", 3600)
                
                # Clean up old completed tasks
                completed_to_remove = []
                for task_id, task in self.completed_tasks.items():
                    if current_time - task.completed_at > ttl:
                        completed_to_remove.append(task_id)
                
                for task_id in completed_to_remove:
                    del self.completed_tasks[task_id]
                
                # Clean up old failed tasks
                failed_to_remove = []
                for task_id, task in self.failed_tasks.items():
                    if current_time - task.completed_at > ttl:
                        failed_to_remove.append(task_id)
                
                for task_id in failed_to_remove:
                    del self.failed_tasks[task_id]
                
                logger.debug(f"Cleaned up {len(completed_to_remove)} completed and {len(failed_to_remove)} failed tasks")
                
                await asyncio.sleep(300)  # Run every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
                await asyncio.sleep(600)
    
    async def _monitoring_loop(self):
        """Monitoring loop for queue statistics"""
        while self.is_running:
            try:
                # Update queue statistics
                self.stats["queue_length"] = len(self.pending_tasks)
                
                # Log stats
                logger.debug(f"Queue stats: {self.stats}")
                
                await asyncio.sleep(60)  # Run every minute
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(120)
    
    def _update_average_processing_time(self, processing_time: float):
        """Update average processing time"""
        if self.stats["total_processed"] == 0:
            self.stats["average_processing_time"] = processing_time
        else:
            # Exponential moving average
            alpha = 0.1
            self.stats["average_processing_time"] = (
                alpha * processing_time + 
                (1 - alpha) * self.stats["average_processing_time"]
            )
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """Get current queue statistics"""
        return {
            **self.stats,
            "pending_count": len(self.pending_tasks),
            "running_count": len(self.running_tasks),
            "completed_count": len(self.completed_tasks),
            "failed_count": len(self.failed_tasks),
            "queue_breakdown": {
                priority.name: len(tasks) 
                for priority, tasks in self.queues.items()
            }
        }
    
    async def get_task_info(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific task"""
        # Check running tasks
        if task_id in self.running_tasks:
            task = self.running_tasks[task_id]
            return self._task_to_dict(task)
        
        # Check completed tasks
        if task_id in self.completed_tasks:
            task = self.completed_tasks[task_id]
            return self._task_to_dict(task)
        
        # Check failed tasks
        if task_id in self.failed_tasks:
            task = self.failed_tasks[task_id]
            return self._task_to_dict(task)
        
        return None
    
    def _task_to_dict(self, task: QueueTask) -> Dict[str, Any]:
        """Convert task to dictionary"""
        return {
            "task_id": task.task_id,
            "priority": task.priority.name,
            "status": task.status.value,
            "payload": task.payload,
            "created_at": task.created_at,
            "started_at": task.started_at,
            "completed_at": task.completed_at,
            "retry_count": task.retry_count,
            "max_retries": task.max_retries,
            "timeout": task.timeout,
            "metadata": task.metadata,
            "error_message": task.error_message,
            "processing_time": task.completed_at - task.started_at if task.completed_at and task.started_at else None
        }

# Global queue processor instance
queue_processor = QueueProcessor()