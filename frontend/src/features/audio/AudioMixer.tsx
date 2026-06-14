import React, { useEffect, useCallback, useState } from 'react';
import * as Tone from 'tone';
import { 
  Music, 
  Volume2, 
  Settings2, 
  Play, 
  Pause, 
  Square,
  ChevronRight
} from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';

const AudioMixer: React.FC = () => {
  const { yAudio, sendMessage, lastMessage } = useStudioStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [regeneratingLayerIndex, setRegeneratingLayerIndex] = useState<number | null>(null);

  const [layers, setLayers] = useState([
    { name: 'Bass', volume: 0, pan: 0, active: true, progress: 0 },
    { name: 'Lead', volume: 0, pan: 0, active: true, progress: 0 },
    { name: 'Drums', volume: 0, pan: 0, active: true, progress: 0 },
    { name: 'Ambient', volume: 0, pan: 0, active: false, progress: 0 },
  ]);

  useEffect(() => {
    const handleYjsUpdate = () => {
      const remoteBpm = yAudio.get('bpm') as number;
      if (remoteBpm && remoteBpm !== bpm) {
        setBpm(remoteBpm);
        Tone.Transport.bpm.value = remoteBpm;
      }

      const remoteLayers = yAudio.get('layers') as any[];
      if (remoteLayers) {
        setLayers(remoteLayers);
      }
    };

    yAudio.observe(handleYjsUpdate);
    return () => yAudio.unobserve(handleYjsUpdate);
  }, [yAudio, bpm]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'audio_chunk') {
      if (regeneratingLayerIndex !== null) {
        setLayers(previousLayers => {
          const updatedLayers = [...previousLayers];
          updatedLayers[regeneratingLayerIndex].progress = lastMessage.data.progress || 0;
          return updatedLayers;
        });
      }
    } else if (lastMessage.type === 'composition_complete') {
      setRegeneratingLayerIndex(null);
    }
  }, [lastMessage, regeneratingLayerIndex]);

  const updateYjsLayers = useCallback((newLayers: any[]) => {
    yAudio.set('layers', newLayers);
  }, [yAudio]);

  const handleTogglePlay = async () => {
    await Tone.start();
    if (isPlaying) {
      Tone.Transport.pause();
    } else {
      Tone.Transport.start();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value);
    setBpm(newBpm);
    Tone.Transport.bpm.value = newBpm;
    yAudio.set('bpm', newBpm);
  };

  const handleLayerVolumeChange = (index: number, volume: number) => {
    const newLayers = [...layers];
    newLayers[index].volume = volume;
    setLayers(newLayers);
    updateYjsLayers(newLayers);
  };

  const handleRegenerateLayer = (index: number) => {
    setRegeneratingLayerIndex(index);
    setLayers(previousLayers => {
      const updatedLayers = [...previousLayers];
      updatedLayers[index].progress = 0;
      return updatedLayers;
    });

    sendMessage({
      type: 'regenerate_audio',
      layer_index: index,
      seed: Math.floor(Math.random() * 1000000),
      config: { bpm: bpm }
    });
  };

  return (
    <div className="h-64 bg-studio-panel border-t border-studio-border flex flex-col overflow-hidden">
      <div className="h-10 border-b border-studio-border flex items-center px-4 bg-studio-panel justify-between">
        <div className="flex items-center">
          <Music size={16} className="mr-2 text-studio-accent" />
          <span className="text-sm font-medium">Audio Mixer</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-black/40 rounded border border-studio-border p-0.5">
            <button 
              onClick={handleTogglePlay}
              className={`p-1 hover:bg-studio-accent/20 rounded transition-colors ${isPlaying ? 'text-studio-accent' : 'text-studio-text-dim'}`}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
            <button 
              onClick={handleStop}
              className="p-1 hover:bg-studio-accent/20 rounded transition-colors text-studio-text-dim hover:text-studio-accent"
            >
              <Square size={14} fill="currentColor" />
            </button>
          </div>
          <div className="text-[10px] font-mono text-studio-text-dim px-2 py-1 bg-black/20 rounded border border-studio-border">
            00:00:00 / 00:00:00
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-studio-text-dim uppercase font-bold">BPM</span>
            <input 
              type="number" 
              value={bpm} 
              onChange={handleBpmChange}
              className="w-10 bg-black/40 border border-studio-border text-[10px] text-center rounded py-0.5 focus:outline-none focus:border-studio-accent" 
            />
          </div>
          <button className="text-studio-text-dim hover:text-studio-text">
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex p-4 gap-3 overflow-x-auto bg-[#1a1a1a] custom-scrollbar">
        {layers.map((layer, index) => (
          <div key={layer.name} className={`w-44 flex-shrink-0 bg-studio-bg border border-studio-border rounded-lg p-3 flex flex-col ${!layer.active && 'opacity-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-studio-text-dim">{layer.name}</span>
              <button 
                onClick={() => handleRegenerateLayer(index)}
                disabled={regeneratingLayerIndex !== null}
                className={`p-1 rounded hover:bg-studio-accent/20 transition-colors ${regeneratingLayerIndex === index ? 'animate-spin text-studio-accent' : 'text-studio-text-dim hover:text-studio-accent'}`}
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {regeneratingLayerIndex === index && (
              <div className="mb-2">
                <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-studio-accent transition-all duration-300" 
                    style={{ width: `${layer.progress || 0}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex-1 flex gap-3 mb-3">
              <div className="w-6 bg-black/40 rounded-full relative overflow-hidden flex flex-col justify-end p-0.5 cursor-pointer">
                <input 
                  type="range" 
                  min="-60" 
                  max="6" 
                  value={layer.volume} 
                  onChange={(e) => handleLayerVolumeChange(index, parseInt(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  style={{ transform: 'rotate(-90deg)', width: '100px', left: '-37px', top: '37px' }}
                />
                <div 
                  className="bg-studio-accent/40 rounded-full transition-all" 
                  style={{ height: `${((layer.volume + 60) / 66) * 100}%` }}
                />
              </div>
              
              <div className="flex-1 flex flex-col gap-1 justify-center py-2">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full ${i < 4 ? 'bg-studio-accent/20' : i < 8 ? 'bg-studio-accent/40' : 'bg-studio-accent/60'}`} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-studio-border/30">
              <button className="p-1 rounded bg-black/20 text-[10px] text-studio-text-dim hover:text-studio-text border border-studio-border/50 uppercase font-bold px-2">M</button>
              <button className="p-1 rounded bg-black/20 text-[10px] text-studio-text-dim hover:text-studio-text border border-studio-border/50 uppercase font-bold px-2">S</button>
              <button className="text-studio-text-dim hover:text-studio-text">
                <Volume2 size={12} />
              </button>
            </div>
          </div>
        ))}

        <button className="w-12 flex-shrink-0 border border-dashed border-studio-border rounded-lg flex items-center justify-center text-studio-text-dim hover:text-studio-text hover:bg-studio-panel transition-all">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default AudioMixer;
