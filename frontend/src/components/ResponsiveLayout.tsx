import React, { ReactNode } from 'react'
import { cn } from '../utils/cn'

interface ResponsiveLayoutProps {
  children: ReactNode
  className?: string
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  spacing = 'md'
}) => {
  const spacingClasses = {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  return (
    <div className={cn('w-full', spacingClasses[spacing], className)}>
      {children}
    </div>
  )
}

interface GridContainerProps {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const GridContainer: React.FC<GridContainerProps> = ({
  children,
  cols = 1,
  gap = 'md',
  className
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-12'
  }

  const gapClasses = {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  return (
    <div className={cn(
      'grid w-full',
      gridClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

interface FlexContainerProps {
  children: ReactNode
  direction?: 'row' | 'col'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  wrap?: boolean
  className?: string
}

export const FlexContainer: React.FC<FlexContainerProps> = ({
  children,
  direction = 'row',
  align = 'start',
  justify = 'start',
  gap = 'md',
  wrap = false,
  className
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const gapClasses = {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  return (
    <div className={cn(
      'flex',
      directionClasses[direction],
      alignClasses[align],
      justifyClasses[justify],
      gapClasses[gap],
      wrap ? 'flex-wrap' : '',
      className
    )}>
      {children}
    </div>
  )
}

interface StackContainerProps {
  children: ReactNode
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  className?: string
}

export const StackContainer: React.FC<StackContainerProps> = ({
  children,
  spacing = 'md',
  align = 'start',
  className
}) => {
  const spacingClasses = {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  return (
    <div className={cn(
      'flex flex-col',
      spacingClasses[spacing],
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  )
}

// Responsive component that adapts to screen size
interface ResponsiveComponentProps {
  mobile: ReactNode
  tablet?: ReactNode
  desktop?: ReactNode
  className?: string
}

export const ResponsiveComponent: React.FC<ResponsiveComponentProps> = ({
  mobile,
  tablet,
  desktop,
  className
}) => {
  return (
    <div className={cn('block', className)}>
      {/* Mobile (default) */}
      {mobile}
      
      {/* Tablet and above */}
      {tablet && (
        <div className="hidden md:block">
          {tablet}
        </div>
      )}
      
      {/* Desktop and above */}
      {desktop && (
        <div className="hidden lg:block">
          {desktop}
        </div>
      )}
    </div>
  )
}

// Container with max-width for different screen sizes
interface ContainerProps {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  className
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  }

  return (
    <div className={cn('w-full px-4', sizeClasses[size], className)}>
      {children}
    </div>
  )
}