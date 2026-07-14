import React, { forwardRef, useState } from 'react'
import { useThemeConfig, useDensity } from '../../core/ThemeConfigContext'
import { cn } from '../../utils/cn'

export interface MaterialButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  ripple?: boolean
  density?: 'compact' | 'normal' | 'comfortable'
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  title?: string
  className?: string
}

const variantStyles = {
  primary: 'bg-studio-primary hover:bg-studio-primary/90 text-white',
  secondary: 'bg-studio-secondary hover:bg-studio-secondary/90 text-white',
  outline: 'border-2 border-studio-accent text-studio-accent hover:bg-studio-accent/10',
  ghost: 'text-studio-text hover:bg-studio-hover',
  destructive: 'bg-studio-error hover:bg-studio-error/90 text-white'
}

const sizeStyles = {
  xs: 'text-xs py-1 px-2 rounded-md',
  sm: 'text-sm py-2 px-3 rounded-md',
  md: 'text-base py-2.5 px-4 rounded-lg',
  lg: 'text-lg py-3 px-6 rounded-lg',
  xl: 'text-xl py-4 px-8 rounded-xl',
  icon: 'p-2'
}

const densityStyles = {
  compact: {
    xs: 'px-2 py-1',
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-2.5',
    xl: 'px-8 py-3'
  },
  normal: {
    xs: 'px-3 py-1.5',
    sm: 'px-4 py-2',
    md: 'px-5 py-2.5',
    lg: 'px-7 py-3',
    xl: 'px-9 py-4'
  },
  comfortable: {
    xs: 'px-4 py-2',
    sm: 'px-5 py-2.5',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
    xl: 'px-10 py-5'
  }
}

export const MaterialButton = forwardRef<HTMLButtonElement, MaterialButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  ripple = true,
  density: propDensity,
  children,
  onClick,
  className,
  ...props
}, ref) => {
  const { theme } = useThemeConfig()
  const { scale } = useDensity()
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

  const density = propDensity || theme.density
  const baseStyles = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variantClass = variantStyles[variant]
  const sizeClass = sizeStyles[size]
  const densityClass = densityStyles[density as keyof typeof densityStyles][size as keyof typeof densityStyles.normal]
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  const fullClass = fullWidth ? 'w-full' : ''

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return
    
    if (ripple && event.currentTarget) {
      const button = event.currentTarget
      const rect = button.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      const newRipple = { x, y, id: Date.now() }
      setRipples(prev => [...prev, newRipple])
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id))
      }, 600)
    }
    
    onClick?.(event)
  }

  return (
    <button
      ref={ref}
      className={cn(
        baseStyles,
        variantClass,
        sizeClass,
        densityClass,
        disabledClass,
        fullClass,
        'relative overflow-hidden',
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center'
      }}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/20 animate-ripple pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: '20px',
            height: '20px',
          }}
        />
      ))}
      
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Icon and content */}
      <div className="flex items-center justify-center gap-2">
        {startIcon && !loading && (
          <span className="flex-shrink-0">{startIcon}</span>
        )}
        
        {loading ? (
          <span className="opacity-0">{children}</span>
        ) : (
          <span>{children}</span>
        )}
        
        {endIcon && !loading && (
          <span className="flex-shrink-0">{endIcon}</span>
        )}
      </div>
    </button>
  )
})

MaterialButton.displayName = 'MaterialButton'