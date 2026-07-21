import React, { forwardRef } from 'react'
import { cn } from '../../../lib/utils'
import { useTheme } from '../../../core/ThemeContext'

export interface ThemedBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors'

const variantStyles = {
  default: 'bg-accent text-white',
  secondary: 'bg-secondary text-text',
  destructive: 'bg-error text-white',
  outline: 'border border-border text-text bg-transparent'
}

export const ThemedBadge = forwardRef<HTMLDivElement, ThemedBadgeProps>(
  ({ children, variant = 'default', className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)