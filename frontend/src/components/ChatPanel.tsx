import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  History, 
  ThumbsUp, 
  RefreshCw,
  XCircle
} from 'lucide-react';

const ChatPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="w-80 bg-studio-panel border-l border-studio-border flex flex-col overflow-hidden">
      <div className="h-10 border-b border-studio-border flex items-center px-4 bg-studio-panel justify-between">
        <div className="flex items-center">
          <MessageSquare size={16} className="mr-2 text-studio-accent" />
          <span className="text-sm font-medium">Control & Chat</span>
        </div>
        <button className="text-studio-text-dim hover:text-studio-text">
          <History size={16} />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-bold text-studio-text-dim tracking-wider">Prompt</label>
            <span className="text-[10px] text-studio-text-dim/50">{prompt.length} / 500</span>
          </div>
          <div className="relative group">
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
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
                defaultValue={0} 
                className="w-full bg-studio-bg border border-studio-border rounded py-1.5 px-2 text-xs focus:outline-none focus:border-studio-accent pr-7" 
              />
              <button className="absolute right-1.5 top-1/2 -translate-y-1/2 text-studio-text-dim hover:text-studio-accent transition-colors">
                <RefreshCw size={12} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-studio-text-dim">Steps</label>
            <select className="w-full bg-studio-bg border border-studio-border rounded py-1.5 px-2 text-xs focus:outline-none focus:border-studio-accent appearance-none">
              <option>20</option>
              <option>30</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <button 
          onClick={() => setIsGenerating(!isGenerating)}
          className={`relative overflow-hidden group py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            isGenerating 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
              : 'bg-studio-accent text-white hover:bg-studio-accent/90 shadow-[0_4px_15px_rgba(0,122,204,0.3)] hover:shadow-[0_6px_20px_rgba(0,122,204,0.4)]'
          }`}
        >
          {isGenerating ? (
            <>
              <XCircle size={18} />
              <span>Cancel Operation</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Generate Asset</span>
            </>
          )}
        </button>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase font-bold text-studio-text-dim">Variations</label>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-black/40 border border-studio-border rounded-md hover:border-studio-accent transition-colors cursor-pointer group relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                   <button className="p-1 bg-studio-accent rounded shadow-lg text-white"><ThumbsUp size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-24 border-t border-studio-border p-3 bg-black/20 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        <div className="text-[9px] text-studio-text-dim font-mono flex gap-2">
          <span className="text-blue-400">[SYSTEM]</span>
          <span>READY</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
