#!/usr/bin/env python3
"""
Test the real AI model implementation
"""

import asyncio
import sys
import os
import logging
import torch

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_models.model_manager import ModelManager
from ai_models.device_utils import get_device
from ai_models.model_types import ModelType, QuantizationType

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_real_generation():
    """Test real AI image generation"""
    logger.info("🚀 Testing real AI model implementation...")
    
    try:
        # Test 1: Check device
        device = get_device()
        logger.info(f"✅ Device: {device}")
        
        # Test 2: Create ModelManager
        mm = ModelManager()
        logger.info("✅ ModelManager created")
        
        # Test 3: Check memory
        memory_info = mm.get_memory_usage()
        logger.info(f"✅ Memory info: {memory_info}")
        
        # Test 4: Try to get a pipeline
        pipeline = mm.GetPipeline(ModelType.SDXL)
        logger.info("✅ Pipeline created successfully")
        
        # Test 5: Try generation with minimal steps
        logger.info("🎨 Testing image generation (minimal steps for quick test)...")
        with torch.no_grad():
            result = pipeline(
                prompt="A simple test image",
                num_inference_steps=5,  # Very quick test
                guidance_scale=7.5,
                width=512,
                height=512
            )
            
            if hasattr(result, 'images') and len(result.images) > 0:
                logger.info(f"✅ Real generation successful! Generated {len(result.images)} images")
                return True
            else:
                logger.error("❌ No images returned")
                return False
                
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_art_service():
    """Test if ArtService can use the real implementation"""
    logger.info("🧪 Testing ArtService integration...")
    
    try:
        from art_service import ArtService
        import torch
        
        # Clear cache before test
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        service = ArtService()
        logger.info("✅ ArtService created")
        
        # Test generation with minimal config - use very small image size to save memory
        result = await service.generate(
            prompt="A simple test image",
            seed=42,
            gen_config={"steps": 2, "width": 128, "height": 128}  # Very small for memory
        )
        
        if result and "image_base64" in result:
            logger.info("✅ ArtService real generation successful!")
            # Clear cache after test
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            return True
        else:
            logger.error(f"❌ ArtService generation failed: {result}")
            return False
            
    except Exception as e:
        logger.error(f"❌ ArtService test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function"""
    logger.info("=" * 60)
    logger.info("REAL AI MODEL IMPLEMENTATION TEST")
    logger.info("=" * 60)
    
    # Test 1: Basic model functionality
    test1_passed = await test_real_generation()
    
    # Test 2: ArtService integration
    test2_passed = await test_art_service()
    
    # Summary
    logger.info("=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Real Model Test: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    logger.info(f"ArtService Test: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    
    if test1_passed and test2_passed:
        logger.info("🎉 ALL TESTS PASSED! Real AI implementation is working!")
        return True
    else:
        logger.error("❌ Some tests failed. Real implementation needs fixes.")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)