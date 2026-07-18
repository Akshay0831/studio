import React, { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../core/ThemeContext';

export interface ThemedCardProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const baseStyles = 'rounded-lg transition-all duration-200';

const variantStyles = {
  default: 'bg-card border border-border',
  outlined: 'bg-card border-2 border-border',
  elevated: 'bg-card shadow-lg hover:shadow-xl'
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8'
};

export const ThemedCard = forwardRef<HTMLDivElement, ThemedCardProps>(({
  variant = 'default',
  padding = 'md',
  children,
  className,
  onClick,
  ...props
}, ref) => {
  const { isDark } = useTheme();
  
  return (
    <div
      ref={ref}
      className={cn(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        // Theme-aware hover effects
        isDark && variant === 'default' ? 'hover:bg-studio-card-hover' : '',
        isDark && variant === 'outlined' ? 'hover:border-studio-accent hover:bg-studio-card-hover' : '',
        isDark && variant === 'elevated' ? 'hover:bg-studio-card hover:shadow-2xl' : '',
        // Clickable styling
        onClick && 'cursor-pointer hover:shadow-lg transition-shadow',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
});

ThemedCard.displayName = 'ThemedCard';