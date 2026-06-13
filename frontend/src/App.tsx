import { Activity, Settings, Github, Wifi, WifiOff } from 'lucide-react'
import ImageEditor from './components/ImageEditor'
import AudioMixer from './components/AudioMixer'
import ChatPanel from './components/ChatPanel'
import { useStudioStore } from './hooks/useStudioStore'

const StatusBar = ({ connected }: { connected: boolean }) => (
  <div className={`h-6 ${connected ? 'bg-studio-accent' : 'bg-red-500'} text-white flex items-center px-3 justify-between text-[10px] font-medium transition-colors duration-500`}>
    <div className="flex items-center gap-4">
      <div className="flex items-center">
        {connected ? <Wifi size={10} className="mr-1" /> : <WifiOff size={10} className="mr-1" />}
        <span>{connected ? 'SYNC: CONNECTED' : 'SYNC: DISCONNECTED'}</span>
      </div>
      <div className="flex items-center">
        <Activity size={10} className="mr-1" />
        <span>INFERENCE: READY</span>
      </div>
      <div className="flex items-center">
        <Settings size={10} className="mr-1" />
        <span>HARDWARE: AUTO</span>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <span>FPS: 60</span>
      <div className="flex items-center">
        <Github size={10} className="mr-1" />
        <span>PRODUCTION BUILD</span>
      </div>
    </div>
  </div>
)

function App() {
  const { connected } = useStudioStore()

  return (
    <div className="flex flex-col h-full overflow-hidden font-sans select-none bg-studio-bg">
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <ImageEditor />
          <AudioMixer />
        </div>
        <ChatPanel />
      </div>
      <StatusBar connected={connected} />
    </div>
  )
}

export default App
