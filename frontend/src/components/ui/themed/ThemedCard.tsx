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

const variantStyles: Record<string, string> = {
  default: 'bg-studio-card border border-studio-border',
  outlined: 'bg-studio-card border-2 border-studio-border',
  elevated: 'bg-studio-card shadow-lg hover:shadow-xl'
};

const paddingStyles: Record<string, string> = {
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

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-studio-text/60', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pt-6', className)}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';