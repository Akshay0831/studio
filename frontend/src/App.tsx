import { useState, useEffect } from 'react'
import { Activity, Settings, Github, Palette } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import LanguageSwitcher from './components/LanguageSwitcher'
import { FullScreenLoader } from './components/common/LoadingSpinner'
import { ApiStatusChecker } from './components/common/ApiStatusChecker'
import ChatPanel from './components/ChatPanel'
import { useStudioStore } from './core/useStudioStore'
import { useWorktree } from './core/useWorktree'
import { EXTENSION_REGISTRY } from './features/registry'
import { StudioErrorBoundary } from './features/common/components/StudioErrorBoundary'
import { GlobalErrorBoundary } from './features/common/components/StudioErrorBoundary'
import { ThemeProvider, useTheme } from './core/ThemeContext'
import { ThemeToggle } from './components/common/ThemeToggle'
import { ThemeConfigProvider } from './core/ThemeConfigContext'
import { KeyboardShortcutsHelp } from './core/KeyboardShortcuts'
import { COMMON_SHORTCUTS, useKeyboardShortcuts } from './core/KeyboardShortcuts'
import { MaterialButton } from './components/common/MaterialButton'
import { ThemeCustomizationPanel } from './components/ThemeCustomizationPanel'

function InnerApp() {
  const { connected, metrics } = useStudioStore()
  const { isReviewMode, discardProposal, activeProposalId } = useWorktree()
  const [activeExtId, setActiveExtId] = useState(EXTENSION_REGISTRY[0].id)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const { theme, isDark } = useTheme()
  
  const [showThemePanel, setShowThemePanel] = useState(false)

  const activeExt = EXTENSION_REGISTRY.find(e => e.id === activeExtId) || EXTENSION_REGISTRY[0]
  const vram = metrics?.vram

  // Initialize keyboard shortcuts
  useKeyboardShortcuts(COMMON_SHORTCUTS)

  // Simulate app loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // F1 or Ctrl/Cmd+H for help
      if (event.key === 'F1' || (event.ctrlKey || event.metaKey) && event.key === 'h') {
        event.preventDefault()
        setShowHelp(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!isLoaded) {
    return (
      <GlobalErrorBoundary>
        <FullScreenLoader message="Initializing Unified Editing Studio..." />
      </GlobalErrorBoundary>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#222', color: '#fff', fontSize: '11px', border: '1px solid #333' }
      }} />
      
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-studio-card border border-studio-border rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-studio-border">
              <h2 className="text-lg font-bold text-studio-text">Help & Shortcuts</h2>
              <div className="flex items-center gap-2">
                <MaterialButton variant="ghost" size="icon" onClick={() => setShowHelp(false)}>
                  <Activity size={16} />
                </MaterialButton>
              </div>
            </div>
            <div className="p-6">
              <KeyboardShortcutsHelp />
              <div className="mt-6 p-4 bg-studio-background rounded-lg">
                <h3 className="font-medium text-studio-text mb-2">Quick Tips</h3>
                <ul className="text-sm text-studio-text-dim space-y-1">
                  <li>• Use Ctrl/Cmd+U to cycle through themes</li>
                  <li>• Press F1 or Ctrl/Cmd+H to see all shortcuts</li>
                  <li>• Mouse over buttons to see tooltips</li>
                  <li>• Extensions can be switched from the sidebar</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Extension Switcher Sidebar */}
        <div className="w-12 bg-studio-sidebar-bg border-r border-studio-border flex flex-col items-center py-4 gap-4">
          {EXTENSION_REGISTRY.map(ext => (
            <button
              key={ext.id}
              onClick={() => setActiveExtId(ext.id)}
              className={`p-2 rounded-lg transition-all ${activeExtId === ext.id ? 'bg-studio-accent text-white shadow-lg' : 'text-studio-text-dim hover:text-white hover:bg-studio-hover'}`}
              title={ext.name}
            >
              <ext.icon size={20} />
            </button>
          ))}
          
          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
          </div>
          
          {/* Theme Toggle & Customization */}
          <div className="flex-1 flex flex-col justify-end gap-2">
            <MaterialButton
              variant="ghost"
              size="icon"
              onClick={() => setShowThemePanel(true)}
              title="Theme Settings"
            >
              <Palette size={16} />
            </MaterialButton>
            <ThemeToggle />
          </div>
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

      {/* Theme Customization Modal */}
      {showThemePanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-studio-card border border-studio-border rounded-xl shadow-2xl max-w-4xl w-full m-4 max-h-[85vh] overflow-hidden animate-material-in">
            <div className="flex items-center justify-between p-4 border-b border-studio-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
                  <Palette size={20} />
                </div>
                <h2 className="text-xl font-bold text-studio-text">Theme & Appearance</h2>
              </div>
              <div className="flex items-center gap-2">
                <MaterialButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowThemePanel(false)}
                >
                  Close
                </MaterialButton>
              </div>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <ThemeCustomizationPanel />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className={`h-6 ${connected ? 'bg-studio-accent' : 'bg-studio-error'} text-white flex items-center px-3 justify-between text-[10px] font-bold`}>
        <div className="flex items-center gap-4">
          <ApiStatusChecker />
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
          <div className="flex items-center gap-2">
            <MaterialButton
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              title="Help (F1)"
              className="h-6 w-6 p-0"
            >
              <Github size={12} />
            </MaterialButton>
          </div>
        </div>
        <div className="text-xs text-white/80">
          Theme: {theme} {isDark ? '🌙' : '☀️'}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ThemeConfigProvider>
        <GlobalErrorBoundary>
          <InnerApp />
        </GlobalErrorBoundary>
      </ThemeConfigProvider>
    </ThemeProvider>
  )
}

export default App
