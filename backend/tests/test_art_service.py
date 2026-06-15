import pytest
from unittest.mock import MagicMock, patch
import sys
import os

# Ensure the project root and tools are in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
sys.path.append(root_dir)

# Mock the artsynthesis module before it's imported by art_service
mock_artsynthesis = MagicMock()
from enum import Enum
class ModelType(Enum):
    SDXL = "sdxl"
    SD15 = "sd15"

mock_artsynthesis.config.ModelType = ModelType
sys.modules['artsynthesis'] = mock_artsynthesis
sys.modules['artsynthesis.modules'] = mock_artsynthesis.modules
sys.modules['artsynthesis.utils'] = mock_artsynthesis.utils
sys.modules['artsynthesis.config'] = mock_artsynthesis.config

@pytest.fixture
def mock_art_service():
    with patch('studio.backend.inference_dispatcher.dispatcher'):
        from studio.backend.art_service import ArtService
        return ArtService()

@pytest.mark.asyncio
async def test_generate_local(mock_art_service):
    # Setup mocks
    mock_pipeline = MagicMock()
    mock_pipeline.return_value = MagicMock(images=[MagicMock()])
    mock_art_service.model_manager.GetPipeline.return_value = mock_pipeline
    mock_art_service._pil_to_b64 = MagicMock(return_value="mock_b64")
    
    # We need a real-ish ModelType for the enum
    from artsynthesis.config import ModelType
    
    result = await mock_art_service._generate_local(
        prompt="A cute cat",
        seed=42,
        config={"steps": 20},
        model_type=ModelType.SDXL,
        stream_callback=None
    )
    
    assert result["image_b64"] == "mock_b64"
    assert result["seed"] == 42
    assert result["backend"] == "local_gpu"
