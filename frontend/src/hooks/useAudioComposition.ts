import { useState, useEffect, useCallback } from 'react';
import { useStudioStore } from '../core/useStudioStore';

export const useAudioComposition = () => {
  const { sendMessage, lastMessage, yAudio } = useStudioStore();
  const [isComposing, setIsComposing] = useState(false);
  const [composingLayerIndex, setComposingLayerIndex] = useState<number | null>(null);
  const [compositionProgress, setCompositionProgress] = useState(0);
  const [lastOutputUrl, setLastOutputUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'audio_chunk') {
      const { data } = lastMessage;
      if (data && data.progress !== undefined) {
        setCompositionProgress(data.progress);
      }
    } else if (lastMessage.type === 'composition_complete') {
      setIsComposing(false);
      setComposingLayerIndex(null);
      setCompositionProgress(100);
      
      if (lastMessage.result && lastMessage.result.output_url) {
        setLastOutputUrl(lastMessage.result.output_url);
      }
    } else if (lastMessage.type === 'error') {
      setIsComposing(false);
      setComposingLayerIndex(null);
    }
  }, [lastMessage]);

  const compose = useCallback((layerIndex: number, seed: number, config: any) => {
    setIsComposing(true);
    setComposingLayerIndex(layerIndex);
    setCompositionProgress(0);
    setLastOutputUrl(null);

    // Extract notes from yAudio
    const notes: Record<string, boolean> = {};
    if (yAudio) {
      yAudio.forEach((val, key) => {
        if (key.startsWith('note_')) {
          notes[key] = val;
        }
      });
    }

    sendMessage({
      type: 'regenerate_audio',
      layer_index: layerIndex,
      seed: seed,
      config: { ...config, notes }
    });
  }, [sendMessage, yAudio]);

  const cancel = useCallback(() => {
    setIsComposing(false);
    setComposingLayerIndex(null);
    sendMessage({ type: 'cancel_operation' });
  }, [sendMessage]);

  return {
    isComposing,
    composingLayerIndex,
    compositionProgress,
    lastOutputUrl,
    compose,
    cancel
  };
};
