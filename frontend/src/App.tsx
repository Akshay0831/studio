import { useState } from 'react'
import { Activity, Settings, Github, Wifi, WifiOff } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import ChatPanel from './components/ChatPanel'
import { useStudioStore } from './core/useStudioStore'
import { useWorktree } from './core/useWorktree'
import { EXTENSION_REGISTRY } from './features/registry'
import { StudioErrorBoundary } from './features/common/components/StudioErrorBoundary'

function App() {
  const { connected, users, metrics } = useStudioStore()
  const { isReviewMode, discardProposal, activeProposalId } = useWorktree()
  const [activeExtId, setActiveExtId] = useState(EXTENSION_REGISTRY[0].id)

  const activeExt = EXTENSION_REGISTRY.find(e => e.id === activeExtId) || EXTENSION_REGISTRY[0]
  const vram = metrics?.vram

  return (
    <div className="flex flex-col h-full overflow-hidden bg-studio-bg text-studio-text">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#222', color: '#fff', fontSize: '11px', border: '1px solid #333' }
      }} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Extension Switcher Sidebar */}
        <div className="w-12 bg-black/40 border-r border-studio-border flex flex-col items-center py-4 gap-4">
          {EXTENSION_REGISTRY.map(ext => (
            <button 
              key={ext.id}
              onClick={() => setActiveExtId(ext.id)}
              className={`p-2 rounded-lg transition-all ${activeExtId === ext.id ? 'bg-studio-accent text-white shadow-lg' : 'text-studio-text-dim hover:text-white hover:bg-white/5'}`}
              title={ext.name}
            >
              <ext.icon size={20} />
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {isReviewMode && (
            <div className="absolute top-0 left-0 right-0 z-50 bg-studio-accent-orange text-white px-4 py-1 flex items-center justify-between shadow-md animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <Activity size={12} className="animate-pulse" />
                <span>Reviewing: {String(activeProposalId)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => discardProposal(String(activeProposalId)!)}
                  className="bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-[10px] transition-colors"
                >
                  CANCEL REVIEW
                </button>
              </div>
            </div>
          )}
          <StudioErrorBoundary key={activeExt.id}>
            <activeExt.primaryView />
          </StudioErrorBoundary>
        </div>
        <ChatPanel activeExtension={activeExt} />
      </div>
      
      <div className={`h-6 ${connected ? 'bg-studio-accent' : 'bg-red-700'} text-white flex items-center px-3 justify-between text-[10px] font-bold`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
            <span>{connected ? 'CONNECTED' : 'OFFLINE'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity size={10} />
            <span>CORE: {metrics?.status === 'ok' ? 'ACTIVE' : 'STARTING'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Settings size={10} />
            <span>
              {vram ? (
                vram.device_type === 'cuda' 
                  ? `${vram.device_type.toUpperCase()}: ${vram.free_mb}MB FREE`
                  : vram.device_type === 'mps'
                    ? `MPS: ${vram.free_mb}MB ESTIMATED`
                    : 'CPU MODE'
              ) : 'INITIALIZING...'}
            </span>
          </div>
          <div className="flex items-center gap-2 border-l border-white/20 pl-4">
            <span className="opacity-60">USERS:</span>
            <div className="flex -space-x-1">
              {Object.values(users).map((u: any, i) => (
                <div key={i} className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[8px]" style={{ backgroundColor: u.color }} title={u.name}>
                  {u.name[0]}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center opacity-60">
          <Github size={10} className="mr-1" />
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  )
}

export default App
