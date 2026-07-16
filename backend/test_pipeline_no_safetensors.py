import torch
from diffusers import StableDiffusionXLPipeline
from ai_models.model_types import ModelType

# Test loading pipeline without safetensors
model_id = "stabilityai/stable-diffusion-xl-base-1.0"

print(f"Loading pipeline from {model_id} without safetensors...")
try:
    pipeline = StableDiffusionXLPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
    )
    print("Pipeline loaded successfully!")
    print(f"Pipeline type: {type(pipeline)}")
    print(f"Has tokenizer: {hasattr(pipeline, 'tokenizer')}")
    print(f"Has tokenizer_2: {hasattr(pipeline, 'tokenizer_2')}")
    
    if hasattr(pipeline, 'tokenizer'):
        print(f"Tokenizer type: {type(pipeline.tokenizer)}")
        print(f"Tokenizer is None: {pipeline.tokenizer is None}")
    
    if hasattr(pipeline, 'tokenizer_2'):
        print(f"Tokenizer_2 type: {type(pipeline.tokenizer_2)}")
        print(f"Tokenizer_2 is None: {pipeline.tokenizer_2 is None}")
    
    # Try to generate an image
    print("\nStarting generation...")
    generator = torch.Generator(device='cuda').manual_seed(42)
    
    def callback_on_step_end(pipe, i, t, callback_kwargs):
        print(f'Step {i}/2 completed')
        return callback_kwargs
    
    result = pipeline(
        prompt='test image',
        num_inference_steps=2,
        generator=generator,
        callback_on_step_end=callback_on_step_end
    )
    print('Generation successful!')
    
except Exception as e:
    print(f'Failed: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
