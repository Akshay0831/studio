import logging
import torch
from typing import Dict, Optional, Any, Callable, List

from config.config import Settings
settings = Settings()
from inference_dispatcher import dispatcher
from utils.telemetry import trace_performance
from utils.cache import generation_cache
from utils.encoding import pil_to_base64, base64_to_pil

# Use our real AI implementations instead of mocks
from ai_models.model_manager import ModelManager, get_model_manager
from ai_models.device_utils import DeviceUtils, get_device
from ai_models.model_types import ModelType, QuantizationType

# Mock feedback integration for now (we'll implement this properly later)
class FeedbackIntegration:
    def __init__(self):
        pass
    def RecordScore(self, *args): pass
    def GetAverageScore(self, *args): return 0.0

from utils.batch_processor import batch_processor
from utils.timeout import async_with_timeout
from utils.base_service import BaseStudioService

logger = logging.getLogger("studio.backend.art_service")

class ArtService(BaseStudioService):
    def __init__(self):
        super().__init__("art")
        self.model_manager = ModelManager()  # Use separate instance for better memory control
        self.feedback_system = FeedbackIntegration()
        self.device = get_device()
        
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
        
        # API key selection and routing
        from config.api_key_manager import api_key_manager
        current_profile = api_key_manager.get_current_profile()
        
        if not current_profile:
            return {"error": "No active API profile selected"}
        
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
        elif routing["backend"] == "api":
            # Use API key for external AI service
            api_config = {
                "prompt": prompt,
                "seed": seed,
                "gen_config": gen_config,
                "api_key": current_profile.api_key,
                "api_type": current_profile.api_type,
                "model": gen_config.get("model", current_profile.default_model)
            }
            return await self._generate_api(api_config, stream_callback)
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
        
        # API key selection and routing
        from config.api_key_manager import api_key_manager
        current_profile = api_key_manager.get_current_profile()
        
        if not current_profile:
            return {"error": "No active API profile selected"}
        
        routing = await self.route_and_execute("inpaint_image", {"prompt": prompt, "seed": seed})
        
        if routing["backend"] == "local_gpu":
            result = await self._inpaint_local(base_image_b64, mask_image_b64, prompt, seed, gen_config, stream_callback)
            generation_cache.set(prompt, seed, inpaint_config, result)
            return result
        elif routing["backend"] == "api":
            # Use API key for external AI service
            api_config = {
                "prompt": prompt,
                "seed": seed,
                "gen_config": gen_config,
                "api_key": current_profile.api_key,
                "api_type": current_profile.api_type
            }
            return await self._inpaint_api(api_config, stream_callback)
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

        generation_output = await async_with_timeout(
            asyncio.to_thread(run_inference),
            timeout_seconds=settings.BATCH_INFERENCE_TIMEOUT,
            timeout_error=f"Batch generation timeout after {settings.BATCH_INFERENCE_TIMEOUT} seconds"
        )

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

        generation_output = await async_with_timeout(
            asyncio.to_thread(run_inference),
            timeout_seconds=settings.INFERENCE_TIMEOUT,
            timeout_error=f"Image generation timeout after {settings.INFERENCE_TIMEOUT} seconds"
        )

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

        generation_output = await async_with_timeout(
            asyncio.to_thread(run_inference),
            timeout_seconds=settings.INFERENCE_TIMEOUT,
            timeout_error=f"Inpainting timeout after {settings.INFERENCE_TIMEOUT} seconds"
        )

        final_image = generation_output.images[0]
        return {
            "image_base64": pil_to_base64(final_image),
            "seed": seed,
            "backend": "local_gpu"
        }

    async def _generate_cpu(self, prompt: str, seed: int, gen_config: Dict[str, Any]) -> Dict[str, Any]:
        """CPU generation logic."""
        return {"error": "CPU fallback not yet optimized", "backend": "cpu"}

    async def _generate_api(self, config: Dict[str, Any], stream_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """API-based image generation using external AI services."""
        import requests
        import time
        
        api_type = config.get("api_type")
        api_key = config.get("api_key")
        prompt = config.get("prompt")
        seed = config.get("seed")
        gen_config = config.get("gen_config", {})
        model = config.get("model")
        
        logger.info(f"API generation | Type: {api_type} | Model: {model} | Prompt: {prompt[:50]}...")
        
        try:
            if api_type == "replicate":
                result = await self._generate_replicate(prompt, seed, gen_config, model, stream_callback)
            elif api_type == "runpod":
                result = await self._generate_runpod(prompt, seed, gen_config, model, stream_callback)
            elif api_type == "openai":
                result = await self._generate_openai(prompt, seed, gen_config, model, stream_callback)
            else:
                return {"error": f"Unsupported API type: {api_type}"}
            
            if result and "error" not in result:
                generation_cache.set(prompt, seed, gen_config, result)
            return result
            
        except Exception as e:
            logger.error(f"API generation failed: {str(e)}")
            return {"error": f"API generation failed: {str(e)}"}

    async def _generate_replicate(self, prompt: str, seed: int, gen_config: Dict[str, Any], model: str, stream_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """Replicate API-based image generation."""
        import requests
        import json
        
        try:
            headers = {
                "Authorization": f"Token {api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "input": {
                    "prompt": gen_config.get("default_prompt", "") + prompt,
                    "negative_prompt": gen_config.get("negative_prompt", ""),
                    "num_inference_steps": gen_config.get("steps", 30),
                    "guidance_scale": gen_config.get("cfg", 7.5),
                    "width": int(gen_config.get("size", "1024x1024").split("x")[0]),
                    "height": int(gen_config.get("size", "1024x1024").split("x")[1])
                },
                "version": f"{model}-latest"
            }
            
            response = requests.post(
                "https://api.replicate.com/v1/predictions",
                headers=headers,
                json=data,
                timeout=300
            )
            
            if response.status_code != 201:
                return {"error": f"Replicate API error: {response.status_code} - {response.text}"}
            
            prediction = response.json()
            prediction_url = prediction.get("urls", {}).get("get", "")
            
            # Poll for completion
            while True:
                status_response = requests.get(prediction_url, headers=headers, timeout=300)
                status = status_response.json()
                
                if status.get("status") == "succeeded":
                    # Extract image URL
                    output_url = status.get("output", [])
                    if output_url:
                        image_response = requests.get(output_url[0], timeout=300)
                        return {
                            "image_base64": image_response.content.decode('utf-8') if image_response.text.startswith('data:image/') else f"data:image/png;base64,{image_response.content.decode('base64')}",
                            "seed": seed,
                            "backend": "api"
                        }
                
                elif status.get("status") == "failed":
                    return {"error": f"Replicate generation failed: {status.get('error', 'Unknown error')}"}
                
                # Progress reporting
                progress = status.get("logs", [""])
                if progress and stream_callback:
                    await stream_callback({"progress": 50, "status": "processing", "message": progress[-1]})
                
                time.sleep(2)
                
        except Exception as e:
            logger.error(f"Replicate API generation failed: {str(e)}")
            return {"error": f"Replicate API generation failed: {str(e)}"}

    async def _generate_runpod(self, prompt: str, seed: int, gen_config: Dict[str, Any], model: str, stream_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """RunPod API-based image generation."""
        import requests
        import json
        
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "input": {
                    "prompt": prompt,
                    "negative_prompt": gen_config.get("negative_prompt", ""),
                    "steps": gen_config.get("steps", 30),
                    "guidance_scale": gen_config.get("cfg", 7.5),
                    "width": int(gen_config.get("size", "1024x1024").split("x")[0]),
                    "height": int(gen_config.get("size", "1024x1024").split("x")[1]),
                    "seed": seed
                },
                "model": model
            }
            
            response = requests.post(
                "https://api.runpod.ai/v2/runpod-worker-stream/predict",
                headers=headers,
                json=data,
                timeout=300
            )
            
            if response.status_code != 200:
                return {"error": f"RunPod API error: {response.status_code} - {response.text}"}
            
            result = response.json()
            output_url = result.get("output", {}).get("url")
            
            if output_url:
                image_response = requests.get(output_url, timeout=300)
                return {
                    "image_base64": image_response.content.decode('utf-8') if image_response.text.startswith('data:image/') else f"data:image/png;base64,{image_response.content.decode('base64')}",
                    "seed": seed,
                    "backend": "api"
                }
            
            return {"error": "RunPod generation failed: No output URL returned"}
            
        except Exception as e:
            logger.error(f"RunPod API generation failed: {str(e)}")
            return {"error": f"RunPod API generation failed: {str(e)}"}

    async def _generate_openai(self, prompt: str, seed: int, gen_config: Dict[str, Any], model: str, stream_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """OpenAI API-based image generation."""
        import requests
        import json
        
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "prompt": prompt,
                "n": 1,
                "size": gen_config.get("size", "1024x1024"),
                "quality": gen_config.get("quality", "standard"),
                "seed": seed
            }
            
            response = requests.post(
                "https://api.openai.com/v1/images/generations",
                headers=headers,
                json=data,
                timeout=300
            )
            
            if response.status_code != 200:
                return {"error": f"OpenAI API error: {response.status_code} - {response.text}"}
            
            result = response.json()
            image_data = result.get("data", [])[0]
            image_url = image_data.get("url")
            
            if image_url:
                image_response = requests.get(image_url, timeout=300)
                return {
                    "image_base64": image_response.content.decode('utf-8') if image_response.text.startswith('data:image/') else f"data:image/png;base64,{image_response.content.decode('base64')}",
                    "seed": seed,
                    "backend": "api"
                }
            
            return {"error": "OpenAI generation failed: No image URL returned"}
            
        except Exception as e:
            logger.error(f"OpenAI API generation failed: {str(e)}")
            return {"error": f"OpenAI API generation failed: {str(e)}"}

    async def _inpaint_api(self, config: Dict[str, Any], stream_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """API-based image inpainting using external AI services."""
        # Similar implementation to _generate_api but for inpainting
        # This would use the appropriate API's inpainting endpoint
        return {"error": "API inpainting not yet implemented"}

    async def submit_feedback(self, seed: int, feedback_type: str, score: int) -> Dict[str, Any]:
        """Record human feedback for quality tracking."""
        self.feedback_system.RecordScore(feedback_type, score)
        avg = self.feedback_system.GetAverageScore(feedback_type)
        return {"status": "recorded", "average": avg}

art_service = ArtService()
