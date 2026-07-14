import React, { forwardRef } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variants = {
  default: 'bg-studio-accent text-white hover:bg-studio-accent-hover active:bg-studio-accent/80',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  outline: 'border border-studio-input-border bg-transparent text-studio-text hover:bg-studio-hover active:bg-studio-hover/50',
  secondary: 'bg-studio-hover text-studio-text hover:bg-studio-hover/80 active:bg-studio-hover',
  ghost: 'hover:bg-studio-hover active:bg-studio-hover/50 text-studio-text',
  link: 'text-studio-accent hover:text-studio-accent-hover underline-offset-4 hover:underline'
}

const sizes = {
  default: 'h-9 px-4 py-2 text-sm font-medium',
  sm: 'h-8 px-3 text-xs font-medium',
  lg: 'h-10 px-6 text-base font-medium',
  icon: 'h-9 w-9'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'default', 
    size = 'default', 
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        className={`
          ${variants[variant]} 
          ${sizes[size]}
          inline-flex items-center justify-center gap-2 rounded-md
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-studio-accent focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${className}
        `}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {loading && (
          <div className="animate-spin">
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
          </div>
        )}
        
        {!loading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        {children}
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Specialized button variants
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'children'>>(({ ...props }, ref) => (
  <Button {...props} size="icon" ref={ref} />
))

IconButton.displayName = 'IconButton'

export const PrimaryButton = forwardRef<HTMLButtonElement, ButtonProps>(({ ...props }, ref) => (
  <Button {...props} variant="default" ref={ref} />
))

PrimaryButton.displayName = 'PrimaryButton'

export const SecondaryButton = forwardRef<HTMLButtonElement, ButtonProps>(({ ...props }, ref) => (
  <Button {...props} variant="secondary" ref={ref} />
))

SecondaryButton.displayName = 'SecondaryButton'