# Professional image editing capabilities beyond AI generation

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Tuple
import numpy as np
import cv2
import io
import base64
from PIL import Image
import logging
from middleware.security import SecurityMiddleware

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/image-processing", tags=["image-processing"])

# Security middleware
security_middleware = SecurityMiddleware()

# Request/Response models
class LayerAdjustmentRequest(BaseModel):
    layer_id: str
    adjustment_type: str = Field(..., pattern="^brightness|contrast|saturation|hue|levels|curves$")
    value: float = Field(..., ge=-100, le=100)
    enabled: bool = True
    opacity: float = Field(1.0, ge=0, le=1)

class LayerMaskRequest(BaseModel):
    layer_id: str
    mask_type: str = Field(..., pattern="^alpha|grayscale|custom$")
    intensity: float = Field(1.0, ge=0, le=1)
    feather: float = Field(0, ge=0, le=100)
    mask_data: Optional[Dict[str, Any]] = None

class LayerBlendRequest(BaseModel):
    layer_ids: List[str]
    blend_mode: str = Field(..., pattern="^multiply|screen|overlay|soft-light|hard-light|difference|exclusion$")
    opacity: float = Field(1.0, ge=0, le=1)

class BatchProcessingRequest(BaseModel):
    operations: List[Dict[str, Any]]
    format: str = Field("png", pattern="^png|jpeg|tiff|webp$")
    quality: int = Field(90, ge=1, le=100)

class LayerHistoryRequest(BaseModel):
    layer_id: str
    action: str
    properties: Dict[str, Any]

# Image processing utilities
class ImageProcessor:
    @staticmethod
    def apply_adjustment(image: np.ndarray, adjustment_type: str, value: float) -> np.ndarray:
        """Apply non-destructive adjustments to image"""
        img = image.astype(np.float32)
        
        if adjustment_type == "brightness":
            img = np.clip(img + value, 0, 255)
        elif adjustment_type == "contrast":
            factor = (259 * (value + 255)) / (255 * (259 - value))
            img = np.clip(factor * (img - 128) + 128, 0, 255)
        elif adjustment_type == "saturation":
            gray = np.mean(img, axis=2, keepdims=True)
            img = np.clip(gray + value * (img - gray), 0, 255)
        elif adjustment_type == "hue":
            # Convert to HSV, adjust hue, convert back
            hsv = cv2.cvtColor(img.astype(np.uint8), cv2.COLOR_RGB2HSV)
            hsv[:, :, 0] = (hsv[:, :, 0] + value) % 180
            img = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
        
        return img.astype(np.uint8)
    
    @staticmethod
    def apply_layer_mask(image: np.ndarray, mask: np.ndarray, mask_type: str = "alpha", 
                        intensity: float = 1.0, feather: float = 0) -> np.ndarray:
        """Apply layer mask with feathering"""
        # Apply feathering if specified
        if feather > 0:
            mask = cv2.GaussianBlur(mask, (feather * 2 + 1, feather * 2 + 1), 0)
        
        # Normalize mask
        mask = np.clip(mask.astype(np.float32) * intensity, 0, 255)
        
        # Apply mask based on type
        if mask_type == "alpha":
            result = image.astype(np.float32) * (mask / 255.0)
        elif mask_type == "grayscale":
            gray_mask = np.mean(mask, axis=2, keepdims=True)
            result = image.astype(np.float32) * (gray_mask / 255.0)
        else:  # custom
            result = image.astype(np.float32) * (mask / 255.0)
        
        return np.clip(result, 0, 255).astype(np.uint8)
    
    @staticmethod
    def blend_images(images: List[np.ndarray], blend_mode: str, opacity: float = 1.0) -> np.ndarray:
        """Blend multiple images with specified blend mode"""
        if len(images) == 0:
            return np.zeros((512, 512, 3), dtype=np.uint8)
        
        result = images[0].astype(np.float32)
        
        for i in range(1, len(images)):
            img = images[i].astype(np.float32)
            
            if blend_mode == "multiply":
                result = result * img / 255.0
            elif blend_mode == "screen":
                result = 255 - (255 - result) * (255 - img) / 255.0
            elif blend_mode == "overlay":
                result = np.where(result < 128, 2 * result * img / 255.0, 255 - 2 * (255 - result) * (255 - img) / 255.0)
            elif blend_mode == "soft-light":
                result = np.where(result < 128, 2 * result * img / 255.0 + result * (1 - 2 * img / 255.0), 255 * (1 - 2 * (1 - result / 255.0) * (1 - img / 255.0)))
            else:
                # Default to normal blend for unsupported modes
                result = result * (1 - opacity) + img * opacity
            
            result = np.clip(result, 0, 255)
        
        return result.astype(np.uint8)
    
    @staticmethod
    def create_alpha_mask_from_selection(image: np.ndarray, selection_points: List[Tuple[int, int]]) -> np.ndarray:
        """Create alpha mask from selection points"""
        mask = np.zeros((image.shape[0], image.shape[1]), dtype=np.uint8)
        
        if len(selection_points) >= 3:
            # Fill polygon
            pts = np.array(selection_points, np.int32)
            cv2.fillPoly(mask, [pts], 255)
        
        return mask
    
    @staticmethod
    def apply_curves_adjustment(image: np.ndarray, curves_points: List[Tuple[int, int]]) -> np.ndarray:
        """Apply curves adjustment using control points"""
        if len(curves_points) < 2:
            return image
        
        # Create lookup table from control points
        x_points = [p[0] for p in curves_points]
        y_points = [p[1] for p in curves_points]
        
        # Sort points by x
        sorted_points = sorted(zip(x_points, y_points), key=lambda p: p[0])
        x_sorted, y_sorted = zip(*sorted_points)
        
        # Create interpolation function
        from scipy.interpolate import interp1d
        curve_func = interp1d(x_sorted, y_sorted, kind='linear', fill_value='extrapolate')
        
        # Apply curves
        img = image.astype(np.float32)
        for c in range(img.shape[2]):
            img[:, :, c] = curve_func(img[:, :, c])
        
        return np.clip(img, 0, 255).astype(np.uint8)

