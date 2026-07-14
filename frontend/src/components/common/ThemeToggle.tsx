import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from './Button'

export function ThemeToggle() {
  // Temporary: Comment out imports that cause issues
  // const { theme, setTheme, isDark } = useTheme()
  // const { showToast } = useStudioStore()
  // useThemeShortcuts()
  
  const theme = 'light' // Temporary
  const isDark = false // Temporary

  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'auto', icon: Monitor, label: 'Auto' }
  ]

  const currentTheme = themes.find(t => t.id === theme)
  const CurrentIcon = currentTheme?.icon || Sun

  const cycleThroughThemes = () => {
    // Temporarily disabled
    console.log('Theme cycling disabled')
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleThroughThemes}
        title={`Current: ${currentTheme?.label}. Theme cycling temporarily disabled`}
        className="transition-all duration-200 hover:bg-studio-hover"
      >
        <CurrentIcon size={18} className={isDark ? "text-yellow-400" : "text-blue-600"} />
      </Button>
      
      <span className="text-xs text-studio-text-dim hidden md:inline">
        {currentTheme?.label} (Temp)
      </span>
    </div>
  )
}

// Theme selector dropdown component - temporarily disabled
export function ThemeSelector() {
  return (
    <div className="text-xs text-studio-text-dim">
      Theme selector temporarily disabled
    </div>
  )
}

// Theme information component - temporarily disabled
export function ThemeInfo() {
  return (
    <div className="text-xs text-studio-text-dim p-3 bg-studio-card rounded-lg border border-studio-border">
      <div className="font-medium text-studio-text mb-1">Theme Information</div>
      <div className="space-y-1">
        <div>Current: <span className="text-studio-accent font-medium">Light</span></div>
        <div>Mode: <span className="text-studio-accent font-medium">Light (Temp)</span></div>
        <div>Keyboard: <span className="text-studio-text">Theme features coming soon</span></div>
      </div>
    </div>
  )
}