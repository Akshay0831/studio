import React, { forwardRef } from 'react'
import { cn } from '../../../lib/utils'
import { useTheme } from '../../../core/ThemeContext'

export interface ThemedTabsProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export const ThemedTabs = forwardRef<HTMLDivElement, ThemedTabsProps>(
  ({ children, value, onValueChange, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

export interface ThemedTabsListProps {
  children: React.ReactNode
  className?: string
}

export const ThemedTabsList = forwardRef<HTMLDivElement, ThemedTabsListProps>(
  ({ children, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex h-10 items-center justify-center rounded-md bg-studio-panel p-1 text-studio-text',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

export interface ThemedTabsTriggerProps {
  children: React.ReactNode
  value: string
  className?: string
}

export const ThemedTabsTrigger = forwardRef<HTMLButtonElement, ThemedTabsTriggerProps>(
  ({ children, value, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-studio-accent focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-studio-panel-selected data-[state=active]:text-white',
          'data-[state=active]:shadow-md',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

export interface ThemedTabsContentProps {
  children: React.ReactNode
  value: string
  className?: string
}

export const ThemedTabsContent = forwardRef<HTMLDivElement, ThemedTabsContentProps>(
  ({ children, value, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <div
        ref={ref}
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)