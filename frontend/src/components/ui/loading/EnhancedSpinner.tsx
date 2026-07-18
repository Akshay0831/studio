import React, { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

interface EnhancedSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  text?: string;
  textClassName?: string;
  showPercentage?: boolean;
  percentage?: number;
  animation?: 'spin' | 'pulse' | 'bounce' | 'wave';
  centered?: boolean;
  overlay?: boolean;
  delay?: number;
  progress?: number;
  children?: React.ReactNode;
}

const sizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
};

const variantClasses = {
  primary: 'text-blue-600 dark:text-blue-400',
  secondary: 'text-gray-600 dark:text-gray-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-cyan-600 dark:text-cyan-400'
};

const animationClasses = {
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  wave: 'animate-pulse'
};

export const EnhancedSpinner: React.FC<EnhancedSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  text,
  textClassName,
  showPercentage = false,
  percentage = 0,
  animation = 'spin',
  centered = false,
  overlay = false,
  delay = 0,
  progress,
  children
}) => {
  const [show, setShow] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (progress !== undefined && progress !== currentProgress) {
      // Animate progress change
      const step = (progress - currentProgress) / 10;
      let current = currentProgress;
      
      const interval = setInterval(() => {
        current += step;
        if ((step > 0 && current >= progress) || (step < 0 && current <= progress)) {
          setCurrentProgress(progress);
          clearInterval(interval);
        } else {
          setCurrentProgress(current);
        }
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [progress, currentProgress]);

  if (!show) {
    return children || null;
  }

  const spinnerContent = (
    <div className={cn(
      'inline-flex items-center justify-center',
      centered && 'flex-col',
      overlay && 'fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center'
    )}>
      {/* Spinner */}
      <div className={cn(
        'relative',
        sizeClasses[size],
        variantClasses[variant],
        animationClasses[animation],
        className
      )}>
        {/* Rotating circles */}
        <div className="absolute inset-0 rounded-full border-2 border-current border-t-transparent" />
        <div className="absolute inset-0 rounded-full border-2 border-current border-r-transparent animate-spin-reverse" style={{ animationDelay: '0.5s' }} />
        
        {/* Inner circle for some variants */}
        <div className="absolute inset-1 rounded-full bg-white/20 dark:bg-studio-card/20" />
        
        {/* Wave effect */}
        {animation === 'wave' && (
          <>
            <div className="absolute top-0 left-1/2 w-1 h-1 bg-current rounded-full transform -translate-x-1/2 animate-ping" />
            <div className="absolute top-2 left-1/2 w-1 h-1 bg-current rounded-full transform -translate-x-1/2 animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-4 left-1/2 w-1 h-1 bg-current rounded-full transform -translate-x-1/2 animate-ping" style={{ animationDelay: '0.4s' }} />
          </>
        )}
      </div>

      {/* Text */}
      {(text || showPercentage) && (
        <div className={cn(
          'mt-2',
          textSizes[size],
          variantClasses[variant],
          textClassName,
          centered && 'text-center'
        )}>
          {text && <span>{text}</span>}
          {showPercentage && (
            <span className={cn('ml-2 font-medium')}>
              {Math.round(currentProgress)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar for overlay mode */}
      {overlay && progress !== undefined && (
        <div className="mt-4 w-64 bg-gray-200 dark:bg-studio-card rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${currentProgress}%` }}
          />
        </div>
      )}
    </div>
  );

  return children ? spinnerContent : null;
};

// Loading skeletons
export const Skeleton: React.FC<{
  className?: string;
  lines?: number;
  animated?: boolean;
}> = ({ className, lines = 1, animated = true }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gray-200 dark:bg-studio-card rounded animate-pulse',
            animated ? 'animate-pulse' : '',
            className
          )}
        />
      ))}
    </div>
  );
};

// Loading states for different scenarios
export const LoadingState: React.FC<{
  type?: 'page' | 'card' | 'button' | 'table';
  message?: string;
}> = ({ type = 'page', message = 'Loading...' }) => {
  switch (type) {
    case 'page':
      return (
        <div className="min-h-screen flex items-center justify-center">
          <EnhancedSpinner size="xl" text={message} centered />
        </div>
      );
    
    case 'card':
      return (
        <div className="p-6 border border-studio-border rounded-lg">
          <EnhancedSpinner size="lg" text={message} centered />
        </div>
      );
    
    case 'button':
      return (
        <button disabled className="flex items-center gap-2 px-4 py-2 bg-studio-card border border-studio-border rounded-md">
          <EnhancedSpinner size="sm" />
          {message}
        </button>
      );
    
    case 'table':
      return (
        <div className="p-4">
          <EnhancedSpinner size="md" text={message} centered />
        </div>
      );
    
    default:
      return (
        <EnhancedSpinner text={message} />
      );
  }
};

// Progress ring component
interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  text?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 60,
  strokeWidth = 4,
  progress,
  color = 'currentColor',
  backgroundColor = 'transparent',
  showPercentage = true,
  text
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          stroke={backgroundColor}
          fill="none"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          stroke={color}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      
      {/* Center text */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
          {Math.round(progress)}%
        </div>
      )}
      
      {text && !showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
          {text}
        </div>
      )}
    </div>
  );
};