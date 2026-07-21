import React, { useState } from 'react';
import { Music, Globe, FlaskConical, RefreshCw, Sparkles, Sliders } from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';
import { StudioSelect, StudioToggle } from '../../features/common/components/Controls';
import { useAudioComposition } from '../../hooks/useAudioComposition';
import { useProjectConfig } from '../../core/useProjectConfig';

import CollapsibleSidebar, { SidebarSection } from '../../components/lookup/CollapsibleSidebar';
import AudioToolLookup from '../../components/lookup/AudioToolLookup';

export const AudioControls: React.FC = () => {
  const { yAudio } = useStudioStore();
  const { isComposing, compose } = useAudioComposition();
  const { autoSyncAudio, sceneMetadata, updateConfig, analyzeScene } = useProjectConfig();
  const [targetWorktree, setTargetWorktree] = useState<'main' | 'experimental'>('main');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    analyzeScene();
    setTimeout(() => setIsAnalyzing(false), 2000); // Visual feedback
  };

  const composers = [
    { id: 'standard', name: 'Standard MIDI', description: 'Rule-based composition' },
    { id: 'transformer', name: 'Transformer Engine', description: 'Neural sequence gen' },
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
      }, targetWorktree);
    });
  };

  const effectKeys = ['eq', 'reverb', 'delay', 'compression'];

  return (
    <div className="flex flex-col h-full bg-studio-panel overflow-hidden">
      {/* Main Collapsible Sidebar */}
      <CollapsibleSidebar
        title="Audio Studio"
        icon={Music}
        defaultCollapsed={false}
        minWidth={180}
        maxWidth={280}
        className="flex-shrink-0"
      >
        <div className="p-3 space-y-4">
          {/* Tool Selection Section */}
          <SidebarSection title="Audio Tools" icon={Sliders}>
            <AudioToolLookup
              activeTool="mixer"
              onToolSelect={(tool) => console.log('Selected audio tool:', tool)}
              showCompact={false}
            />
          </SidebarSection>

          {/* Composer Selection Section */}
          <SidebarSection title="Composer" icon={Music}>
            <StudioSelect 
              label="Composer Engine"
              yMap={yAudio}
              stateKey="composer"
              options={composers}
            />
          </SidebarSection>

          {/* Composition Parameters Section */}
          <SidebarSection title="Composition" icon={Globe}>
            <div className="flex flex-col gap-3">
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
          </SidebarSection>

          {/* Effects Section */}
          <SidebarSection title="Effects" icon={Sliders}>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">Master FX Chain</label>
              <div className="flex flex-col gap-1">
                {effectKeys.map(name => (
                  <StudioToggle key={name} label={name} yMap={yAudio?.get('effects')} stateKey={name} />
                ))}
              </div>
            </div>
          </SidebarSection>

          {/* Analysis Section */}
          <SidebarSection title="Analysis" icon={Sparkles}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">Sync State</label>
                <button 
                  onClick={() => updateConfig('autoSyncAudio', !autoSyncAudio)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${autoSyncAudio ? 'bg-studio-accent border-studio-accent text-white' : 'bg-black/20 border-studio-border text-studio-text-dim'}`}
                >
                  {autoSyncAudio ? 'SYNC ON' : 'SYNC OFF'}
                </button>
              </div>
              
              <div className="bg-black/20 p-3 rounded border border-studio-border/30 flex flex-col gap-3">
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={`w-full py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-2 border transition-all ${isAnalyzing ? 'bg-purple-900/20 border-purple-900/50 text-purple-400' : 'bg-purple-900/10 border-purple-900/30 text-purple-400 hover:bg-purple-900/20'}`}
                >
                  {isAnalyzing ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  <span>EXTRACT SCENE CONTEXT</span>
                </button>

                {sceneMetadata && sceneMetadata.mood && (
                  <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-500">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-studio-text-dim uppercase tracking-tighter">Detected Mood</span>
                      <span className="text-studio-accent font-bold uppercase">{sceneMetadata.mood}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sceneMetadata.keywords?.map((kw: string) => (
                        <span key={kw} className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] text-studio-text-dim border border-white/5 uppercase font-mono">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SidebarSection>

          {/* Action Section */}
          <SidebarSection title="Actions" icon={Music}>
            <button 
              onClick={handleRecomposeAll}
              disabled={isComposing}
              className="w-full py-3 rounded bg-studio-accent text-white font-bold text-xs hover:bg-studio-accent/80 shadow-lg shadow-studio-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Music size={14} className={isComposing ? 'animate-spin' : ''} />
              <span>{isComposing ? 'COMPOSING...' : 'RECOMPOSE ALL'}</span>
            </button>
          </SidebarSection>
        </div>
      </CollapsibleSidebar>
    </div>
  );
};
