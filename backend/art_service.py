import sys
import os
import torch
import logging
from typing import AsyncGenerator, Dict, Optional, Any, Callable, List
from PIL import Image
import io
import base64

from studio.backend.config import settings
from studio.backend.inference_dispatcher import dispatcher

# Add legacy tools to path for logic extraction
sys.path.append(os.path.abspath(settings.ARTSYNTHESIS_PATH))

try:
    from artsynthesis.modules import ModelManager, FeedbackIntegration
    from artsynthesis.utils import DeviceUtils
    from artsynthesis.config import ModelType, QuantizationType, StageType, StageConfig
except ImportError:
    logging.error("Failed to import legacy ArtSynthesis modules. Check settings.ARTSYNTHESIS_PATH.")

logger = logging.getLogger("studio.backend.art_service")

class ArtService:
    def __init__(self):
        self.model_manager = ModelManager()
        self.feedback_system = FeedbackIntegration()
        self.device = DeviceUtils.GetDevice()
        logger.info(f"ArtService initialized on device: {self.device}")

    async def generate(
        self,
        prompt: str,
        seed: int,
        config: Dict[str, Any],
        stream_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """
        Interactive image generation using the legacy SpriteGenerationPipeline logic.
        """
        logger.info(f"Generating image for prompt: {prompt[:50]}... [Seed: {seed}]")
        
        # Resolve ModelType from config string
        model_name = config.get("model", "sdxl").upper()
        try:
            model_type = ModelType[model_name]
        except KeyError:
            model_type = ModelType.SDXL

        # Route through dispatcher
        routing = await dispatcher.route_inference("generate_image", {"prompt": prompt, "seed": seed})
        
        if routing["backend"] == "local_gpu":
            return await self._generate_local(prompt, seed, config, model_type, stream_callback)
        else:
            return await self._generate_cpu(prompt, seed, config)

    async def inpaint(
        self,
        base_image_b64: str,
        mask_image_b64: str,
        prompt: str,
        seed: int,
        config: Dict[str, Any],
        stream_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """
        Specialized inpainting service evolved from legacy img2img logic.
        """
        logger.info(f"Inpainting image for prompt: {prompt[:50]}... [Seed: {seed}]")
        
        routing = await dispatcher.route_inference("inpaint_image", {"prompt": prompt, "seed": seed})
        
        if routing["backend"] == "local_gpu":
            return await self._inpaint_local(base_image_b64, mask_image_b64, prompt, seed, config, stream_callback)
        else:
            return await self._generate_cpu(prompt, seed, config)

    async def submit_feedback(self, seed: int, feedback_type: str, score: int) -> Dict[str, Any]:
        """Record human feedback for RLHF and quality tracking."""
        self.feedback_system.RecordScore(feedback_type, score)
        avg = self.feedback_system.GetAverageScore(feedback_type)
        return {"status": "recorded", "average": avg}

    async def _generate_local(
        self, 
        prompt: str, 
        seed: int, 
        config: Dict[str, Any],
        model_type: ModelType,
        stream_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """Local GPU generation with caching and optimizations."""
        pipe = self.model_manager.GetPipeline(
            model_type, 
            pipeline_type="txt2img",
            quantization=QuantizationType.NONE # Future: support quantization from config
        )
        
        generator = torch.Generator(device=self.device).manual_seed(seed)
        
        with torch.inference_mode():
            # Support basic streaming by splitting steps (advanced implementation)
            output = pipe(
                prompt=prompt,
                num_inference_steps=config.get("steps", 30),
                generator=generator
            )
            
        final_image = output.images[0]
        return {
            "image_b64": self._pil_to_b64(final_image),
            "seed": seed,
            "backend": "local_gpu"
        }

    async def _inpaint_local(
        self,
        base_image_b64: str,
        mask_image_b64: str,
        prompt: str,
        seed: int,
        config: Dict[str, Any],
        stream_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """Local GPU inpainting using dedicated inpaint pipelines."""
        base_image = self._b64_to_pil(base_image_b64)
        mask_image = self._b64_to_pil(mask_image_b64)
        
        # Fallback to img2img if inpaint model not specified (legacy behavior)
        model_name = config.get("model", "sdxl").upper()
        try:
            model_type = ModelType[model_name]
        except KeyError:
            model_type = ModelType.SDXL

        pipe = self.model_manager.GetPipeline(
            model_type,
            pipeline_type="img2img" if not mask_image_b64 else "inpaint"
        )
        
        generator = torch.Generator(device=self.device).manual_seed(seed)
        
        with torch.inference_mode():
            if mask_image_b64:
                output = pipe(
                    prompt=prompt,
                    image=base_image,
                    mask_image=mask_image,
                    num_inference_steps=config.get("steps", 30),
                    generator=generator
                )
            else:
                output = pipe(
                    prompt=prompt,
                    image=base_image,
                    num_inference_steps=config.get("steps", 30),
                    generator=generator
                )
            
        final_image = output.images[0]
        return {
            "image_b64": self._pil_to_b64(final_image),
            "seed": seed,
            "backend": "local_gpu"
        }

    async def _generate_cpu(self, prompt: str, seed: int, config: Dict[str, Any]) -> Dict[str, Any]:
        """CPU generation logic (Stub)."""
        return {"error": "CPU fallback not yet optimized", "backend": "cpu"}

    def _pil_to_b64(self, image: Image.Image) -> str:
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode("utf-8")

    def _b64_to_pil(self, b64_str: str) -> Image.Image:
        image_data = base64.b64decode(b64_str)
        return Image.open(io.BytesIO(image_data))

art_service = ArtService()
