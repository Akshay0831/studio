import React, { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../core/ThemeContext';

export interface ThemedInputProps {
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  type?: string;
  id?: string;
  label?: string;
}

const baseStyles = 'flex w-full rounded-md border transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const variantStyles: Record<string, string> = {
  default: 'border-border bg-card hover:border-hover focus:border-accent focus:ring-accent',
  filled: 'border-transparent bg-hover hover:bg-hover/80 focus:bg-hover focus:ring-accent',
  outlined: 'border-2 border-border bg-transparent hover:border-hover focus:border-accent focus:ring-accent'
};

const sizeStyles: Record<string, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-4 py-2 text-sm',
  lg: 'h-11 px-5 text-base'
};

export const ThemedInput = forwardRef<HTMLInputElement, ThemedInputProps>(({
  variant = 'default',
  size = 'md',
  error = false,
  disabled = false,
  placeholder,
  value,
  onChange,
  className,
  type = 'text',
  id,
  label,
  ...props
}, ref) => {
  const { isDark } = useTheme();
  
  const input = (
    <input
      ref={ref}
      type={type}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        error && 'border-error focus:border-error focus:ring-error',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      id={id}
      {...props}
    />
  );
  
  if (label) {
    return (
      <div className="flex flex-col space-y-2">
        <label 
          htmlFor={id} 
          className={cn(
            'text-sm font-medium',
            error ? 'text-error' : 'text-text',
            disabled ? 'text-text-dim' : ''
          )}
        >
          {label}
        </label>
        {input}
      </div>
    );
  }
  
  return input;
});

ThemedInput.displayName = 'ThemedInput';