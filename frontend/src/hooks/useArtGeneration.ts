import { useState, useCallback } from 'react';
import { useStudioStore } from '../core/useStudioStore';

export const useArtGeneration = () => {
  const { sendMessage, lastMessage, yPrompt } = useStudioStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);
  const [numVariations, setNumVariations] = useState(4);
  const [model, setModel] = useState('sdxl');

  const [progress, setProgress] = useState(0);

  const generate = useCallback((prompt: string, seed: number, steps: number, count: number) => {
    setIsGenerating(true);
    setProgress(0);
    setVariations(new Array(count).fill(''));

    // Extract all config from yPrompt
    const config: any = { steps, model };
    if (yPrompt) {
      yPrompt.forEach((val, key) => {
        if (!['currentPrompt', 'currentSeed'].includes(key)) {
          config[key] = val;
        }
      });
    }

    sendMessage({
      type: 'generate_image',
      prompt,
      seed,
      num_variations: count,
      config
    });
  }, [sendMessage, model, yPrompt]);

  // Update variations and progress when chunks or complete results arrive
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'generation_progress') {
      setProgress(lastMessage.progress);
      // Optional: partial image preview if backend supports sending it
      if (lastMessage.preview_base64 && lastMessage.variation_index !== undefined) {
        const newVars = [...variations];
        newVars[lastMessage.variation_index] = lastMessage.preview_base64;
        setVariations(newVars);
      }
    } else if (lastMessage.type === 'generation_complete') {
      const idx = lastMessage.variation_index ?? 0;
      const newVars = [...variations];
      newVars[idx] = lastMessage.result.image_base64;
      setVariations(newVars);
      
      // If it was a single image or all variations are done, stop loading
      if (variations.filter(v => v !== '').length + 1 >= numVariations) {
        setIsGenerating(false);
        setProgress(100);
      }
    } else if (lastMessage.type === 'error') {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [lastMessage]);

  const cancel = useCallback(() => {
    sendMessage({ type: 'cancel_operation' });
    setIsGenerating(false);
  }, [sendMessage]);

  return {
    isGenerating,
    progress,
    variations,
    generate,
    cancel,
    numVariations,
    setNumVariations,
    model,
    setModel
  };
};
