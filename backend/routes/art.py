from fastapi import APIRouter, HTTPException
from studio.backend.models.request_schemas import GenerateImageRequest, InpaintImageRequest
from studio.backend.models.response_schemas import ImageResponse
from studio.backend.art_service import art_service

router = APIRouter(prefix="/art", tags=["art"])

@router.post("/generate", response_model=ImageResponse)
async def generate_image(request: GenerateImageRequest):
    try:
        result = await art_service.generate(
            prompt=request.prompt,
            seed=request.seed,
            gen_config=request.config
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/inpaint", response_model=ImageResponse)
async def inpaint_image(request: InpaintImageRequest):
    try:
        result = await art_service.inpaint(
            base_image_b64=request.base_image,
            mask_image_b64=request.mask_image,
            prompt=request.prompt,
            seed=request.seed,
            gen_config=request.config
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
async def submit_art_feedback(seed: int, feedback_type: str, score: int):
    try:
        result = await art_service.submit_feedback(seed, feedback_type, score)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
