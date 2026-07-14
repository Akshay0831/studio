import { useEffect, useCallback } from 'react'

export interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description: string
  action: () => void
  category?: string
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const matchesModifiers = 
        (shortcut.ctrl || false) === event.ctrlKey &&
        (shortcut.shift || false) === event.shiftKey &&
        (shortcut.alt || false) === event.altKey &&
        (shortcut.meta || false) === event.metaKey

      if (matchesKey && matchesModifiers) {
        event.preventDefault()
        shortcut.action()
        
        break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])
}

// Predefined shortcuts for common actions
export const COMMON_SHORTCUTS: Shortcut[] = [
  // Project Management
  {
    key: 's',
    ctrl: true,
    description: 'Save current project',
    action: () => console.log('Save project'),
    category: 'Project'
  },
  {
    key: 'n',
    ctrl: true,
    description: 'New project',
    action: () => console.log('New project'),
    category: 'Project'
  },
  {
    key: 'o',
    ctrl: true,
    description: 'Open project',
    action: () => console.log('Open project'),
    category: 'Project'
  },
  
  // Edit Operations
  {
    key: 'z',
    ctrl: true,
    description: 'Undo',
    action: () => console.log('Undo'),
    category: 'Edit'
  },
  {
    key: 'y',
    ctrl: true,
    description: 'Redo',
    action: () => console.log('Redo'),
    category: 'Edit'
  },
  {
    key: 'x',
    ctrl: true,
    description: 'Cut',
    action: () => console.log('Cut'),
    category: 'Edit'
  },
  {
    key: 'c',
    ctrl: true,
    description: 'Copy',
    action: () => console.log('Copy'),
    category: 'Edit'
  },
  {
    key: 'v',
    ctrl: true,
    description: 'Paste',
    action: () => console.log('Paste'),
    category: 'Edit'
  },
  {
    key: 'a',
    ctrl: true,
    description: 'Select all',
    action: () => console.log('Select all'),
    category: 'Edit'
  },
  
  // Find and Navigation
  {
    key: 'f',
    ctrl: true,
    description: 'Find',
    action: () => console.log('Find'),
    category: 'Navigation'
  },
  {
    key: 'h',
    ctrl: true,
    description: 'Search',
    action: () => console.log('Search'),
    category: 'Navigation'
  },
  {
    key: 'p',
    ctrl: true,
    description: 'Print',
    action: () => console.log('Print'),
    category: 'Navigation'
  },
  
  // UI Controls
  {
    key: ',',
    ctrl: true,
    description: 'Settings',
    action: () => console.log('Open settings'),
    category: 'UI'
  },
  {
    key: '/',
    ctrl: true,
    description: 'Help',
    action: () => console.log('Show help'),
    category: 'UI'
  },
  {
    key: 'b',
    ctrl: true,
    description: 'Toggle sidebar',
    action: () => console.log('Toggle sidebar'),
    category: 'UI'
  },
  {
    key: 'Escape',
    description: 'Close modal/panel',
    action: () => console.log('Close modal/panel'),
    category: 'UI'
  },
  
  // Media Controls
  {
    key: 'u',
    ctrl: true,
    description: 'Cycle theme (Light/Dark/Auto)',
    action: () => console.log('Cycle theme'),
    category: 'Appearance'
  },
  
  // Workspace
  {
    key: 'Tab',
    description: 'Navigate panels',
    action: () => console.log('Navigate panels'),
    category: 'Workspace'
  },
  {
    key: 'ArrowRight',
    ctrl: true,
    description: 'Next panel',
    action: () => console.log('Next panel'),
    category: 'Workspace'
  },
  {
    key: 'ArrowLeft',
    ctrl: true,
    description: 'Previous panel',
    action: () => console.log('Previous panel'),
    category: 'Workspace'
  }
]

// Keyboard shortcuts help dialog
export function KeyboardShortcutsHelp() {
  const categories = COMMON_SHORTCUTS.reduce((acc, shortcut) => {
    if (!shortcut.category) return acc
    if (!acc[shortcut.category]) acc[shortcut.category] = []
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)

  return (
    <div className="bg-studio-card rounded-lg border border-studio-border p-6 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-bold text-studio-text mb-4">Keyboard Shortcuts</h3>
      
      <div className="space-y-6">
        {Object.entries(categories).map(([category, shortcuts]) => (
          <div key={category}>
            <h4 className="font-medium text-studio-text-dim mb-2">{category}</h4>
            <div className="space-y-1">
              {shortcuts.map((shortcut, index) => {
                const modifierKeys = [
                  shortcut.ctrl && 'Ctrl',
                  shortcut.shift && 'Shift',
                  shortcut.alt && 'Alt',
                  shortcut.meta && 'Cmd'
                ].filter(Boolean).join('+')
                
                return (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm text-studio-text">
                      {modifierKeys && (
                        <span className="text-studio-secondary font-mono mr-2">
                          {modifierKeys}+
                        </span>
                      )}
                      <span className="font-mono text-studio-accent">
                        {shortcut.key.toUpperCase()}
                      </span>
                    </span>
                    <span className="text-xs text-studio-text-dim text-right">
                      {shortcut.description}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}