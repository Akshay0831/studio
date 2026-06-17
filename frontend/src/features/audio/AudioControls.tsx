import React, { useState, useEffect } from 'react';
import { Music, Sliders, Activity, Zap } from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';

import { StudioSelect, StudioToggle } from '../common/components/Controls';
import { useAudioComposition } from '../../hooks/useAudioComposition';

export const AudioControls: React.FC = () => {
  const { yAudio } = useStudioStore();
  const { isComposing, compose } = useAudioComposition();

  const composers = [
    { id: 'standard', name: 'Standard MIDI', description: 'Rule-based composition' },
    { id: 'transformer', name: 'AI Transformer', description: 'Neural sequence gen' },
    { id: 'ambient', name: 'Ambient Texture', description: 'Generative soundscapes' },
  ];

  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => ({ id: k, name: k }));
  const moods = ['Tense', 'Epic', 'Calm', 'Neutral', 'Energetic', 'Dark'].map(m => ({ id: m, name: m }));

  const handleRecomposeAll = () => {
    [0, 1, 2, 3].forEach(idx => {
      compose(idx, Math.floor(Math.random() * 1000000), { 
        bpm: yAudio?.get('bpm') || 120, 
        key: yAudio?.get('key') || 'C', 
        scale: yAudio?.get('scale') || 'Major', 
        mood: yAudio?.get('mood') || 'Neutral', 
        composer: yAudio?.get('composer') || 'standard' 
      });
    });
  };

  const effectKeys = ['eq', 'reverb', 'delay', 'compression'];

  return (
    <div className="flex flex-col h-full bg-studio-panel p-4 gap-6 custom-scrollbar overflow-y-auto">
      <StudioSelect 
        label="Composer Engine"
        yMap={yAudio}
        stateKey="composer"
        options={composers}
      />

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">Composition Parameters</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-studio-text-dim uppercase">Key</span>
            <select 
              value={yAudio?.get('key') || 'C'}
              onChange={(e) => yAudio?.set('key', e.target.value)}
              className="bg-black/40 border border-studio-border rounded px-2 py-1 text-xs focus:outline-none focus:border-studio-accent appearance-none"
            >
              {keys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-studio-text-dim uppercase">Mood</span>
            <select 
              value={yAudio?.get('mood') || 'Neutral'}
              onChange={(e) => yAudio?.set('mood', e.target.value)}
              className="bg-black/40 border border-studio-border rounded px-2 py-1 text-xs focus:outline-none focus:border-studio-accent appearance-none"
            >
              {moods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">Master FX Chain</label>
        <div className="flex flex-col gap-1">
          {effectKeys.map(name => (
            <StudioToggle key={name} label={name} yMap={yAudio?.get('effects')} stateKey={name} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">AI Analysis</label>
        <div className="space-y-2 bg-black/20 p-3 rounded border border-studio-border/30">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-studio-text-dim flex items-center gap-1"><Activity size={10} /> Latency</span>
            <span className="text-green-400 font-mono">14ms</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-studio-text-dim flex items-center gap-1"><Zap size={10} /> GPU Usage</span>
            <span className="text-orange-400 font-mono">1.2GB</span>
          </div>
        </div>
      </div>

      <button 
        onClick={handleRecomposeAll}
        disabled={isComposing}
        className="w-full py-3 rounded bg-studio-accent text-white font-bold text-xs hover:bg-studio-accent/80 shadow-lg shadow-studio-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Music size={14} className={isComposing ? 'animate-spin' : ''} />
        <span>{isComposing ? 'COMPOSING...' : 'RECOMPOSE ALL'}</span>
      </button>
    </div>
  );
};
