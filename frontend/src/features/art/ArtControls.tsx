import React, { useState, useEffect } from 'react';
import { ThumbsUp, Loader2, FlaskConical, Globe, Wand2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStudioStore } from '../../core/useStudioStore';
import { useArtGeneration } from '../../hooks/useArtGeneration';
import { useWorktree } from '../../core/useWorktree';
import { useProjectConfig } from '../../core/useProjectConfig';

import { StudioSelect, StudioToggle, StudioSlider } from '../common/components/Controls';

export const ArtControls: React.FC = () => {
  const { yPrompt, yImage, yHistory, yExperimental, lastMessage } = useStudioStore();
  const { startReview } = useWorktree();
  const { stylePreset, updateConfig, refinePrompt } = useProjectConfig();
  const { 
    isGenerating, 
    variations, 
    generate, 
    cancel, 
    numVariations, 
    setNumVariations,
    model
  } = useArtGeneration();

  const [prompt, setPrompt] = useState('');
  const [seed, setSeed] = useState(0);
  const [targetWorktree, setTargetWorktree] = useState<'main' | 'experimental'>('main');
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    if (lastMessage?.type === 'prompt_refined') {
      setPrompt(lastMessage.refined);
      yPrompt?.set('currentPrompt', lastMessage.refined);
      setIsRefining(false);
      toast.success('Prompt expanded!');
    }
  }, [lastMessage, yPrompt]);

  const handleRefine = () => {
    setIsRefining(true);
    refinePrompt(prompt);
  };

  useEffect(() => {
    if (!yPrompt) return;
    const update = () => {
      const p = yPrompt.get('currentPrompt');
      if (typeof p === 'string' && p !== prompt) setPrompt(p);
      const s = yPrompt.get('currentSeed');
      if (typeof s === 'number' && s !== seed) setSeed(s);
    };
    yPrompt.observe(update);
    update();
    return () => yPrompt.unobserve(update);
  }, [yPrompt, prompt, seed]);

  const promote = (data: string) => {
    if (targetWorktree === 'experimental') {
      const proposalId = `art-${Date.now()}`;
      const proposals = yExperimental.get('proposals') as any;
      proposals.set(proposalId, {
        type: 'image_generate',
        data: data,
        confidence: 1.0,
        timestamp: Date.now(),
        source: 'user_experiment'
      });
      toast.success('Added to Experimental Worktree');
      startReview(proposalId);
      return;
    }

    if (!yImage) return;
    yImage.set('baseImageData', data);
    // Clear canvas objects when promoting new base image
    yImage.set('canvasData', JSON.stringify({ version: "5.3.0", objects: [] }));
    toast.success('Promoted to canvas');

    if (yHistory) {
      yHistory.push([{
        type: 'art',
        label: prompt || 'Generated Image',
        preview: `data:image/png;base64,${data}`,
        timestamp: Date.now()
      }]);
    }
  };

  const handleGenerate = () => {
    if (isGenerating) {
      cancel();
    } else {
      generate(prompt, seed, (yPrompt?.get('steps') as number) || 20, numVariations, targetWorktree);
    }
  };


  const models = [
    { id: 'sdxl', name: 'Stable Diffusion XL', description: 'Fast, high quality' },
    { id: 'flux', name: 'FLUX.2-Klein', description: 'State-of-the-art detail' },
  ];

  return (
    <div className="flex flex-col h-full bg-studio-panel p-4 gap-6 custom-scrollbar overflow-y-auto">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">Target Worktree</label>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setTargetWorktree('main')}
            className={`flex items-center justify-center gap-2 py-2 rounded border transition-all ${targetWorktree === 'main' ? 'bg-studio-accent border-studio-accent text-white shadow-lg' : 'bg-black/20 border-studio-border text-studio-text-dim hover:bg-black/40'}`}
          >
            <Globe size={12} />
            <span className="text-[10px] font-bold">MAIN</span>
          </button>
          <button 
            onClick={() => setTargetWorktree('experimental')}
            className={`flex items-center justify-center gap-2 py-2 rounded border transition-all ${targetWorktree === 'experimental' ? 'bg-studio-accent-orange border-studio-accent-orange text-white shadow-lg' : 'bg-black/20 border-studio-border text-studio-text-dim hover:bg-black/40'}`}
          >
            <FlaskConical size={12} />
            <span className="text-[10px] font-bold">EXPERIMENT</span>
          </button>
        </div>
      </div>

      <StudioSelect 
        label="Active Model"
        yMap={yPrompt}
        stateKey="model"
        options={models}
      />

      {model === 'flux' && (
        <div className="bg-blue-900/10 border border-blue-900/30 rounded p-3 flex flex-col gap-2">
          <label className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Flux Tools</label>
          <StudioToggle label="Ultra Detail" yMap={yPrompt} stateKey="ultra_detail" />
          <StudioToggle label="Pro Refiner" yMap={yPrompt} stateKey="pro_refiner" />
        </div>
      )}

      {model === 'sdxl' && (
        <div className="bg-orange-900/10 border border-orange-900/30 rounded p-3 flex flex-col gap-2">
          <label className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">SDXL Optimizers</label>
          <StudioToggle label="Fast Mode" yMap={yPrompt} stateKey="fast_mode" />
          <StudioToggle label="High VRAM" yMap={yPrompt} stateKey="high_vram" />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">Prompt</label>
          <button 
            onClick={handleRefine}
            disabled={!prompt.trim() || isRefining}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold transition-all ${isRefining ? 'bg-studio-accent/20 text-studio-accent animate-pulse' : 'bg-studio-accent/10 text-studio-accent hover:bg-studio-accent hover:text-white'}`}
            title="Enhance prompt details"
          >
            {isRefining ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
            <span>ENHANCE</span>
          </button>
        </div>
        <textarea 
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); yPrompt?.set('currentPrompt', e.target.value); }}
          placeholder="Art style, details, mood..."
          className="w-full h-24 bg-black/40 border border-studio-border rounded p-2 text-xs focus:outline-none focus:border-studio-accent resize-none placeholder:italic placeholder:opacity-30"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">Style Preset</label>
        <div className="grid grid-cols-2 gap-2">
          {['fantasy', 'cyberpunk', 'retro', 'dark_souls'].map(preset => (
            <button 
              key={preset}
              onClick={() => updateConfig('stylePreset', preset)}
              className={`py-1.5 rounded text-[9px] font-bold border transition-all uppercase tracking-tighter ${stylePreset === preset ? 'bg-studio-accent border-studio-accent text-white shadow-lg shadow-studio-accent/20' : 'bg-black/20 border-studio-border text-studio-text-dim hover:bg-black/40'}`}
            >
              {preset.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">Seed</label>
          <input 
            type="number" 
            value={seed}
            onChange={(e) => { const v = parseInt(e.target.value) || 0; setSeed(v); yPrompt?.set('currentSeed', v); }}
            className="w-full bg-black/40 border border-studio-border rounded px-2 py-1 text-xs focus:outline-none focus:border-studio-accent"
          />
        </div>
        <StudioSlider label="Steps" yMap={yPrompt} stateKey="steps" min={10} max={50} className="flex-1" />
      </div>

      <button 
        onClick={handleGenerate}
        disabled={!prompt.trim() && !isGenerating}
        className={`py-2 rounded font-bold text-xs transition-all ${isGenerating ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-studio-accent text-white hover:bg-studio-accent/80'}`}
      >
        {isGenerating ? 'STOP' : 'GENERATE'}
      </button>
      
      <div className="flex flex-col gap-2 flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">Variations</label>
          <div className="flex gap-1">
            {[1, 4, 9].map(n => (
              <button key={n} onClick={() => setNumVariations(n)} className={`px-2 py-0.5 text-[9px] rounded ${numVariations === n ? 'bg-studio-accent text-white' : 'bg-black/20 text-studio-text-dim'}`}>{n}</button>
            ))}
          </div>
        </div>
        <div className={`grid gap-2 flex-1 overflow-y-auto content-start ${numVariations === 1 ? 'grid-cols-1' : numVariations <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {new Array(numVariations).fill(0).map((_, i) => (
            <div key={i} className="aspect-square bg-black/40 rounded border border-studio-border relative overflow-hidden flex items-center justify-center">
              {variations[i] ? (
                <>
                  <img src={`data:image/png;base64,${variations[i]}`} className="w-full h-full object-contain" alt="" />
                  <button onClick={() => promote(variations[i])} className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ThumbsUp size={14} className="text-white" />
                  </button>
                </>
              ) : isGenerating && <Loader2 size={12} className="animate-spin text-studio-accent" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
