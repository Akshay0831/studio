import React from 'react'
import { useDensity } from '../../core/ThemeConfigContext'
import { cn } from '../../utils/cn'

export interface MaterialCardProps {
  variant?: 'elevated' | 'outlined' | 'filled'
  elevation?: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 | 24
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  hover?: boolean
  clickable?: boolean
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const elevationStyles = {
  0: 'shadow-none',
  1: 'shadow-sm',
  2: 'shadow-md',
  3: 'shadow-lg',
  4: 'shadow-xl',
  6: 'shadow-2xl',
  8: 'shadow-3xl',
  12: 'shadow-[0_12px_24px_-4px_rgba(0,0,0,0.12)]',
  16: 'shadow-[0_16px_32px_-4px_rgba(0,0,0,0.12)]',
  24: 'shadow-[0_24px_48px-4px_rgba(0,0,0,0.14)]'
}

const paddingStyles = {
  none: '',
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8'
}

const roundedStyles = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full'
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  variant = 'elevated',
  elevation = 2,
  padding = 'md',
  rounded = 'md',
  hover = false,
  clickable = false,
  children,
  className,
  onClick,
  ...props
}) => {
  const { scale } = useDensity()

  const variantStyles = {
    elevated: 'bg-studio-panel border border-studio-border',
    outlined: 'bg-transparent border-2 border-studio-border',
    filled: 'bg-studio-panel border-none'
  }

  const hoverEffect = hover ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200' : ''
  const clickableEffect = clickable ? 'cursor-pointer' : ''
  const clickAnimation = clickable ? 'active:scale-[0.98] active:shadow-sm' : ''

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        variantStyles[variant],
        elevationStyles[elevation],
        paddingStyles[padding],
        roundedStyles[rounded],
        hoverEffect,
        clickableEffect,
        clickAnimation,
        className
      )}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center'
      }}
      onClick={clickable ? onClick : undefined}
      {...props}
    >
      {/* Optional subtle gradient overlay */}
      {variant === 'elevated' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}
      
      {children}
    </div>
  )
}

// Specialized card components
export const MaterialCardHeader: React.FC<{
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}> = ({ title, subtitle, action, className }) => (
  <div className={cn('flex items-start justify-between mb-4', className)}>
    <div>
      <h3 className="text-lg font-semibold text-studio-text">{title}</h3>
      {subtitle && (
        <p className="text-sm text-studio-text-dim mt-1">{subtitle}</p>
      )}
    </div>
    {action && (
      <div className="flex-shrink-0">
        {action}
      </div>
    )}
  </div>
)

export const MaterialCardContent: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('text-studio-text', className)}>
    {children}
  </div>
)

export const MaterialCardFooter: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('flex items-center justify-between mt-4 pt-4 border-t border-studio-border', className)}>
    {children}
  </div>
)