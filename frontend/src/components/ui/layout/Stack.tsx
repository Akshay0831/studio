import React, { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../core/ThemeContext';

export interface StackProps {
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: number | string;
  wrap?: boolean;
  className?: string;
  children: React.ReactNode;
}

const directionStyles = {
  row: 'flex-row',
  col: 'flex-col',
};

const alignStyles = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyStyles = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const gapStyles = (gap: number | string) => {
  if (typeof gap === 'number') {
    return `gap-${gap}`;
  }
  return gap;
};

export const Stack = forwardRef<HTMLDivElement, StackProps>(({
  direction = 'col',
  align = 'start',
  justify = 'start',
  gap = 4,
  wrap = false,
  className,
  children,
  ...props
}, ref) => {
  const { isDark } = useTheme();
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex',
        directionStyles[direction],
        alignStyles[align],
        justifyStyles[justify],
        gapStyles(gap),
        wrap && 'flex-wrap',
        // Theme-aware stacking
        isDark ? 'stack-studio-dark' : 'stack-studio-light',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Stack.displayName = 'Stack';