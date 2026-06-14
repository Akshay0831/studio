import React from 'react';
import { 
  MessageSquare, 
  History 
} from 'lucide-react';
import { ArtControls } from '../features/art/ArtControls';
import { AudioControls } from '../features/audio/AudioControls';

const ChatPanel: React.FC = () => {
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

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-8 custom-scrollbar">
        {/* Modular Sections */}
        <section>
          <ArtControls />
        </section>
        
        <div className="h-px bg-studio-border/50" />
        
        <section>
          <AudioControls />
        </section>
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
