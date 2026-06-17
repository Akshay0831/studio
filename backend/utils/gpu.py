import torch
import logging
import os
import subprocess

logger = logging.getLogger("studio.backend.utils.gpu")

def get_vram_info():
    """Returns VRAM usage information if a supported GPU is available."""
    if torch.cuda.is_available():
        try:
            device = torch.cuda.current_device()
            total_memory = torch.cuda.get_device_properties(device).total_memory
            allocated_memory = torch.cuda.memory_allocated(device)
            reserved_memory = torch.cuda.memory_reserved(device)
            
            return {
                "total_mb": total_memory // (1024 * 1024),
                "allocated_mb": allocated_memory // (1024 * 1024),
                "reserved_mb": reserved_memory // (1024 * 1024),
                "free_mb": (total_memory - reserved_memory) // (1024 * 1024),
                "device_type": "cuda"
            }
        except Exception as e:
            logger.error(f"Failed to get CUDA VRAM info: {e}")
            return None
            
    if torch.backends.mps.is_available():
        # MPS doesn't provide direct memory stats via torch yet in a stable way
        # We can try to use 'system_profiler' on macOS for a rough estimate if needed
        return {
            "total_mb": 0, # Unknown without system tools
            "allocated_mb": 0,
            "reserved_mb": 0,
            "free_mb": 4000, # Assume 4GB free as a safe default for MPS for now
            "device_type": "mps"
        }
        
    return {
        "total_mb": 0,
        "allocated_mb": 0,
        "reserved_mb": 0,
        "free_mb": 0,
        "device_type": "cpu"
    }
