#!/usr/bin/env python3
"""
Test script to check if AI models are actually working
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_dependencies():
    """Test if AI dependencies are actually available"""
    print("Testing AI Dependencies...")
    print("=" * 50)
    
    # Test PyTorch
    try:
        import torch
        print(f"✅ PyTorch: {torch.__version__}")
        
        # Check GPU availability
        if torch.cuda.is_available():
            print(f"✅ CUDA Available: {torch.cuda.get_device_name()}")
        else:
            print("⚠️  CUDA not available, using CPU")
            
    except ImportError as e:
        print(f"❌ PyTorch: {e}")
        return False
    
    # Test Diffusers
    try:
        import diffusers
        print(f"✅ Diffusers: {diffusers.__version__}")
    except ImportError as e:
        print(f"❌ Diffusers: {e}")
        return False
    
    # Test Transformers
    try:
        import transformers
        print(f"✅ Transformers: {transformers.__version__}")
    except ImportError as e:
        print(f"❌ Transformers: {e}")
        return False
    
    # Test Studio Backend AI Models
    try:
        from ai_models.model_manager import ModelManager
        print("✅ Studio Backend: ModelManager imported successfully")
        
        # Try to create a model manager instance
        mm = ModelManager()
        print("✅ ModelManager instance created")
        
        # Try to get a pipeline
        try:
            pipeline = mm.GetPipeline("sdxl", "txt2img")
            print("✅ Pipeline creation successful")
            return True
        except Exception as e:
            print(f"❌ Pipeline creation failed: {e}")
            return False
            
    except ImportError as e:
        print(f"❌ Artsynthesis: {e}")
        print("This appears to be a mock implementation")
        return False
    
    return True

def test_art_service():
    """Test the ArtService with actual implementation"""
    print("\nTesting ArtService...")
    print("=" * 30)
    
    try:
        from art_service import ArtService
        from config import settings
        
        service = ArtService()
        print("✅ ArtService created successfully")
        
        # Test generation (this should work if models are real)
        import asyncio
        
        async def test_generate():
            try:
                result = await service.generate(
                    prompt="A test image",
                    seed=42,
                    gen_config={"steps": 5}  # Use few steps for testing
                )
                
                if result and "image_base64" in result:
                    print("✅ Image generation successful")
                    print(f"   Backend: {result.get('backend')}")
                    print(f"   Image size: {len(result['image_base64'])} characters")
                    return True
                else:
                    print("❌ Image generation failed or returned no result")
                    return False
                    
            except Exception as e:
                print(f"❌ Image generation failed: {e}")
                return False
        
        # Run the test
        result = asyncio.run(test_generate())
        return result
        
    except Exception as e:
        print(f"❌ ArtService test failed: {e}")
        return False

def main():
    """Main test function"""
    print("Unified Editing Studio - AI Model Test")
    print("=" * 60)
    
    # Test dependencies
    deps_ok = test_dependencies()
    
    if deps_ok:
        # Test actual service
        service_ok = test_art_service()
        
        if service_ok:
            print("\n🎉 All tests passed! AI models are working correctly.")
            return True
        else:
            print("\n⚠️  Dependencies are available but service implementation has issues.")
            return False
    else:
        print("\n❌ AI dependencies are not available or properly installed.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)