import React, { useEffect, useCallback, useState } from 'react';
import * as Tone from 'tone';
import { 
  Music, 
  Volume2, 
  Settings2, 
  Play, 
  Pause, 
  Square,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';
import { useAudioComposition } from '../../hooks/useAudioComposition';
import { useAudioPlayback } from '../../hooks/useAudioPlayback';
import PianoRoll from './PianoRoll';

const AudioMixer: React.FC = () => {
  const { yAudio } = useStudioStore();
  const { isComposing, composingLayerIndex, compositionProgress, lastOutputUrl, compose } = useAudioComposition();
  const { togglePlay: togglePlayReal, stop: stopReal, loadResult } = useAudioPlayback();

  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [showPianoRoll, setShowPianoRoll] = useState(false);

  useEffect(() => { if (lastOutputUrl) loadResult(lastOutputUrl); }, [lastOutputUrl, loadResult]);

  const [layers, setLayers] = useState([
    { name: 'Bass', volume: 0, pan: 0, active: true, progress: 0 },
    { name: 'Lead', volume: 0, pan: 0, active: true, progress: 0 },
    { name: 'Drums', volume: 0, pan: 0, active: true, progress: 0 },
    { name: 'Ambient', volume: 0, pan: 0, active: false, progress: 0 },
  ]);

  useEffect(() => {
    if (!yAudio) return;
    const update = () => {
      const b = yAudio.get('bpm') as number;
      if (b && b !== bpm) { setBpm(b); Tone.getTransport().bpm.value = b; }
      const l = yAudio.get('layers') as any[];
      if (l) setLayers(l);
    };
    yAudio.observe(update);
    return () => yAudio.unobserve(update);
  }, [yAudio, bpm]);

  useEffect(() => {
    if (composingLayerIndex !== null) {
      setLayers(prev => {
        const next = [...prev];
        if (next[composingLayerIndex]) next[composingLayerIndex] = { ...next[composingLayerIndex], progress: compositionProgress };
        return next;
      });
    }
  }, [composingLayerIndex, compositionProgress]);

  const handleTogglePlay = async () => { await togglePlayReal(); setIsPlaying(!isPlaying); };
  const handleStop = () => { stopReal(); setIsPlaying(false); };
  const updateYjs = useCallback((l: any[]) => { yAudio?.set('layers', l); }, [yAudio]);

  return (
    <div className="h-64 bg-studio-panel border-t border-studio-border flex flex-col overflow-hidden">
      <div className="h-10 border-b border-studio-border flex items-center px-4 bg-studio-panel justify-between">
        <div className="flex items-center">
          <Music size={16} className="mr-2 text-studio-accent" />
          <span className="text-sm font-bold uppercase tracking-tight">Audio Mixer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-black/40 rounded border border-studio-border p-0.5">
            <button onClick={handleTogglePlay} className={`p-1 hover:bg-studio-accent/20 rounded ${isPlaying ? 'text-studio-accent' : 'text-studio-text-dim'}`}>
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
            <button onClick={handleStop} className="p-1 hover:bg-studio-accent/20 rounded text-studio-text-dim hover:text-studio-accent">
              <Square size={14} fill="currentColor" />
            </button>
          </div>
          <div className="text-[10px] font-mono text-studio-text-dim px-2 py-1 bg-black/20 rounded border border-studio-border">00:00 / 00:00</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-studio-text-dim font-bold">BPM</span>
            <input 
              type="number" 
              value={bpm} 
              onChange={(e) => { const b = parseInt(e.target.value); setBpm(b); Tone.getTransport().bpm.value = b; yAudio?.set('bpm', b); }}
              className="w-10 bg-black/40 border border-studio-border text-[10px] text-center rounded py-0.5 focus:border-studio-accent" 
            />
          </div>
          <button className="text-studio-text-dim hover:text-studio-text"><Settings2 size={16} /></button>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex p-4 gap-3 overflow-x-auto bg-[#1a1a1a] custom-scrollbar">
          {layers.map((layer, index) => (
            <div key={layer.name} className={`w-44 flex-shrink-0 bg-studio-bg border border-studio-border rounded-lg p-3 flex flex-col ${!layer.active && 'opacity-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-studio-text-dim">{layer.name}</span>
                <button onClick={() => compose(index, Math.floor(Math.random() * 1000000), { bpm })} disabled={isComposing} className={`p-1 rounded transition-colors ${composingLayerIndex === index ? 'animate-spin text-studio-accent' : 'text-studio-text-dim hover:text-studio-accent'}`}>
                  <RefreshCw size={12} />
                </button>
              </div>
              <div className="flex-1 flex gap-3 mb-3">
                <div className="w-6 bg-black/40 rounded-full relative overflow-hidden flex flex-col justify-end p-0.5 cursor-pointer">
                  <input type="range" min="-60" max="6" value={layer.volume} onChange={(e) => { const next = [...layers]; next[index].volume = parseInt(e.target.value); setLayers(next); updateYjs(next); }} className="absolute inset-0 opacity-0 cursor-pointer -rotate-90 origin-center" style={{ width: '100px', left: '-37px' }} />
                  <div className="bg-studio-accent/40 rounded-full" style={{ height: `${((layer.volume + 60) / 66) * 100}%` }} />
                </div>
                <div className="flex-1 flex flex-col gap-1 justify-center py-2">
                  {[...Array(12)].map((_, i) => <div key={i} className={`h-1.5 rounded-full ${i < 4 ? 'bg-studio-accent/20' : i < 8 ? 'bg-studio-accent/40' : 'bg-studio-accent/60'}`} />)}
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-studio-border/30">
                <button className="p-1 rounded bg-black/20 text-[10px] text-studio-text-dim border border-studio-border/50 font-bold px-2">M</button>
                <button className="p-1 rounded bg-black/20 text-[10px] text-studio-text-dim border border-studio-border/50 font-bold px-2">S</button>
                <Volume2 size={12} className="text-studio-text-dim" />
              </div>
            </div>
          ))}
          <button onClick={() => setShowPianoRoll(!showPianoRoll)} className={`w-12 border border-dashed rounded-lg flex items-center justify-center ${showPianoRoll ? 'bg-studio-accent text-white border-studio-accent' : 'border-studio-border text-studio-text-dim hover:bg-studio-panel'}`}>
            <ChevronRight size={20} className={showPianoRoll ? 'rotate-90' : ''} />
          </button>
        </div>
        {showPianoRoll && <div className="h-48 border-t border-studio-border bg-studio-bg p-4 overflow-hidden"><PianoRoll /></div>}
      </div>
    </div>
  );
};

export default AudioMixer;
