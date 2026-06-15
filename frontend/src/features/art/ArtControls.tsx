import React, { useState, useEffect } from 'react';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStudioStore } from '../../core/useStudioStore';
import { useArtGeneration } from '../../hooks/useArtGeneration';

export const ArtControls: React.FC = () => {
  const { yPrompt, yImage } = useStudioStore();
  const { isGenerating, variations, generate, cancel, numVariations, setNumVariations } = useArtGeneration();
  const [prompt, setPrompt] = useState('');
  const [seed, setSeed] = useState(0);
  const [steps, setSteps] = useState(20);

  useEffect(() => {
    if (!yPrompt) return;
    const update = () => {
      const p = yPrompt.get('currentPrompt');
      if (typeof p === 'string' && p !== prompt) setPrompt(p);
      const s = yPrompt.get('currentSeed');
      if (typeof s === 'number' && s !== seed) setSeed(s);
    };
    yPrompt.observe(update);
    return () => yPrompt.unobserve(update);
  }, [yPrompt, prompt, seed]);

  const promote = (data: string) => {
    if (!yImage) return;
    yImage.set('baseImageData', data);
    yImage.set('canvasData', JSON.stringify({ version: "5.3.0", objects: [] }));
    toast.success('Promoted to canvas');
  };

  return (
    <div className="flex flex-col h-full bg-studio-panel p-4 gap-6 custom-scrollbar overflow-y-auto">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">Prompt</label>
        <textarea 
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); yPrompt?.set('currentPrompt', e.target.value); }}
          placeholder="Art style, details, mood..."
          className="w-full h-24 bg-black/40 border border-studio-border rounded p-2 text-xs focus:outline-none focus:border-studio-accent resize-none"
        />
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
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">Steps</label>
          <input type="range" min="10" max="50" value={steps} onChange={(e) => setSteps(parseInt(e.target.value))} className="w-full accent-studio-accent" />
        </div>
      </div>
      <button 
        onClick={isGenerating ? cancel : () => generate(prompt, seed, steps, numVariations)}
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
