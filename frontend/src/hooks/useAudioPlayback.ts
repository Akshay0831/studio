import { useState, useCallback } from 'react';
import * as Tone from 'tone';

export const useAudioPlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<Tone.Player | null>(null);

  const loadResult = useCallback(async (url: string) => {
    if (player) player.dispose();
    const p = new Tone.Player(url).toDestination();
    await Tone.loaded();
    setPlayer(p);
  }, [player]);

  const togglePlay = useCallback(async () => {
    if (Tone.getContext().state !== 'running') await Tone.start();
    if (player) {
      if (isPlaying) player.stop();
      else player.start();
      setIsPlaying(!isPlaying);
    }
  }, [player, isPlaying]);

  const stop = useCallback(() => {
    if (player) player.stop();
    setIsPlaying(false);
  }, [player]);

  return { isPlaying, togglePlay, stop, loadResult };
};
