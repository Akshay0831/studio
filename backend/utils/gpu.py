import torch
import logging

logger = logging.getLogger("studio.backend.utils.gpu")

def get_vram_info():
    """Returns VRAM usage information if CUDA is available."""
    if not torch.cuda.is_available():
        return None
    
    try:
        device = torch.cuda.current_device()
        total_memory = torch.cuda.get_device_properties(device).total_memory
        allocated_memory = torch.cuda.memory_allocated(device)
        reserved_memory = torch.cuda.memory_reserved(device)
        
        return {
            "total_mb": total_memory // (1024 * 1024),
            "allocated_mb": allocated_memory // (1024 * 1024),
            "reserved_mb": reserved_memory // (1024 * 1024),
            "free_mb": (total_memory - reserved_memory) // (1024 * 1024)
        }
    except Exception as e:
        logger.error(f"Failed to get VRAM info: {e}")
        return None
