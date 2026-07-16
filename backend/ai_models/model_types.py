"""
Model Types and Quantization Enums
"""

from enum import Enum
from typing import Literal

class ModelType(Enum):
    """Supported AI model types"""
    SDXL = "sdxl"
    SD15 = "sd15" 
    FLUX = "flux"
    STABLE_DIFFUSION = "stable_diffusion"
    
    @property
    def value(self) -> str:
        """Return the string value (compatibility with artsynthesis)"""
        return self._value_

class QuantizationType(Enum):
    """Quantization options for model optimization"""
    NONE = "none"
    INT8 = "int8"
    FP16 = "fp16"
    
    @property
    def value(self) -> str:
        """Return the string value (compatibility with artsynthesis)"""
        return self._value_

# Convenience mappings
MODEL_TYPE_MAPPING = {
    "sdxl": ModelType.SDXL,
    "sd15": ModelType.SD15,
    "flux": ModelType.FLUX,
    "stable_diffusion": ModelType.STABLE_DIFFUSION
}

QUANTIZATION_MAPPING = {
    "none": QuantizationType.NONE,
    "int8": QuantizationType.INT8,
    "fp16": QuantizationType.FP16
}

def get_model_type(model_name: str) -> ModelType:
    """Get ModelType from string name"""
    return MODEL_TYPE_MAPPING.get(model_name.lower(), ModelType.SDXL)

def get_quantization_type(quant_name: str) -> QuantizationType:
    """Get QuantizationType from string name"""
    return QUANTIZATION_MAPPING.get(quant_name.lower(), QuantizationType.NONE)