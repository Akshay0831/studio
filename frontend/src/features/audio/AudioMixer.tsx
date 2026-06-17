import React, { useEffect, useCallback, useState } from 'react';
import * as Tone from 'tone';
import { 
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
import { useWorktree } from '../../core/useWorktree';
import PianoRoll from './PianoRoll';

const AudioMixer: React.FC = () => {
  const { yAudio, yHistory } = useStudioStore();
  const { isComposing, composingLayerIndex, compositionProgress, lastOutputUrl, compose } = useAudioComposition();
  const { togglePlay: togglePlayReal, stop: stopReal, loadResult } = useAudioPlayback();
  const { isReviewMode, activeProposalId, proposals } = useWorktree();

  const [layers, setLayers] = useState([
    { name: 'Bass', volume: 0, pan: 0, active: true, progress: 0 },
    { name: 'Lead', volume: 0, pan: 0, active: true, progress: 0 },
    { name: 'Drums', volume: 0, pan: 0, active: true, progress: 0 },
    { name: 'Ambient', volume: 0, pan: 0, active: false, progress: 0 },
  ]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [showPianoRoll, setShowPianoRoll] = useState(false);

  useEffect(() => { 
    if (lastOutputUrl) {
      loadResult(lastOutputUrl);
      if (yHistory && composingLayerIndex !== null) {
        yHistory.push([{
          type: 'audio',
          label: `Layer: ${layers[composingLayerIndex].name} (Seed: ${Math.floor(Math.random() * 1000)})`,
          preview: null,
          timestamp: Date.now(),
          url: lastOutputUrl
        }]);
      }
    } 
  }, [lastOutputUrl, loadResult, yHistory, composingLayerIndex, layers]);

  // Load audio data from active proposal in review mode
  useEffect(() => {
    if (isReviewMode && activeProposalId) {
      const proposal = (proposals as any)?.get(activeProposalId);
      if (proposal?.type === 'audio_layer' && proposal.data) {
        loadResult(proposal.data);
      }
    }
  }, [isReviewMode, activeProposalId, proposals, loadResult]);

  const [composer, setComposer] = useState('standard');
  const [key, setKey] = useState('C');
  const [scale, setScale] = useState('Major');
  const [mood, setMood] = useState('Neutral');

  useEffect(() => {
    if (!yAudio) return;
    const update = () => {
      const b = yAudio.get('bpm') as number;
      if (b && b !== bpm) { setBpm(b); Tone.getTransport().bpm.value = b; }
      const l = yAudio.get('layers') as any[];
      if (l) setLayers(l);
      setComposer(yAudio.get('composer') || 'standard');
      setKey(yAudio.get('key') || 'C');
      setScale(yAudio.get('scale') || 'Major');
      setMood(yAudio.get('mood') || 'Neutral');
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
    <div className="flex-1 flex flex-col bg-studio-bg overflow-hidden">
      <div className="h-12 border-b border-studio-border flex items-center px-4 bg-studio-panel justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex bg-black/40 rounded-lg border border-studio-border p-1 shadow-inner">
            <button onClick={handleTogglePlay} className={`p-1.5 hover:bg-studio-accent/20 rounded-md transition-all ${isPlaying ? 'text-studio-accent' : 'text-studio-text-dim hover:text-white'}`}>
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <button onClick={handleStop} className="p-1.5 hover:bg-studio-accent/20 rounded-md text-studio-text-dim hover:text-red-400 transition-all">
              <Square size={18} fill="currentColor" />
            </button>
          </div>
          <div className="flex flex-col">
            <div className="text-[10px] font-mono text-studio-accent font-bold">MASTER OUTPUT</div>
            <div className="text-[9px] font-mono text-studio-text-dim tracking-widest">00:00.000 / 04:00.000</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/30 rounded-full border border-studio-border/50">
            <span className="text-[10px] text-studio-text-dim font-bold tracking-tighter uppercase">BPM</span>
            <input 
              type="number" 
              value={bpm} 
              onChange={(e) => { const b = parseInt(e.target.value) || 120; setBpm(b); Tone.getTransport().bpm.value = b; yAudio?.set('bpm', b); }}
              className="w-10 bg-transparent text-[11px] font-mono text-studio-accent text-center focus:outline-none" 
            />
          </div>
          <div className="w-px h-6 bg-studio-border/30" />
          <button className="text-studio-text-dim hover:text-white transition-colors"><Settings2 size={18} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
        <div className="flex-1 flex p-6 gap-4 overflow-x-auto custom-scrollbar items-start">
          {layers.map((layer, index) => (
            <div key={layer.name} className={`w-48 flex-shrink-0 bg-studio-panel border border-studio-border rounded-xl p-4 flex flex-col shadow-xl transition-all hover:border-studio-border-bright ${!layer.active && 'opacity-40 grayscale-[0.5]'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-tighter text-studio-text">{layer.name}</span>
                  <span className="text-[8px] text-studio-accent font-mono">CHANNEL {index + 1}</span>
                </div>
                <button 
                  onClick={() => compose(index, Math.floor(Math.random() * 1000000), { bpm, composer, key, scale, mood })} 
                  disabled={isComposing} 
                  className={`p-1.5 rounded-lg transition-all ${composingLayerIndex === index ? 'animate-spin bg-studio-accent text-white' : 'bg-black/40 text-studio-text-dim hover:text-studio-accent hover:bg-studio-accent/10 border border-studio-border'}`}
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              <div className="flex-1 flex gap-4 mb-6 h-48">
                <div className="w-8 bg-black/60 rounded-lg relative overflow-hidden flex flex-col justify-end p-1 border border-studio-border/50 group">
                  <input 
                    type="range" 
                    min="-60" 
                    max="6" 
                    value={layer.volume} 
                    onChange={(e) => { const next = [...layers]; next[index].volume = parseInt(e.target.value); setLayers(next); updateYjs(next); }} 
                    className="absolute inset-0 opacity-0 cursor-pointer -rotate-90 origin-center z-10" 
                    style={{ width: '180px', left: '-75px', top: '75px' }} 
                  />
                  <div className="w-full bg-studio-accent rounded-md shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] transition-all duration-75" style={{ height: `${((layer.volume + 60) / 66) * 100}%` }} />
                </div>
                <div className="flex-1 flex flex-col gap-1.5 justify-between py-1">
                  {[...Array(16)].map((_, i) => {
                    const level = 15 - i; // bottom is 0, top is 15
                    const isActive = isPlaying && (Math.random() * 16 > level);
                    const isPeak = level > 12;
                    return (
                      <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-150 ${
                          isActive 
                            ? isPeak ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-studio-accent shadow-[0_0_5px_#6366f1]' 
                            : 'bg-white/5'
                        }`} 
                        style={{ opacity: isActive ? 1 : 0.3 }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-studio-border/30 gap-2">
                <button className={`flex-1 py-1 rounded-md text-[9px] font-black border transition-all ${layer.active ? 'bg-black/40 border-studio-border text-studio-text-dim' : 'bg-red-900/20 border-red-900/50 text-red-400'}`}>MUTE</button>
                <button className="flex-1 py-1 rounded-md bg-black/40 text-[9px] text-studio-text-dim border border-studio-border font-black">SOLO</button>
              </div>
            </div>
          ))}
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setShowPianoRoll(!showPianoRoll)} 
              className={`w-12 h-48 border border-dashed rounded-xl flex items-center justify-center transition-all ${showPianoRoll ? 'bg-studio-accent text-white border-studio-accent shadow-lg shadow-studio-accent/20' : 'border-studio-border text-studio-text-dim hover:bg-studio-panel hover:border-studio-border-bright'}`}
            >
              <ChevronRight size={24} className={`transition-transform duration-300 ${showPianoRoll ? 'rotate-90' : ''}`} />
            </button>
            <div className="text-[10px] font-bold text-studio-text-dim text-center uppercase tracking-tighter [writing-mode:vertical-lr] rotate-180">Piano Roll</div>
          </div>
        </div>
        
        {showPianoRoll && (
          <div className="h-64 border-t border-studio-border bg-studio-panel p-4 overflow-hidden shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-20">
            <PianoRoll />
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioMixer;
