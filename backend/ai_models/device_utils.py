"""
Device Utilities for AI Model Management
"""

import torch
import logging
from typing import Optional, Literal
from .model_types import ModelType, QuantizationType

logger = logging.getLogger(__name__)

class DeviceUtils:
    """Utility class for managing device selection and configuration"""
    
    def __init__(self):
        self.device_type = self._detect_best_device()
        self.device = torch.device(self.device_type)
        
    def _detect_best_device(self) -> str:
        """Detect the best available device for AI inference"""
        # Check for CUDA first
        if torch.cuda.is_available():
            device_name = torch.cuda.get_device_name()
            logger.info(f"CUDA GPU detected: {device_name}")
            return "cuda"
        
        # Check for Apple Silicon (MPS)
        elif torch.backends.mps.is_available():
            logger.info("Apple Silicon (MPS) detected")
            return "mps"
            
        # Check for ROCm (AMD GPUs)
        elif torch.cuda.is_available() and torch.version.hip:
            logger.info("ROCm (AMD GPU) detected")
            return "cuda"  # CUDA API for ROCm
            
        # Fallback to CPU
        else:
            logger.info("No GPU detected, using CPU")
            return "cpu"
    
    def get_device(self) -> str:
        """Get the current device as string"""
        return str(self.device)
    
    def get_memory_info(self) -> dict:
        """Get available memory information"""
        info = {}
        
        if self.device_type == "cuda" and torch.cuda.is_available():
            total_memory = torch.cuda.get_device_properties(self.device).total_memory / 1024**3
            available_memory = torch.cuda.get_device_properties(self.device).total_memory / 1024**3
            info = {
                "device": self.device_type,
                "total_gb": round(total_memory, 2),
                "available_gb": round(available_memory, 2),
                "device_name": torch.cuda.get_device_name()
            }
        elif self.device_type == "mps":
            # MPS memory info (limited availability)
            info = {
                "device": self.device_type,
                "note": "Apple Silicon memory management"
            }
        else:
            info = {
                "device": "cpu",
                "note": "CPU inference"
            }
            
        return info
    
    def is_gpu_available(self) -> bool:
        """Check if GPU is available"""
        return self.device_type in ["cuda", "mps"]
    
    def get_optimal_batch_size(self, model_size: str = "large") -> int:
        """Get optimal batch size based on available memory"""
        if not self.is_gpu_available():
            return 1  # CPU-only, use batch size 1
            
        memory_info = self.get_memory_info()
        total_memory = memory_info.get("total_gb", 8)
        
        if model_size == "small":
            return min(4, int(total_memory / 2))
        elif model_size == "medium":
            return min(2, int(total_memory / 4))
        else:  # large
            return 1

# Global instance
_device_utils = None

def get_device_utils() -> DeviceUtils:
    """Get global device utils instance"""
    global _device_utils
    if _device_utils is None:
        _device_utils = DeviceUtils()
    return _device_utils

def get_device() -> str:
    """Get current device (legacy compatibility)"""
    return get_device_utils().get_device()

if __name__ == "__main__":
    # Test device detection
    du = DeviceUtils()
    print(f"Device: {du.get_device()}")
    print(f"Memory Info: {du.get_memory_info()}")