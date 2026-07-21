import { forwardRef } from 'react'
import { cn } from '../../../lib/utils'
import { useTheme } from '../../../core/ThemeContext'
import { AlertCircle } from 'lucide-react'

// Type definitions for the component
export interface ThemedAlertProps {
  children: any;
  variant?: 'default' | 'destructive';
  className?: string;
}

interface ThemedAlertDescriptionProps {
  children?: React.ReactNode;
  className?: string;
}

const baseStyles = 'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground'

const variantStyles: Record<string, string> = {
  default: 'bg-accent/10 border-accent text-accent',
  destructive: 'border-error bg-error/10 text-error'
}

export const ThemedAlert = forwardRef<HTMLDivElement, ThemedAlertProps>(
  ({ children, variant = 'default', className, ...props }: ThemedAlertProps, ref) => {
    const { isDark } = useTheme();
    
    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant] || variantStyles.default,
          className
        )}
        {...props}
      >
        {variant === 'destructive' && <AlertCircle className="h-4 w-4" />}
        {children}
      </div>
    )
  }
);

export const ThemedAlertDescription = forwardRef<HTMLParagraphElement, ThemedAlertDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm', className)}
      {...props}
    />
  )
);