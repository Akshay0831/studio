import { useCallback, useEffect, useState } from 'react';
import * as Y from 'yjs';
import { useStudioStore } from './useStudioStore';

/**
 * Hook for managing project settings and cross-modal state.
 */
export const useProjectConfig = () => {
  const { 
    yProjectConfig, 
    yImage, 
    yAudio, 
    sendMessage, 
    lastMessage 
  } = useStudioStore();

  const [stylePreset, setStylePreset] = useState(yProjectConfig.get('stylePreset') as string);
  const [autoSyncAudio, setAutoSyncAudio] = useState(yProjectConfig.get('autoSyncAudio') as boolean);
  const [sceneMetadata, setSceneMetadata] = useState<any>((yProjectConfig.get('sceneMetadata') as Y.Map<any>)?.toJSON() || {});

  useEffect(() => {
    const update = () => {
      setStylePreset(yProjectConfig.get('stylePreset') as string);
      setAutoSyncAudio(yProjectConfig.get('autoSyncAudio') as boolean);
      setSceneMetadata((yProjectConfig.get('sceneMetadata') as Y.Map<any>)?.toJSON() || {});
    };
    yProjectConfig.observeDeep(update);
    return () => yProjectConfig.unobserveDeep(update);
  }, [yProjectConfig]);

  const updateConfig = useCallback((key: string, value: any) => {
    yProjectConfig.set(key, value);
  }, [yProjectConfig]);

  const refinePrompt = useCallback((prompt: string) => {
    sendMessage({
      type: 'refine_prompt',
      prompt,
      style_preset: stylePreset
    });
  }, [sendMessage, stylePreset]);

  const analyzeScene = useCallback(() => {
    const baseImage = yImage.get('baseImageData');
    if (!baseImage) return;

    sendMessage({
      type: 'analyze_scene',
      image_b64: baseImage
    });
  }, [sendMessage, yImage]);

  // Handle incoming analysis results
  useEffect(() => {
    if (lastMessage?.type === 'scene_analysis_complete') {
      const { analysis } = lastMessage;
      
      const metadataMap = yProjectConfig.get('sceneMetadata') as any;
      Object.entries(analysis).forEach(([key, val]) => {
        metadataMap.set(key, val);
      });

      // If auto-sync is on, update audio settings
      if (autoSyncAudio && analysis.suggested_audio_config) {
        const audioConfig = analysis.suggested_audio_config;
        if (audioConfig.mood) yAudio.set('mood', audioConfig.mood);
        if (audioConfig.composer) yAudio.set('composer', audioConfig.composer);
        if (audioConfig.bpm) yAudio.set('bpm', audioConfig.bpm);
      }
    }
  }, [lastMessage, autoSyncAudio, yProjectConfig, yAudio]);

  return {
    stylePreset,
    autoSyncAudio,
    sceneMetadata,
    updateConfig,
    refinePrompt,
    analyzeScene
  };
};
