import React, { createContext, useContext, useEffect, useState } from 'react'

// Theme configuration types
interface MaterialTheme {
  mode: 'light' | 'dark' | 'auto'
  density: 'compact' | 'normal' | 'comfortable'
  spacing: 'tight' | 'normal' | 'comfortable' | 'spacious' | 'extra-spacious'
  accentColor: 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'warning'
  borderRadius: 'minimal' | 'normal' | 'rounded' | 'extra-rounded'
  animations: 'none' | 'minimal' | 'standard' | 'enhanced'
}

interface ThemeConfigContextType {
  theme: MaterialTheme
  setTheme: (theme: Partial<MaterialTheme>) => void
  globalSpacingScale: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    xl2: string
    xl3: string
  }
}

// Default theme configuration
const DEFAULT_THEME: MaterialTheme = {
  mode: 'dark',
  density: 'normal',
  spacing: 'normal',
  accentColor: 'primary',
  borderRadius: 'normal',
  animations: 'standard'
}

const ThemeConfigContext = createContext<ThemeConfigContextType | undefined>(undefined)

// Material Design spacing scales based on user preference
const SPACING_SCALES = {
  tight: {
    xs: '0.125rem',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    xl2: '1.25rem',
    xl3: '1.5rem'
  },
  normal: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xl2: '2.5rem',
    xl3: '3rem'
  },
  comfortable: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    xl2: '4rem',
    xl3: '5rem'
  },
  spacious: {
    xs: '0.75rem',
    sm: '1.5rem',
    md: '2rem',
    lg: '3rem',
    xl: '4rem',
    xl2: '6rem',
    xl3: '8rem'
  },
  'extra-spacious': {
    xs: '1rem',
    sm: '2rem',
    md: '3rem',
    lg: '4rem',
    xl: '6rem',
    xl2: '8rem',
    xl3: '12rem'
  }
}

// Corner radius mappings
const BORDER_RADIUS = {
  minimal: {
    xs: '2px',
    sm: '4px',
    md: '4px',
    lg: '4px',
    xl: '6px'
  },
  normal: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  },
  rounded: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px'
  },
  'extra-rounded': {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px'
  }
}

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<MaterialTheme>(() => {
    // Load saved theme from localStorage
    const saved = localStorage.getItem('material-theme')
    return saved ? { ...DEFAULT_THEME, ...JSON.parse(saved) } : DEFAULT_THEME
  })

  const [globalSpacingScale] = useState(SPACING_SCALES[theme.spacing])

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('material-theme', JSON.stringify(theme))
    
    // Apply CSS custom properties
    applyThemeToDOM()
  }, [theme])

  const applyThemeToDOM = () => {
    const root = document.documentElement
    
    // Apply spacing scale
    Object.entries(SPACING_SCALES[theme.spacing]).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value)
    })
    
    // Apply border radius
    Object.entries(BORDER_RADIUS[theme.borderRadius]).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value)
    })
    
    // Apply theme mode
    const resolvedMode = theme.mode === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme.mode
    
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedMode)
    
    // Apply accent color
    root.style.setProperty('--accent-color', `var(--studio-${theme.accentColor})`)
    
    // Apply density
    const densityScale = {
      compact: 0.8,
      normal: 1,
      comfortable: 1.2
    }
    root.style.setProperty('--density-scale', densityScale[theme.density].toString())
  }

  const setThemeProperty = (updates: Partial<MaterialTheme>) => {
    setTheme(prev => ({ ...prev, ...updates }))
  }

  return (
    <ThemeConfigContext.Provider value={{ 
      theme, 
      setTheme: setThemeProperty,
      globalSpacingScale
    }}>
      {children}
    </ThemeConfigContext.Provider>
  )
}

export function useThemeConfig() {
  const context = useContext(ThemeConfigContext)
  if (!context) {
    throw new Error('useThemeConfig must be used within a ThemeConfigProvider')
  }
  return context
}

// Custom hooks for specific theme properties
export function useSpacing() {
  const { globalSpacingScale } = useThemeConfig()
  return globalSpacingScale
}

export function useDensity() {
  const { theme } = useThemeConfig()
  return {
    scale: {
      compact: 0.8,
      normal: 1,
      comfortable: 1.2
    }[theme.density],
    className: `density-${theme.density}`
  }
}

export function useAnimations() {
  const { theme } = useThemeConfig()
  const animationClasses = {
    none: '',
    minimal: 'animate-fade-in',
    standard: 'animate-material-in',
    enhanced: 'animate-material-in animate-ripple'
  }
  return animationClasses[theme.animations]
}