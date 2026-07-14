import React, { useState, forwardRef } from 'react'
import { cn } from '../../utils/cn'

export interface MaterialInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url'
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: boolean
  helperText?: string
  label?: string
  required?: boolean
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'filled' | 'outlined' | 'standard'
  className?: string
}

const sizeStyles = {
  sm: 'py-2 px-3 text-sm',
  md: 'py-2.5 px-4 text-base',
  lg: 'py-3 px-5 text-lg'
}

const variantStyles = {
  filled: 'bg-studio-panel border border-studio-border',
  outlined: 'bg-transparent border-2 border-studio-border',
  standard: 'bg-studio-panel border border-studio-border border-b-2'
}

export const MaterialInput = forwardRef<HTMLInputElement, MaterialInputProps>(({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
  label,
  required = false,
  startIcon,
  endIcon,
  size = 'md',
  variant = 'outlined',
  className,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }

  const inputClasses = cn(
    'w-full bg-studio-panel border transition-all duration-200',
    variantStyles[variant],
    sizeStyles[size],
    'text-studio-text placeholder-studio-text-dim focus:outline-none',
    error && 'border-studio-error focus:border-studio-error',
    !error && !disabled && isFocused && `border-studio-accent focus:border-studio-accent`,
    disabled && 'opacity-50 cursor-not-allowed',
    startIcon && 'pl-10',
    endIcon && 'pr-10',
    className
  )

  const hasError = error || helperText

  return (
    <div className="w-full">
      {label && (
        <label className={cn(
          'block text-sm font-medium mb-2 transition-colors',
          error ? 'text-studio-error' : 'text-studio-text',
          disabled ? 'opacity-50' : ''
        )}>
          {label}
          {required && <span className="text-studio-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {startIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-studio-text-dim pointer-events-none">
            {startIcon}
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
        
        {endIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-studio-text-dim pointer-events-none">
            {endIcon}
          </div>
        )}
      </div>
      
      {hasError && (
        <p className={cn(
          'mt-1 text-xs transition-colors',
          error ? 'text-studio-error' : 'text-studio-text-dim'
        )}>
          {helperText}
        </p>
      )}
    </div>
  )
})

MaterialInput.displayName = 'MaterialInput'

// Material Select Component
export interface MaterialSelectProps {
  options: Array<{ value: string; label: string }>
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  helperText?: string
  label?: string
  required?: boolean
  className?: string
}

export const MaterialSelect: React.FC<MaterialSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  error = false,
  helperText,
  label,
  required = false,
  className
}) => {
  const handleFocus = () => {}
  const handleBlur = () => {}
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value)
  }

  const selectClasses = cn(
    'w-full bg-studio-panel border-2 transition-all duration-200',
    'text-studio-text placeholder-studio-text-dim focus:outline-none',
    error ? 'border-studio-error focus:border-studio-error' : 'border-studio-border focus:border-studio-accent',
    disabled && 'opacity-50 cursor-not-allowed',
    'py-2.5 px-4 pr-8 rounded-lg appearance-none cursor-pointer',
    className
  )

  const hasError = error || helperText

  return (
    <div className="w-full">
      {label && (
        <label className={cn(
          'block text-sm font-medium mb-2 transition-colors',
          error ? 'text-studio-error' : 'text-studio-text',
          disabled ? 'opacity-50' : ''
        )}>
          {label}
          {required && <span className="text-studio-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={selectClasses}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            className="w-4 h-4 text-studio-text-dim"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {hasError && (
        <p className={cn(
          'mt-1 text-xs transition-colors',
          error ? 'text-studio-error' : 'text-studio-text-dim'
        )}>
          {helperText}
        </p>
      )}
    </div>
  )
}

// Material Textarea Component
export interface MaterialTextareaProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: boolean
  helperText?: string
  label?: string
  required?: boolean
  rows?: number
  className?: string
}

export const MaterialTextarea: React.FC<MaterialTextareaProps> = ({
  placeholder,
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
  label,
  required = false,
  rows = 4,
  className
}) => {
  const handleFocus = () => {}
  const handleBlur = () => {}
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value)
  }

  const textareaClasses = cn(
    'w-full bg-studio-panel border-2 transition-all duration-200',
    'text-studio-text placeholder-studio-text-dim focus:outline-none',
    error ? 'border-studio-error focus:border-studio-error' : 'border-studio-border focus:border-studio-accent',
    disabled && 'opacity-50 cursor-not-allowed',
    'py-2.5 px-4 rounded-lg resize-none',
    className
  )

  const hasError = error || helperText

  return (
    <div className="w-full">
      {label && (
        <label className={cn(
          'block text-sm font-medium mb-2 transition-colors',
          error ? 'text-studio-error' : 'text-studio-text',
          disabled ? 'opacity-50' : ''
        )}>
          {label}
          {required && <span className="text-studio-error ml-1">*</span>}
        </label>
      )}
      
      <textarea
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className={textareaClasses}
      />
      
      {hasError && (
        <p className={cn(
          'mt-1 text-xs transition-colors',
          error ? 'text-studio-error' : 'text-studio-text-dim'
        )}>
          {helperText}
        </p>
      )}
    </div>
  )
}