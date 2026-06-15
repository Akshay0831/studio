import React from 'react';
import { MessageSquare, Terminal } from 'lucide-react';
import { EXTENSION_REGISTRY } from '../features/registry';

const ChatPanel: React.FC = () => {
  return (
    <div className="w-64 bg-studio-panel border-l border-studio-border flex flex-col overflow-hidden">
      <div className="h-10 border-b border-studio-border flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-studio-accent" />
          <span className="text-xs font-bold uppercase tracking-tight">Controls</span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-8 custom-scrollbar">
        {EXTENSION_REGISTRY.map((ext, i) => (
          <React.Fragment key={ext.id}>
            <ext.sidebarControls />
            {i < EXTENSION_REGISTRY.length - 1 && <div className="h-px bg-studio-border/30" />}
          </React.Fragment>
        ))}
      </div>

      <div className="h-20 border-t border-studio-border p-3 bg-black/20 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-2 text-[9px] font-mono">
          <Terminal size={10} className="text-blue-400" />
          <span className="text-studio-text-dim uppercase tracking-tighter">System initialized</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
