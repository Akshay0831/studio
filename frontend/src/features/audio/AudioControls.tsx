import React from 'react';
import { 
  Music, 
  Settings,
  History
} from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';

export const AudioControls: React.FC = () => {
  const { yAudio } = useStudioStore();
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase font-bold text-studio-text-dim tracking-wider">Audio Projects</label>
          <button className="text-studio-text-dim hover:text-studio-text">
            <History size={14} />
          </button>
        </div>
        <div className="bg-black/20 border border-studio-border rounded-lg p-3 text-sm text-studio-text-dim italic">
          Select a sequence or mood to begin...
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[10px] uppercase font-bold text-studio-text-dim">Global Settings</label>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-studio-text-dim">Auto-Sync BPM</span>
            <input type="checkbox" className="accent-studio-accent" defaultChecked />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-studio-text-dim">Master Limiter</span>
            <input type="checkbox" className="accent-studio-accent" defaultChecked />
          </div>
        </div>
      </div>

      <button className="w-full py-3 rounded-lg bg-studio-accent/20 text-studio-accent border border-studio-accent/30 font-bold text-sm hover:bg-studio-accent/30 transition-all flex items-center justify-center gap-2">
        <Music size={18} />
        <span>Analyze Composition</span>
      </button>
    </div>
  );
};
