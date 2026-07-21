import React, { forwardRef } from 'react'
import { cn } from '../../../lib/utils'
import { useTheme } from '../../../core/ThemeContext'

export interface ThemedDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export const ThemedDialog = forwardRef<HTMLDivElement, ThemedDialogProps>(
  ({ children, open, onOpenChange, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

export interface ThemedDialogTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

export const ThemedDialogTrigger = forwardRef<HTMLButtonElement, ThemedDialogTriggerProps>(
  ({ children, asChild, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    if (asChild) {
      return <button ref={ref} {...props}>{children}</button>
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-studio-accent disabled:pointer-events-none disabled:opacity-50',
          'bg-studio-accent text-white hover:bg-studio-accent-hover',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

export interface ThemedDialogContentProps {
  children: React.ReactNode
  className?: string
  onClose?: () => void
}

export const ThemedDialogContent = forwardRef<HTMLDivElement, ThemedDialogContentProps>(
  ({ children, className, onClose, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div
          ref={ref}
          className={cn(
            'relative transform overflow-hidden rounded-lg bg-studio-card p-6 text-studio-text shadow-xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)

export interface ThemedDialogHeaderProps {
  children: React.ReactNode
  className?: string
}

export const ThemedDialogHeader = forwardRef<HTMLDivElement, ThemedDialogHeaderProps>(
  ({ children, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5 text-center sm:text-left',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

export interface ThemedDialogTitleProps {
  children: React.ReactNode
  className?: string
}

export const ThemedDialogTitle = forwardRef<HTMLDivElement, ThemedDialogTitleProps>(
  ({ children, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <h2
        ref={ref}
        className={cn(
          'text-lg font-semibold leading-none tracking-tight',
          className
        )}
        {...props}
      >
        {children}
      </h2>
    )
  }
)

export interface ThemedDialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

export const ThemedDialogDescription = forwardRef<HTMLParagraphElement, ThemedDialogDescriptionProps>(
  ({ children, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <p
        ref={ref}
        className={cn(
          'text-sm text-studio-text-dim',
          className
        )}
        {...props}
      >
        {children}
      </p>
    )
  }
)