import React, { forwardRef } from 'react'
import { cn } from '../../../lib/utils'
import { useTheme } from '../../../core/ThemeContext'
import { ChevronDown } from 'lucide-react'

export interface ThemedSelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const ThemedSelect = forwardRef<HTMLDivElement, ThemedSelectProps>(
  ({ children, value, onValueChange, placeholder, disabled = false, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full',
          className
        )}
        {...props}
      >
        <select
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-studio-border bg-studio-input-bg px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-studio-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'appearance-none'
          )}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-studio-text-dim pointer-events-none" />
      </div>
    )
  }
)

export interface ThemedSelectTriggerProps {
  children: React.ReactNode
  className?: string
}

export const ThemedSelectTrigger = forwardRef<HTMLButtonElement, ThemedSelectTriggerProps>(
  ({ children, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <button
        ref={ref}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-studio-border bg-studio-input-bg px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-studio-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

export interface ThemedSelectValueProps {
  placeholder?: string
  className?: string
}

export const ThemedSelectValue = forwardRef<HTMLSpanElement, ThemedSelectValueProps>(
  ({ placeholder, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <span
        ref={ref}
        className={cn(
          'block truncate',
          className
        )}
        {...props}
      >
        {placeholder}
      </span>
    )
  }
)

export interface ThemedSelectContentProps {
  children: React.ReactNode
  className?: string
}

export const ThemedSelectContent = forwardRef<HTMLDivElement, ThemedSelectContentProps>(
  ({ children, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative z-50 min-h-[8rem] w-40 overflow-hidden rounded-md border bg-studio-card text-studio-text shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

export interface ThemedSelectItemProps {
  children: React.ReactNode
  value: string
  className?: string
}

export const ThemedSelectItem = forwardRef<HTMLDivElement, ThemedSelectItemProps>(
  ({ children, value, className, ...props }, ref) => {
    const { isDark } = useTheme()
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full cursor-default select-none items-center rounded-sm px-8 py-1.5 text-sm outline-none transition-colors hover:bg-studio-hover focus:bg-studio-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)