import React, { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../core/ThemeContext';

export interface ThemedButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';  asChild?: boolean;}

const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variantStyles: Record<string, string> = {
  default: 'bg-accent text-white hover:bg-accent-hover focus:ring-accent',
  destructive: 'bg-error text-white hover:bg-error/90 focus:ring-error',
  outline: 'border border-border bg-card hover:bg-hover focus:ring-border',
  secondary: 'bg-secondary text-card hover:bg-secondary/80 focus:ring-secondary',
  ghost: 'hover:bg-hover text-card focus:ring-border',
  link: 'text-accent underline-offset-4 hover:underline focus:ring-accent'
};

const sizeStyles: Record<string, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3 text-xs',
  lg: 'h-11 px-8 text-base',
  icon: 'h-10 w-10'
};

export const ThemedButton = forwardRef<HTMLButtonElement, ThemedButtonProps>(({
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  children,
  className,
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const { isDark } = useTheme();
  
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        // Theme-aware styles
        isDark && variant === 'outline' ? 'border-studio-border bg-studio-card' : '',
        isDark && variant === 'secondary' ? 'bg-studio-secondary text-studio-text' : '',
        isDark && variant === 'ghost' ? 'hover:bg-studio-hover' : '',
        loading && 'opacity-70 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
});

ThemedButton.displayName = 'ThemedButton';