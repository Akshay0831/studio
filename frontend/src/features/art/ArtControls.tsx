import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  ThumbsUp, 
  RefreshCw,
  XCircle,
  Loader2
} from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';

export const ArtControls: React.FC = () => {
  const { yPrompt, yImage, sendMessage, lastMessage } = useStudioStore();
  const [prompt, setPrompt] = useState('');
  const [seed, setSeed] = useState(0);
  const [numVariations, setNumVariations] = useState(4);
  const [steps, setSteps] = useState(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [variations, setVariations] = useState<string[]>([]);

  useEffect(() => {
    const handleYjsUpdate = () => {
      const remotePrompt = yPrompt.get('currentPrompt') as string;
      if (remotePrompt !== undefined && remotePrompt !== prompt) {
        setPrompt(remotePrompt);
      }
      const remoteSeed = yPrompt.get('currentSeed') as number;
      if (remoteSeed !== undefined && remoteSeed !== seed) {
        setSeed(remoteSeed);
      }
    };

    yPrompt.observe(handleYjsUpdate);
    return () => yPrompt.unobserve(handleYjsUpdate);
  }, [yPrompt, prompt, seed]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'image_chunk') {
      setProgress(lastMessage.data.progress || 0);
    } else if (lastMessage.type === 'generation_complete') {
      if (lastMessage.result && lastMessage.result.image_b64) {
        const variationIndex = lastMessage.variation_index !== undefined ? lastMessage.variation_index : 0;
        setVariations(previousVariations => {
          const updatedVariations = [...previousVariations];
          updatedVariations[variationIndex] = lastMessage.result.image_b64;
          return updatedVariations;
        });
        
        if (lastMessage.variation_index === numVariations - 1 || numVariations === 1) {
          setIsGenerating(false);
          setProgress(100);
        }
      }
    }
  }, [lastMessage, numVariations]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    yPrompt.set('currentPrompt', newPrompt);
  };

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSeed = parseInt(e.target.value) || 0;
    setSeed(newSeed);
    yPrompt.set('currentSeed', newSeed);
  };

  const handleRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000);
    setSeed(newSeed);
    yPrompt.set('currentSeed', newSeed);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setProgress(0);
    setVariations(new Array(numVariations).fill(''));

    const canvasDataStr = yImage.get('canvasData') as string;
    const canvasData = canvasDataStr ? JSON.parse(canvasDataStr) : null;
    const hasMask = canvasData && canvasData.objects && canvasData.objects.length > 0;

    sendMessage({
      type: hasMask ? 'inpaint_image' : 'generate_image',
      prompt: prompt,
      seed: seed,
      num_variations: numVariations,
      base_image: hasMask ? yImage.get('baseImageData') : undefined,
      mask_image: hasMask ? canvasDataStr : undefined,
      config: { steps: steps }
    });
  };

  const promoteVariation = (b64: string) => {
    yImage.set('baseImageData', b64);
    yImage.set('canvasData', JSON.stringify({ version: "5.3.0", objects: [] }));
  };

  const handleCancel = () => {
    setIsGenerating(false);
    setProgress(0);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase font-bold text-studio-text-dim tracking-wider">Art Prompt</label>
          <span className="text-[10px] text-studio-text-dim/50">{prompt.length} / 500</span>
        </div>
        <div className="relative group">
          <textarea 
            value={prompt}
            onChange={handlePromptChange}
            className="w-full bg-studio-bg border border-studio-border rounded-lg p-3 text-sm h-32 resize-none focus:outline-none focus:border-studio-accent transition-all group-hover:border-studio-text-dim/30 custom-scrollbar"
            placeholder="Describe asset..."
          />
          <div className="absolute bottom-2 right-2 flex gap-1">
            <button className="p-1.5 rounded-md bg-studio-accent/10 text-studio-accent hover:bg-studio-accent/20 transition-colors">
              <Sparkles size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-studio-text-dim">Seed</label>
          <div className="relative">
            <input 
              type="number" 
              value={seed}
              onChange={handleSeedChange}
              className="w-full bg-studio-bg border border-studio-border rounded py-1.5 px-2 text-xs focus:outline-none focus:border-studio-accent pr-7" 
            />
            <button 
              onClick={handleRandomSeed}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-studio-text-dim hover:text-studio-accent transition-colors"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-studio-text-dim">Steps</label>
          <select 
            value={steps}
            onChange={(e) => setSteps(parseInt(e.target.value))}
            className="w-full bg-studio-bg border border-studio-border rounded py-1.5 px-2 text-xs focus:outline-none focus:border-studio-accent appearance-none"
          >
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase font-bold text-studio-text-dim">Variations</label>
        <div className="flex items-center gap-4">
          <input 
            type="range" 
            min="1" 
            max="4" 
            value={numVariations} 
            onChange={(e) => setNumVariations(parseInt(e.target.value))}
            className="flex-1 accent-studio-accent"
          />
          <span className="text-xs text-studio-text font-mono w-4">{numVariations}</span>
        </div>
      </div>

      {isGenerating && (
        <div className="space-y-2 p-3 bg-studio-accent/10 border border-studio-accent/20 rounded-lg">
          <div className="flex items-center justify-between text-[10px] text-studio-accent font-bold uppercase">
            <div className="flex items-center">
              <Loader2 size={12} className="mr-2 animate-spin" />
              Generating...
            </div>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-studio-accent transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button 
        onClick={isGenerating ? handleCancel : handleGenerate}
        disabled={!prompt.trim() && !isGenerating}
        className={`relative overflow-hidden group py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
          isGenerating 
            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
            : 'bg-studio-accent text-white hover:bg-studio-accent/90 shadow-[0_4px_15px_rgba(0,122,204,0.3)] hover:shadow-[0_6px_20px_rgba(0,122,204,0.4)] disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {isGenerating ? (
          <>
            <XCircle size={18} />
            <span>Cancel</span>
          </>
        ) : (
          <>
            <Send size={18} />
            <span>Generate Art</span>
          </>
        )}
      </button>

      <div className="flex flex-col gap-3">
        <label className="text-[10px] uppercase font-bold text-studio-text-dim">Results</label>
        <div className="grid grid-cols-2 gap-2">
          {new Array(numVariations).fill(0).map((_, i) => (
            <div key={i} className="aspect-square bg-black/40 border border-studio-border rounded-md hover:border-studio-accent transition-colors cursor-pointer group relative overflow-hidden flex items-center justify-center">
              {variations[i] ? (
                <>
                  <img src={`data:image/png;base64,${variations[i]}`} className="w-full h-full object-contain" alt={`Variation ${i}`} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                     <button 
                      onClick={() => promoteVariation(variations[i])}
                      className="p-1.5 bg-studio-accent rounded shadow-lg text-white flex items-center gap-1 text-[10px]"
                     >
                      <ThumbsUp size={12} />
                      <span>Promote</span>
                     </button>
                  </div>
                </>
              ) : (
                <span className="text-[10px] text-studio-text-dim">...</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
