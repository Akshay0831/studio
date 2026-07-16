import torch
from ai_models.model_manager import ModelManager
from ai_models.model_types import ModelType, QuantizationType

mm = ModelManager()
print('Created ModelManager')

pipeline = mm.GetPipeline(ModelType.SDXL, 'txt2img', QuantizationType.NONE)
print('Pipeline created successfully')

# Try to generate an image
generator = torch.Generator(device='cuda').manual_seed(42)
steps = 2  # Use very few steps for testing

def callback_on_step_end(pipe, i, t, callback_kwargs):
    print(f'Step {i}/{steps} completed')
    return callback_kwargs

print('Starting generation...')
try:
    result = pipeline(
        prompt='test image',
        num_inference_steps=steps,
        generator=generator,
        callback_on_step_end=callback_on_step_end
    )
    print('Generation successful!')
    print(f'Output type: {type(result)}')
    print(f'Has images: {hasattr(result, "images")}')
    if hasattr(result, 'images'):
        print(f'Number of images: {len(result.images)}')
        print(f'First image type: {type(result.images[0])}')
except Exception as e:
    print(f'Generation failed: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
