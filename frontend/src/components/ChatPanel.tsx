import { MessageSquare, Terminal, History, RotateCcw } from 'lucide-react';
import { ExtensionManifest } from '../features/registry';
import { useStudioStore } from '../core/useStudioStore';

interface ChatPanelProps {
  activeExtension: ExtensionManifest;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ activeExtension }) => {
  const { yHistory, users, connected } = useStudioStore();
  const history = yHistory?.toArray() || [];

  return (
    <div className="w-64 bg-studio-panel border-l border-studio-border flex flex-col overflow-hidden shadow-2xl z-10">
      <div className="h-10 border-b border-studio-border flex items-center px-4 justify-between bg-black/20">
        <div className="flex items-center gap-2">
          <div className="relative">
            <activeExtension.icon size={14} className="text-studio-accent" />
            {connected && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse border border-black" />}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider">{activeExtension.name}</span>
        </div>
        <div className="flex -space-x-1">
          {Object.values(users).slice(0, 3).map((u: any, i) => (
            <div key={i} className="w-4 h-4 rounded-full border border-studio-border flex items-center justify-center text-[7px] font-bold" style={{ backgroundColor: u.color }} title={u.name}>
              {u.name[0]}
            </div>
          ))}
          {Object.keys(users).length > 3 && <div className="w-4 h-4 rounded-full bg-studio-bg border border-studio-border flex items-center justify-center text-[7px] text-studio-text-dim">+{Object.keys(users).length - 3}</div>}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-8 custom-scrollbar bg-[#1a1a1a]/50">
        <activeExtension.sidebarControls />
        
        <div className="flex flex-col gap-3 mt-auto pt-8 border-t border-studio-border/30">
          <div className="flex items-center gap-2 text-studio-text-dim">
            <History size={12} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Project History</span>
          </div>
          <div className="flex flex-col gap-2">
            {history.slice().reverse().map((item: any, i) => (
              <div key={i} className="bg-black/40 border border-studio-border/50 rounded p-2 flex flex-col gap-2 hover:border-studio-accent/50 transition-colors group">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-studio-accent uppercase">{item.type}</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity"><RotateCcw size={10} className="text-studio-text-dim hover:text-white" /></button>
                </div>
                {item.preview && <img src={item.preview} className="w-full h-12 object-cover rounded border border-white/5" alt="" />}
                <div className="text-[9px] text-studio-text-dim truncate italic">"{item.label}"</div>
              </div>
            ))}
            {history.length === 0 && <div className="text-[9px] text-center text-studio-text-dim py-4 italic">No history yet</div>}
          </div>
        </div>
      </div>

      <div className="h-20 border-t border-studio-border p-3 bg-black/40 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-2 text-[9px] font-mono">
          <Terminal size={10} className="text-blue-400" />
          <span className="text-studio-text-dim uppercase tracking-tighter">System initialized</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
