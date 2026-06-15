import pytest
import torch
from unittest.mock import MagicMock, patch
from studio.backend.inference_dispatcher import InferenceDispatcher
from studio.backend.config import settings

@pytest.fixture
def dispatcher():
    return InferenceDispatcher()

@pytest.mark.asyncio
async def test_route_inference_cpu_forced(dispatcher):
    with patch("studio.backend.inference_dispatcher.settings.FORCE_CPU", True):
        routing = await dispatcher.route_inference("test_op", {"param": 1})
        assert routing["backend"] == "cpu"
        assert routing["device"] == "cpu"

@pytest.mark.asyncio
async def test_route_inference_local_gpu_available(dispatcher):
    with patch.object(dispatcher, "local_gpu_type", "cuda"):
        with patch.object(dispatcher, "_has_enough_vram", return_value=True):
            routing = await dispatcher.route_inference("test_op", {"param": 1})
            assert routing["backend"] == "local_gpu"
            assert routing["device"] == "cuda"

@pytest.mark.asyncio
async def test_route_inference_low_vram_fallback(dispatcher):
    with patch.object(dispatcher, "local_gpu_type", "cuda"):
        with patch.object(dispatcher, "_has_enough_vram", return_value=False):
            # No remote API configured in default settings for test
            routing = await dispatcher.route_inference("test_op", {"param": 1})
            assert routing["backend"] == "cpu"

def test_has_enough_vram_cuda(dispatcher):
    with patch("studio.backend.inference_dispatcher.get_vram_info") as mock_vram:
        dispatcher.local_gpu_type = "cuda"
        
        # Enough VRAM
        mock_vram.return_value = {"free_mb": 2000}
        assert dispatcher._has_enough_vram(threshold_mb=1000) is True
        
        # Not enough VRAM
        mock_vram.return_value = {"free_mb": 500}
        assert dispatcher._has_enough_vram(threshold_mb=1000) is False

def test_detect_gpu(dispatcher):
    with patch("torch.cuda.is_available", return_value=True):
        assert dispatcher._detect_gpu() == "cuda"
    
    with patch("torch.cuda.is_available", return_value=False):
        with patch("torch.backends.mps.is_available", return_value=True):
            assert dispatcher._detect_gpu() == "mps"
