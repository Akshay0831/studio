import torch
from diffusers import StableDiffusionXLPipeline

model_id = "stabilityai/stable-diffusion-xl-base-1.0"

print(f"Loading pipeline directly (without ModelManager)...")
pipeline = StableDiffusionXLPipeline.from_pretrained(
    model_id,
    torch_dtype=torch.float16
)
print(f"Pipeline created")
print(f"Pipeline device: {pipeline.device}")
print(f"Has tokenizer: {hasattr(pipeline, 'tokenizer')}")
print(f"Has tokenizer_2: {hasattr(pipeline, 'tokenizer_2')}")
print(f"Tokenizer type: {type(pipeline.tokenizer)}")
print(f"Tokenizer_2 type: {type(pipeline.tokenizer_2)}")

# Enable model CPU offload
print(f"\nEnabling model CPU offload...")
pipeline.enable_model_cpu_offload()
print(f"Pipeline device after offload: {pipeline.device}")
# Try to tokenize
print(f"\nTrying to tokenize...")
try:
    tokens = pipeline.tokenizer("test")
    print(f"Tokenizer works! Number of tokens: {len(tokens)}")
except Exception as e:
    print(f"Tokenizer failed: {type(e).__name__}: {e}")

if hasattr(pipeline, 'tokenizer_2'):
    try:
        tokens2 = pipeline.tokenizer_2("test")
        print(f"Tokenizer_2 works! Number of tokens: {len(tokens2)}")
    except Exception as e:
        print(f"Tokenizer_2 failed: {type(e).__name__}: {e}")

# Try to generate an image
print(f"\nTrying to generate an image...")
try:
    generator = torch.Generator(device='cuda').manual_seed(42)
    result = pipeline(
        prompt='test image',
        num_inference_steps=2,
        generator=generator
    )
    print(f"Generation successful! Image type: {type(result)}")
    if hasattr(result, 'images'):
        print(f"Number of images: {len(result.images)}")
except Exception as e:
    print(f"Generation failed: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
