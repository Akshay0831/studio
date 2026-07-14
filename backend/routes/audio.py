from fastapi import APIRouter, HTTPException
from models.request_schemas import ComposeAudioRequest
from models.response_schemas import AudioResponse
from audio_service import audio_service

router = APIRouter(prefix="/audio", tags=["audio"])

@router.post("/compose", response_model=AudioResponse)
async def compose_audio(request: ComposeAudioRequest):
    try:
        result = await audio_service.compose(
            audio_config=request.model_dump(),
            seed=request.seed
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
async def submit_audio_feedback(seed: int, feedback_type: str, score: float, comment: str = ""):
    try:
        result = await audio_service.submit_feedback(seed, feedback_type, score, comment)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pause/{stream_id}")
async def pause_audio_stream(stream_id: int):
    return await audio_service.pause_stream(stream_id)

@router.post("/resume/{stream_id}")
async def resume_audio_stream(stream_id: int):
    return await audio_service.resume_stream(stream_id)
