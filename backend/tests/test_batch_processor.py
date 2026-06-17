import asyncio
import pytest
from studio.backend.utils.batch_processor import BatchProcessor, BatchTask

@pytest.mark.asyncio
async def test_batch_processor_coalescing():
    """Test that multiple submissions are coalesced into a single batch."""
    processor = BatchProcessor(max_batch_size=4, wait_time_ms=100)
    
    batch_received = []
    
    async def mock_handler(tasks):
        batch_received.append(tasks)
        return [{"status": "ok", "id": t.task_id} for t in tasks]
    
    processor.register_handler("test_op", mock_handler)
    processor.start()
    
    # Submit 3 tasks rapidly
    t1 = asyncio.create_task(processor.submit("test_op", {"x": 1}))
    t2 = asyncio.create_task(processor.submit("test_op", {"x": 2}))
    t3 = asyncio.create_task(processor.submit("test_op", {"x": 3}))
    
    results = await asyncio.gather(t1, t2, t3)
    
    assert len(results) == 3
    assert len(batch_received) == 1
    assert len(batch_received[0]) == 3
    
    processor.is_running = False

@pytest.mark.asyncio
async def test_batch_processor_timeout():
    """Test that batching triggers after timeout even if max_batch_size is not reached."""
    processor = BatchProcessor(max_batch_size=10, wait_time_ms=50)
    
    batch_received = []
    
    async def mock_handler(tasks):
        batch_received.append(tasks)
        return [{"status": "ok"}] * len(tasks)
    
    processor.register_handler("test_op", mock_handler)
    processor.start()
    
    # Submit only 1 task and wait for timeout
    result = await processor.submit("test_op", {"x": 1})
    
    assert result["status"] == "ok"
    assert len(batch_received) == 1
    assert len(batch_received[0]) == 1
    
    processor.is_running = False