# In-memory layer storage (replace with database in production)
layers_db: Dict[str, Dict[str, Any]] = {}
layer_history_db: Dict[str, List[Dict[str, Any]]] = {}

@router.post("/adjustment")
async def apply_layer_adjustment(request: LayerAdjustmentRequest):
    """Apply non-destructive adjustment to layer"""
    try:
        # In a real implementation, get layer from storage
        if request.layer_id not in layers_db:
            raise HTTPException(status_code=404, detail="Layer not found")
        
        layer_data = layers_db[request.layer_id]
        
        # Apply adjustment using ImageProcessor
        image = np.array(layer_data['image_data'])
        adjusted_image = ImageProcessor.apply_adjustment(
            image, request.adjustment_type, request.value
        )
        
        # Store adjustment
        if 'adjustments' not in layer_data:
            layer_data['adjustments'] = []
        
        layer_data['adjustments'].append({
            'type': request.adjustment_type,
            'value': request.value,
            'enabled': request.enabled,
            'opacity': request.opacity,
            'timestamp': np.datetime64('now').astype(str)
        })
        
        # Update layer data
        layer_data['image_data'] = adjusted_image
        
        return {
            "success": True,
            "adjustment_applied": request.adjustment_type,
            "layer_id": request.layer_id
        }
        
    except Exception as e:
        logger.error(f"Failed to apply adjustment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mask")
async def apply_layer_mask(request: LayerMaskRequest):
    """Apply layer mask to image"""
    try:
        if request.layer_id not in layers_db:
            raise HTTPException(status_code=404, detail="Layer not found")
        
        layer_data = layers_db[request.layer_id]
        image = np.array(layer_data['image_data'])
        
        # Generate or load mask
        if request.mask_data:
            mask = np.array(request.mask_data['mask_array'])
        else:
            # Create default mask
            mask = np.ones((image.shape[0], image.shape[1]), dtype=np.uint8) * 255
        
        # Apply mask
        masked_image = ImageProcessor.apply_layer_mask(
            image, mask, request.mask_type, request.intensity, request.feather
        )
        
        # Store mask information
        layer_data['mask'] = {
            'type': request.mask_type,
            'intensity': request.intensity,
            'feather': request.feather,
            'mask_data': request.mask_data
        }
        
        return {
            "success": True,
            "mask_applied": True,
            "layer_id": request.layer_id
        }
        
    except Exception as e:
        logger.error(f"Failed to apply mask: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/blend")
