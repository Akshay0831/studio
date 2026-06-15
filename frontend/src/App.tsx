import { useEffect, useState } from 'react'
import { Activity, Settings, Github, Wifi, WifiOff } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import ChatPanel from './components/ChatPanel'
import { useStudioStore } from './core/useStudioStore'
import { EXTENSION_REGISTRY } from './features/registry'

function App() {
  const { connected, users } = useStudioStore()
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health')
        if (res.ok) setMetrics(await res.json())
      } catch (e) {}
    }
    const id = setInterval(checkHealth, 10000)
    checkHealth()
    return () => clearInterval(id)
  }, [])

  const vram = metrics?.vram
  const gpu = metrics?.gpu_type || 'GPU'

  return (
    <div className="flex flex-col h-full overflow-hidden bg-studio-bg text-studio-text">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#222', color: '#fff', fontSize: '11px', border: '1px solid #333' }
      }} />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {EXTENSION_REGISTRY.map(ext => <ext.primaryView key={ext.id} />)}
        </div>
        <ChatPanel />
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
              {vram ? `${gpu.toUpperCase()} (${Math.round(vram.allocated_mb / 102.4) / 10}GB / ${Math.round(vram.total_mb / 102.4) / 10}GB)` : 'CPU'}
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
