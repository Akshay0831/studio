import React from 'react';
import { 
  Music, 
  Volume2, 
  Settings2, 
  Play, 
  Pause, 
  Square,
  ChevronRight
} from 'lucide-react';

const AudioMixer: React.FC = () => {
  const layers = [
    { name: 'Bass', active: true },
    { name: 'Lead', active: true },
    { name: 'Drums', active: true },
    { name: 'Ambient', active: false },
  ];

  return (
    <div className="h-64 bg-studio-panel border-t border-studio-border flex flex-col overflow-hidden">
      <div className="h-10 border-b border-studio-border flex items-center px-4 bg-studio-panel justify-between">
        <div className="flex items-center">
          <Music size={16} className="mr-2 text-studio-accent" />
          <span className="text-sm font-medium">Audio Mixer</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-black/40 rounded border border-studio-border p-0.5">
            <button className="p-1 hover:bg-studio-accent/20 rounded transition-colors text-studio-text-dim hover:text-studio-accent">
              <Play size={14} fill="currentColor" />
            </button>
            <button className="p-1 hover:bg-studio-accent/20 rounded transition-colors text-studio-text-dim hover:text-studio-accent">
              <Pause size={14} fill="currentColor" />
            </button>
            <button className="p-1 hover:bg-studio-accent/20 rounded transition-colors text-studio-text-dim hover:text-studio-accent">
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
            <input type="number" defaultValue={120} className="w-10 bg-black/40 border border-studio-border text-[10px] text-center rounded py-0.5 focus:outline-none focus:border-studio-accent" />
          </div>
          <button className="text-studio-text-dim hover:text-studio-text">
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex p-4 gap-3 overflow-x-auto bg-[#1a1a1a]">
        {layers.map((layer) => (
          <div key={layer.name} className={`w-40 flex-shrink-0 bg-studio-bg border border-studio-border rounded-lg p-3 flex flex-col ${!layer.active && 'opacity-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-studio-text-dim">{layer.name}</span>
              <div className={`w-2 h-2 rounded-full ${layer.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-studio-border'}`} />
            </div>
            
            <div className="flex-1 flex gap-3 mb-3">
              <div className="w-6 bg-black/40 rounded-full relative overflow-hidden flex flex-col justify-end p-0.5">
                <div className="absolute inset-x-0 bottom-0 bg-studio-accent/40 h-2/3 rounded-full" />
                <div className="w-full h-1 bg-white rounded-full z-10 shadow-sm" style={{ marginBottom: '66%' }} />
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
