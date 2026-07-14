import React, { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  theme: 'light' | 'dark' | 'auto'
  setTheme: (theme: any) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEMES = {
  light: {
    'studio-bg': '#ffffff',
    'studio-text': '#000000',
    'studio-text-dim': '#666666',
    'studio-border': '#e5e5e5',
    'studio-accent': '#3b82f6',
    'studio-accent-hover': '#2563eb',
    'studio-hover': '#f3f4f6',
    'studio-error': '#ef4444',
    'studio-success': '#10b981',
    'studio-warning': '#f59e0b',
    'studio-secondary': '#6b7280',
    'studio-background': '#f9fafb',
    'studio-card': '#ffffff',
    'studio-input-bg': '#ffffff',
    'studio-input-border': '#d1d5db',
    'studio-panel-bg': '#ffffff',
    'studio-sidebar-bg': '#f8fafc'
  },
  dark: {
    'studio-bg': '#0f172a',
    'studio-text': '#f1f5f9',
    'studio-text-dim': '#94a3b8',
    'studio-border': '#334155',
    'studio-accent': '#3b82f6',
    'studio-accent-hover': '#60a5fa',
    'studio-hover': '#1e293b',
    'studio-error': '#f87171',
    'studio-success': '#4ade80',
    'studio-warning': '#fbbf24',
    'studio-secondary': '#64748b',
    'studio-background': '#1e293b',
    'studio-card': '#1e293b',
    'studio-input-bg': '#334155',
    'studio-input-border': '#475569',
    'studio-panel-bg': '#334155',
    'studio-sidebar-bg': '#0f172a'
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null
    if (savedTheme) {
      setTheme(savedTheme)
    }

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const currentTheme = savedTheme || 'auto'
    setIsDark(currentTheme === 'dark' || (currentTheme === 'auto' && prefersDark))
  }, [])

  useEffect(() => {
    // Apply theme to CSS variables
    const currentTheme = theme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme

    setIsDark(currentTheme === 'dark')
    localStorage.setItem('theme', theme)

    const themeColors = THEMES[currentTheme]
    
    // Update CSS custom properties
    Object.entries(themeColors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key.replace('studio-', '')}`, value)
    })

    // Update body classes
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(currentTheme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Helper hook for theme-aware values
export function useThemeValue(key: keyof typeof THEMES['light']) {
  const { isDark } = useTheme()
  const theme = isDark ? THEMES.dark : THEMES.light
  return theme[key]
}

// Keyboard shortcut handler
export function useThemeShortcuts() {
  const { setTheme } = useTheme()

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + U: Cycle theme
      if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
        event.preventDefault()
        setTheme('light')
      }
      
      // Ctrl/Cmd + Shift + U: Quick theme toggle (light/dark only)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'U') {
        event.preventDefault()
        setTheme('dark')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [setTheme])
}