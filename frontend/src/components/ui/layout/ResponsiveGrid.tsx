import React, { forwardRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../core/ThemeContext';

export interface ResponsiveGridProps {
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number | string;
  className?: string;
  children: React.ReactNode;
  autoFit?: boolean;
  minColWidth?: string;
  maxColWidth?: string;
  rowGap?: number | string;
  colGap?: number | string;
  stretchItems?: boolean;
  autoRows?: string;
  animation?: 'none' | 'fade' | 'slide' | 'scale';
  animationDuration?: number;
}

const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

const responsiveGridCols = (cols: ResponsiveGridProps['cols']) => {
  if (!cols) return gridCols[1];
  
  const classes = [gridCols[cols.default as keyof typeof gridCols]];
  
  if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
  if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
  if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
  if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
  
  return classes.join(' ');
};

const gapStyles = (gap: number | string, type: 'gap' | 'rowGap' | 'colGap' = 'gap') => {
  if (typeof gap === 'number') {
    switch (type) {
      case 'rowGap': return `row-gap-${gap}`;
      case 'colGap': return `col-gap-${gap}`;
      default: return `gap-${gap}`;
    }
  }
  return gap;
};

const getAnimationClass = (animation: string, duration: number) => {
  if (!animation || animation === 'none') return '';
  
  const baseClass = 'transition-all';
  const durationClass = duration ? `duration-${duration}` : 'duration-200';
  const animationClasses = {
    fade: 'opacity-0 animate-fade-in',
    slide: 'transform translate-y-4 animate-slide-in',
    scale: 'transform scale-95 animate-scale-in'
  };
  
  return `${baseClass} ${durationClass} ${animationClasses[animation as keyof typeof animationClasses] || ''}`;
};

export const ResponsiveGrid = memo(forwardRef<HTMLDivElement, ResponsiveGridProps>(({
  cols = { default: 1 },
  gap = 4,
  className,
  children,
  autoFit = false,
  minColWidth = '250px',
  maxColWidth = '1fr',
  rowGap,
  colGap,
  stretchItems = false,
  autoRows,
  animation = 'none',
  animationDuration = 200,
  ...props
}, ref) => {
  const { isDark } = useTheme();
  const [isClient, setIsClient] = useState(false);
  
  // Track mouse position for hover effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Generate responsive classes with memoization
  const responsiveClasses = useMemo(() => {
    return autoFit 
      ? `grid w-full auto-fit-columns`
      : `${responsiveGridCols(cols)} w-full`;
  }, [autoFit, cols]);
  
  // Generate gap classes with support for separate row/col gaps
  const gapClasses = useMemo(() => {
    const classes = ['grid'];
    
    if (rowGap) classes.push(gapStyles(rowGap, 'rowGap'));
    if (colGap) classes.push(gapStyles(colGap, 'colGap'));
    if (gap && !rowGap && !colGap) classes.push(gapStyles(gap));
    
    return classes.join(' ');
  }, [gap, rowGap, colGap]);
  
  // Generate grid style object
  const gridStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      ...(autoFit ? {
        gridTemplateColumns: `repeat(auto-fit, minmax(${minColWidth}, ${maxColWidth}))`
      } : {}),
      ...(stretchItems ? { alignItems: 'stretch' } : {}),
      ...(autoRows ? { gridAutoRows: autoRows } : {})
    };
    
    // Add subtle parallax effect on hover
    if (autoFit && mousePosition.x > 0 && mousePosition.y > 0) {
      baseStyle.transform = `perspective(1000px) rotateX(${(mousePosition.y / 1000) * 2}deg) rotateY(${(mousePosition.x / 1000) * 2}deg)`;
      baseStyle.transition = 'transform 0.3s ease-out';
    }
    
    return baseStyle;
  }, [autoFit, minColWidth, maxColWidth, stretchItems, autoRows, mousePosition]);
  
  // Animation classes
  const animationClasses = useMemo(() => {
    return getAnimationClass(animation, animationDuration);
  }, [animation, animationDuration]);
  
  return (
    <div
      ref={ref}
      className={cn(
        responsiveClasses,
        gapClasses,
        // Theme-aware grid styling
        isDark ? 'dark:bg-studio-card dark:border-studio-border' : 'bg-studio-card border-studio-border',
        animationClasses,
        'transition-all duration-200',
        'relative overflow-hidden',
        'hover:shadow-lg hover:shadow-studio-shadow/20',
        className
      )}
      style={gridStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
      {...props}
    >
      {/* Performance optimization: Only render children on client */}
      {isClient ? children : null}
      
      {/* Loading skeleton animation */}
      {!isClient && (
        <div className="absolute inset-0 bg-studio-card/50 animate-pulse rounded-lg" />
      )}
    </div>
  );
}));

ResponsiveGrid.displayName = 'ResponsiveGrid';