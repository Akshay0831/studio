import { useState, useEffect, useCallback } from 'react';
import { useStudioStore } from '../core/useStudioStore';

export const useAudioComposition = () => {
  const { sendMessage, lastMessage, yAudio, yExperimental } = useStudioStore();
  const [isComposing, setIsComposing] = useState(false);
  const [composingLayerIndex, setComposingLayerIndex] = useState<number | null>(null);
  const [compositionProgress, setCompositionProgress] = useState(0);
  const [lastOutputUrl, setLastOutputUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'audio_chunk') {
      const { metadata } = lastMessage;
      if (metadata && metadata.progress !== undefined) {
        setCompositionProgress(metadata.progress);
      }
    } else if (lastMessage.type === 'composition_complete') {
      setIsComposing(false);
      setComposingLayerIndex(null);
      setCompositionProgress(100);
      
      const worktree = lastMessage.worktree || 'main';
      const resultUrl = lastMessage.result?.output_url;

      if (worktree === 'experimental' && yExperimental && resultUrl) {
        const proposalId = `audio-${Date.now()}`;
        const proposals = yExperimental.get('proposals') as any;
        
        // Find layer name for the index
        const layers = yAudio?.get('layers') as any[] || [];
        const layerName = layers[lastMessage.layer_index]?.name || `Layer ${lastMessage.layer_index}`;

        proposals.set(proposalId, {
          type: 'audio_layer',
          data: resultUrl,
          layerName: layerName,
          confidence: 1.0,
          timestamp: Date.now(),
          source: 'composer'
        });
      } else if (resultUrl) {
        setLastOutputUrl(resultUrl);
      }
    } else if (lastMessage.type === 'error') {
      setIsComposing(false);
      setComposingLayerIndex(null);
    }
  }, [lastMessage, yExperimental, yAudio]);

  const compose = useCallback((layerIndex: number, seed: number, config: any, worktree: string = 'main') => {
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
      config: { ...config, notes },
      worktree: worktree // Pass target worktree context
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
