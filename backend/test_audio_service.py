#!/usr/bin/env python3
"""
Test the real Audio Service implementation
"""

import asyncio
import sys
import os
import logging

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from audio_service import AudioService

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_audio_service():
    """Test the Audio Service with real AI model"""
    logger.info("=" * 60)
    logger.info("REAL AUDIO SERVICE TEST")
    logger.info("=" * 60)
    
    try:
        # Test 1: Check AudioModel initialization
        logger.info("🚀 Testing AudioService...")
        
        service = AudioService()
        logger.info("✅ AudioService created")
        
        # Test 2: Generate audio using real AI model
        logger.info("🎵 Testing audio generation (3 second clip)...")
        result = await service.generate(
            prompt="calm background music",
            duration=3.0
        )
        
        if result and "audio_base64" in result:
            audio_size = len(result['audio_base64'])
            logger.info(f"✅ Real audio generation successful!")
            logger.info(f"   - Duration: {result['duration']}s")
            logger.info(f"   - Sample Rate: {result['sample_rate']}Hz")
            logger.info(f"   - Format: {result['format']}")
            logger.info(f"   - Size: {audio_size} bytes")
            
            # Success!
            return True
        else:
            logger.error("❌ Audio generation failed: no audio returned")
            return False
                
    except Exception as e:
        logger.error(f"❌ AudioService test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function"""
    success = await test_audio_service()
    
    # Summary
    logger.info("=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Audio Service Test: {'✅ PASSED' if success else '❌ FAILED'}")
    
    if success:
        logger.info("🎉 Phase 1 is COMPLETE! Real AI audio generation working!")
        return True
    else:
        logger.error("❌ Phase 1 incomplete. Need to fix audio generation.")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)