import logging
import torch
from typing import Dict, Optional, Any, Callable, List

from config import settings
from inference_dispatcher import dispatcher
from utils.telemetry import trace_performance
from utils.cache import generation_cache
from utils.encoding import pil_to_base64, base64_to_pil

from utils.dependency_manager import DependencyManager

# Engine imports via safety layer
ModelManager = DependencyManager.get_attr("artsynthesis.modules", "ModelManager")
FeedbackIntegration = DependencyManager.get_attr("artsynthesis.modules", "FeedbackIntegration")
DeviceUtils = DependencyManager.get_attr("artsynthesis.utils", "DeviceUtils")
ModelType = DependencyManager.get_attr("artsynthesis.config", "ModelType")
QuantizationType = DependencyManager.get_attr("artsynthesis.config", "QuantizationType")

# Fallbacks if engines are missing
if not ModelManager:
    class ModelType: SDXL = "sdxl"; FLUX = "flux"
    class QuantizationType: NONE = "none"
    class ModelManager:
        def __init__(self): pass
        def GetPipeline(self, *args, **kwargs):
            class DummyPipe:
                def __call__(self, *args, **kwargs):
                    class DummyResult: images = [None]
                    return DummyResult()
            return DummyPipe()
    class FeedbackIntegration:
        def __init__(self): pass
        def RecordScore(self, *args): pass
        def GetAverageScore(self, *args): return 0.0
    class DeviceUtils:
        @staticmethod
        def GetDevice(): return "cpu"

from utils.batch_processor import batch_processor

from utils.base_service import BaseStudioService

logger = logging.getLogger("studio.backend.art_service")

