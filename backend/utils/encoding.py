import io
import base64
import wave
import numpy as np
from PIL import Image
from typing import Union, Optional

def pil_to_base64(image: Image.Image, format: str = "PNG") -> str:
    """Converts a PIL Image to a base64 encoded string."""
    buffered = io.BytesIO()
    image.save(buffered, format=format)
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def base64_to_pil(base64_str: str) -> Image.Image:
    """Converts a base64 encoded string to a PIL Image."""
    image_data = base64.b64decode(base64_str)
    return Image.open(io.BytesIO(image_data))

def audio_to_base64(audio: np.ndarray, sample_rate: int = 22050, format: str = "wav") -> str:
    """
    Convert audio numpy array to base64 encoded string
    
    Args:
        audio: Numpy array of audio samples
        sample_rate: Sample rate in Hz
        format: Output format (wav, ogg, mp3)
    
    Returns:
        Base64 encoded string
    """
    # Normalize audio to 16-bit integer
    audio_int16 = np.int16(audio * 32767)
    
    # Create WAV file in memory
    with io.BytesIO() as wav_buffer:
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 2 bytes per sample
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_int16.tobytes())
        
        wav_buffer.seek(0)
        wav_data = wav_buffer.read()
    
    # Encode to base64
    base64_str = base64.b64encode(wav_data).decode('utf-8')
    return base64_str
