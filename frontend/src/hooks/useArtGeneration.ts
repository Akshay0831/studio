import { useState, useCallback } from 'react';
import { useStudioStore } from '../core/useStudioStore';

export const useArtGeneration = () => {
  const { sendMessage, lastMessage } = useStudioStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);
  const [numVariations, setNumVariations] = useState(4);

  const generate = useCallback((prompt: string, seed: number, steps: number, count: number) => {
    setIsGenerating(true);
    setVariations([]);
    sendMessage({
      type: 'art_generate',
      prompt,
      seed,
      steps,
      count
    });
  }, [sendMessage]);

  const cancel = useCallback(() => {
    sendMessage({ type: 'art_cancel' });
    setIsGenerating(false);
  }, [sendMessage]);

  return {
    isGenerating,
    variations: lastMessage?.type === 'art_result' ? lastMessage.images : variations,
    generate,
    cancel,
    numVariations,
    setNumVariations
  };
};