class ArtService(BaseStudioService):
    def __init__(self):
        super().__init__("art")
        self.model_manager = ModelManager()
        self.feedback_system = FeedbackIntegration()
        self.device = DeviceUtils.GetDevice()
        
        # Register batch handlers
        batch_processor.register_handler("generate_image", self._handle_batch_generate)

    async def _handle_batch_generate(self, tasks: List[Any]) -> List[Any]:
        """Internal handler for BatchProcessor."""
        if not tasks:
            return []
            
        # Coalesce tasks
        prompt = tasks[0].params["prompt"] # Simplified: assume same prompt for now
        seeds = [t.params["seed"] for t in tasks]
        gen_config = tasks[0].params.get("gen_config", {})
        
        async def unified_stream_callback(progress_data):
            # Broadcast progress to all tasks in the batch
            import asyncio
            await asyncio.gather(*[
                t.callback(progress_data) for t in tasks if t.callback
            ])
        
        model_name = gen_config.get("model", "sdxl").upper()
        model_type = getattr(ModelType, model_name, ModelType.SDXL)
        
        return await self._generate_batch_local(prompt, seeds, gen_config, model_type, unified_stream_callback)

    @trace_performance("generate_image")
    async def generate(
        self,
        prompt: str,
        seed: int,
        gen_config: Dict[str, Any],
        stream_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """Generates an image using the diffusion pipeline."""
        cached_result = generation_cache.get(prompt, seed, gen_config)
        if cached_result:
            if stream_callback:
                await stream_callback({"progress": 100, "status": "completed"})
            return cached_result

        logger.info(f"Generating image | Prompt: {prompt[:50]}... | Seed: {seed}")
        
        routing = await self.route_and_execute("generate_image", {"prompt": prompt, "seed": seed})
        
        if routing["backend"] == "local_gpu":
            model_name = gen_config.get("model", "sdxl").upper()
            model_type = getattr(ModelType, model_name, ModelType.SDXL)
            
            # Using the unified run_with_progress
            # Note: _generate_local handles its own internal progress via callback_on_step_end
            # but we can wrap it if we want simulated progress for non-callback pipelines
            result = await self._generate_local(prompt, seed, gen_config, model_type, stream_callback)
            
            if result and "error" not in result:
                generation_cache.set(prompt, seed, gen_config, result)
            return result
        else:
            return {"error": "Non-local GPU generation not yet optimized in service layer", "routing": routing}

    @trace_performance("inpaint_image")
    async def inpaint(
        self,
        base_image_b64: str,
        mask_image_b64: str,
        prompt: str,
        seed: int,
        gen_config: Dict[str, Any],
        stream_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """Performs inpainting on a masked region."""
        import hashlib
        img_hash = hashlib.md5((base_image_b64 + mask_image_b64).encode()).hexdigest()
        inpaint_config = {**gen_config, "img_hash": img_hash}
        
        cached_result = generation_cache.get(prompt, seed, inpaint_config)
        if cached_result:
            if stream_callback:
                await stream_callback({"progress": 100, "status": "completed"})
            return cached_result

        logger.info(f"Inpainting image | Prompt: {prompt[:50]}... | Seed: {seed}")
        
        routing = await self.route_and_execute("inpaint_image", {"prompt": prompt, "seed": seed})
        
        if routing["backend"] == "local_gpu":
            result = await self._inpaint_local(base_image_b64, mask_image_b64, prompt, seed, gen_config, stream_callback)
            generation_cache.set(prompt, seed, inpaint_config, result)
            return result
        else:
            return {"error": "Fallback inpainting not implemented", "backend": routing["backend"]}

    async def generate_batch(
        self,
        prompt: str,
        seeds: List[int],
        gen_config: Dict[str, Any],
        stream_callback: Optional[Callable] = None
    ) -> List[Dict[str, Any]]:
        """Generates a batch of images for the same prompt with different seeds."""
        results = []
        seeds_to_generate = []
        
        for seed in seeds:
            cached = generation_cache.get(prompt, seed, gen_config)
            if cached:
                results.append(cached)
            else:
                seeds_to_generate.append(seed)
        
        if not seeds_to_generate:
            if stream_callback:
                steps = gen_config.get("steps", 30)
                await stream_callback({"step": steps, "total_steps": steps, "progress": 100})
            return results

        logger.info(f"Generating batch of {len(seeds_to_generate)} images | Prompt: {prompt[:50]}...")
        
        model_name = gen_config.get("model", "sdxl").upper()
        model_type = getattr(ModelType, model_name, ModelType.SDXL)

        routing = await dispatcher.route_inference("generate_image", {"prompt": prompt, "seeds": seeds_to_generate})
        
        if routing["backend"] == "local_gpu":
            batch_results = await self._generate_batch_local(prompt, seeds_to_generate, gen_config, model_type, stream_callback)
        else:
            batch_results = []
            for seed in seeds_to_generate:
                batch_results.append(await self._generate_cpu(prompt, seed, gen_config))
        
        for i, res in enumerate(batch_results):
            generation_cache.set(prompt, seeds_to_generate[i], gen_config, res)
            results.append(res)
            
        return results

    @trace_performance("local_gpu_batch_generation")
    async def _generate_batch_local(
        self,
        prompt: str,
        seeds: List[int],
        gen_config: Dict[str, Any],
        model_type: ModelType,
        stream_callback: Optional[Callable] = None
    ) -> List[Dict[str, Any]]:
        """Local GPU batch generation."""
        diffusion_pipeline = self.model_manager.GetPipeline(
            model_type, 
            pipeline_type="txt2img",
            quantization=QuantizationType.NONE
        )
        
        inference_steps = gen_config.get("steps", 30)
        num_images = len(seeds)
        
        # Apply model-specific tools
        if model_type == ModelType.FLUX:
            if gen_config.get("ultra_detail"):
                logger.info("Flux Extension | Ultra Detail enabled")
                inference_steps = int(inference_steps * 1.5)
        elif model_type == ModelType.SDXL:
            if gen_config.get("fast_mode"):
                logger.info("SDXL Extension | Fast Mode enabled")
                inference_steps = max(10, int(inference_steps * 0.5))

        def callback_on_step_end(pipe, i, t, callback_kwargs):
            if stream_callback:
                import asyncio
                progress = int((i + 1) / inference_steps * 100)
                asyncio.run_coroutine_threadsafe(
                    stream_callback({"step": i, "total_steps": inference_steps, "progress": progress}),
                    asyncio.get_event_loop()
                )
            return callback_kwargs

        def run_inference():
            with torch.inference_mode():
                generators = [torch.Generator(device=self.device).manual_seed(s) for s in seeds]
                return diffusion_pipeline(
                    prompt=[prompt] * num_images,
                    num_inference_steps=inference_steps,
                    generator=generators,
                    callback_on_step_end=callback_on_step_end if stream_callback else None
                )

        import asyncio
        generation_output = await asyncio.to_thread(run_inference)
            
        results = []
        for i, image in enumerate(generation_output.images):
            results.append({
                "image_base64": pil_to_base64(image),
                "seed": seeds[i],
                "backend": "local_gpu"
            })
        return results

    @trace_performance("local_gpu_generation")
    async def _generate_local(
        self, 
        prompt: str, 
        seed: int, 
        gen_config: Dict[str, Any],
        model_type: ModelType,
        stream_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """Local GPU generation."""
        diffusion_pipeline = self.model_manager.GetPipeline(
            model_type, 
            pipeline_type="txt2img",
            quantization=QuantizationType.NONE
        )
        
        generator = torch.Generator(device=self.device).manual_seed(seed)
        inference_steps = gen_config.get("steps", 30)

        def callback_on_step_end(pipe, i, t, callback_kwargs):
            if stream_callback:
                import asyncio
                progress = int((i + 1) / inference_steps * 100)
                asyncio.run_coroutine_threadsafe(
                    stream_callback({"step": i, "total_steps": inference_steps, "progress": progress}),
                    asyncio.get_event_loop()
                )
            return callback_kwargs

        def run_inference():
            with torch.inference_mode():
                return diffusion_pipeline(
                    prompt=prompt,
                    num_inference_steps=inference_steps,
                    generator=generator,
                    callback_on_step_end=callback_on_step_end if stream_callback else None
                )

        import asyncio
        generation_output = await asyncio.to_thread(run_inference)
            
        final_image = generation_output.images[0]
        return {
            "image_base64": pil_to_base64(final_image),
            "seed": seed,
            "backend": "local_gpu"
        }

    @trace_performance("local_gpu_inpaint")
    async def _inpaint_local(
        self,
        base_image_base64: str,
        mask_image_base64: str,
        prompt: str,
        seed: int,
        gen_config: Dict[str, Any],
        stream_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """Local GPU inpainting."""
        base_image = base64_to_pil(base_image_base64)
        mask_image = base64_to_pil(mask_image_base64)
        
        model_name = gen_config.get("model", "sdxl").upper()
        model_type = getattr(ModelType, model_name, ModelType.SDXL)

        diffusion_pipeline = self.model_manager.GetPipeline(
            model_type,
            pipeline_type="img2img" if not mask_image_base64 else "inpaint"
        )
        
        generator = torch.Generator(device=self.device).manual_seed(seed)
        inference_steps = gen_config.get("steps", 30)

        def callback_on_step_end(pipe, i, t, callback_kwargs):
            if stream_callback:
                import asyncio
                progress = int((i + 1) / inference_steps * 100)
                asyncio.run_coroutine_threadsafe(
                    stream_callback({"step": i, "total_steps": inference_steps, "progress": progress}),
                    asyncio.get_event_loop()
                )
            return callback_kwargs

        def run_inference():
            with torch.inference_mode():
                if mask_image_base64:
                    return diffusion_pipeline(
                        prompt=prompt,
                        image=base_image,
                        mask_image=mask_image,
                        num_inference_steps=inference_steps,
                        generator=generator,
                        callback_on_step_end=callback_on_step_end if stream_callback else None
                    )
                else:
                    return diffusion_pipeline(
                        prompt=prompt,
                        image=base_image,
                        num_inference_steps=inference_steps,
                        generator=generator,
                        callback_on_step_end=callback_on_step_end if stream_callback else None
                    )

        import asyncio
        generation_output = await asyncio.to_thread(run_inference)
            
        final_image = generation_output.images[0]
        return {
            "image_base64": pil_to_base64(final_image),
            "seed": seed,
            "backend": "local_gpu"
        }

    async def _generate_cpu(self, prompt: str, seed: int, gen_config: Dict[str, Any]) -> Dict[str, Any]:
        """CPU generation logic."""
        return {"error": "CPU fallback not yet optimized", "backend": "cpu"}

    async def submit_feedback(self, seed: int, feedback_type: str, score: int) -> Dict[str, Any]:
        """Record human feedback for quality tracking."""
        self.feedback_system.RecordScore(feedback_type, score)
        avg = self.feedback_system.GetAverageScore(feedback_type)
        return {"status": "recorded", "average": avg}

art_service = ArtService()
