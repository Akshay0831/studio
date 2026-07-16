import torch
from diffusers import StableDiffusionXLPipeline
from transformers import CLIPTextModel, CLIPTextModel2

# Direct load without safetensors
model_id = "stabilityai/stable-diffusion-xl-base-1.0"

print(f"Loading model components directly...")
text_encoder = CLIPTextModel.from_pretrained(
    model_id,
    subfolder="text_encoder",
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
)
print("Text encoder loaded successfully")

text_encoder_2 = CLIPTextModel2.from_pretrained(
    model_id,
    subfolder="text_encoder_2",
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
)
print("Text encoder 2 loaded successfully")

print(f"\nText encoder type: {type(text_encoder)}")
print(f"Text encoder device: {text_encoder.device}")
print(f"Text encoder 2 type: {type(text_encoder_2)}")
print(f"Text encoder 2 device: {text_encoder_2.device}")