async def blend_layers(request: LayerBlendRequest):
    """Blend multiple layers with specified mode"""
    try:
        images = []
        
        # Get all layer images
        for layer_id in request.layer_ids:
            if layer_id not in layers_db:
                raise HTTPException(status_code=404, detail=f"Layer {layer_id} not found")
            images.append(np.array(layers_db[layer_id]['image_data']))
        
        if len(images) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 layers to blend")
        
        # Blend images
        blended_image = ImageProcessor.blend_images(
            images, request.blend_mode, request.opacity
        )
        
        return {
            "success": True,
            "blended_image": base64.b64encode(blended_image).decode(),
            "blend_mode": request.blend_mode,
            "layer_ids": request.layer_ids
        }
        
    except Exception as e:
        logger.error(f"Failed to blend layers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-process")
async def batch_process_images(request: BatchProcessingRequest):
    """Process multiple images with batch operations"""
    try:
        results = []
        
        for operation in request.operations:
            try:
                # Extract operation parameters
                image_data = base64.b64decode(operation['image_data'])
                image = np.array(Image.open(io.BytesIO(image_data)))
                
                # Apply operations based on type
                if operation['type'] == 'resize':
                    image = cv2.resize(image, (operation['width'], operation['height']))
                elif operation['type'] == 'crop':
                    image = image[operation['y']:operation['y']+operation['height'], 
                                operation['x']:operation['x']+operation['width']]
                elif operation['type'] == 'filter':
                    image = ImageProcessor.apply_adjustment(
                        image, operation['filter_type'], operation['value']
                    )
                
                # Encode result
                result_image = base64.b64encode(cv2.imencode('.png', image)[1]).decode()
                results.append({
                    "success": True,
                    "result_image": result_image,
                    "operation": operation
                })
                
            except Exception as op_error:
                results.append({
                    "success": False,
                    "error": str(op_error),
                    "operation": operation
                })
        
        return {
            "success": True,
            "results": results,
            "total_operations": len(request.operations),
            "successful": len([r for r in results if r['success']]),
            "failed": len([r for r in results if not r['success']])
        }
        
    except Exception as e:
        logger.error(f"Failed to batch process: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/history")
async def add_history_entry(request: LayerHistoryRequest):
    """Add history entry for layer"""
    try:
        if request.layer_id not in layer_history_db:
            layer_history_db[request.layer_id] = []
        
        layer_history_db[request.layer_id].append({
            'action': request.action,
            'properties': request.properties,
            'timestamp': np.datetime64('now').astype(str)
        })
        
        return {
            "success": True,
            "history_entry_added": True,
            "layer_id": request.layer_id
        }
        
    except Exception as e:
        logger.error(f"Failed to add history entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{layer_id}")
async def get_layer_history(layer_id: str):
    """Get history for specific layer"""
    try:
        history = layer_history_db.get(layer_id, [])
        return {
            "success": True,
            "history": history,
            "layer_id": layer_id
        }
        
    except Exception as e:
        logger.error(f"Failed to get history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/selection/mask")
async def create_mask_from_selection(
    image_data: str,
    selection_points: List[Tuple[int, int]],
    mask_type: str = "alpha"
):
    """Create alpha mask from selection points"""
    try:
        # Decode image
        image_bytes = base64.b64decode(image_data)
        image = np.array(Image.open(io.BytesIO(image_bytes)))
        
        # Create mask
        mask = ImageProcessor.create_alpha_mask_from_selection(image, selection_points)
        
        return {
            "success": True,
            "mask": base64.b64encode(mask).decode(),
            "mask_type": mask_type
        }
        
    except Exception as e:
        logger.error(f"Failed to create mask from selection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/blend-modes")
async def get_blend_modes():
    """Get available blend modes"""
    return {
        "success": True,
        "blend_modes": [
            "normal", "multiply", "screen", "overlay", "soft-light", "hard-light",
            "color-dodge", "color-burn", "difference", "exclusion", "hue", 
            "saturation", "color", "luminosity"
        ]
    }

@router.get("/adjustments")
async def get_adjustment_types():
    """Get available adjustment types"""
    return {
        "success": True,
        "adjustment_types": [
            "brightness", "contrast", "saturation", "hue", "levels", "curves"
        ]
    }