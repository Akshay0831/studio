import React, { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../core/ThemeContext';

export interface ThemedCheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
}

export const ThemedCheckbox = forwardRef<HTMLInputElement, ThemedCheckboxProps>(({ 
  checked = false, 
  onCheckedChange, 
  disabled = false, 
  className, 
  id,
  label,
  ...props 
}, ref) => {
  const { isDark } = useTheme();
  
  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        id={id}
        className={cn(
          'h-4 w-4 rounded border-gray-300 text-accent focus:ring-2 focus:ring-accent focus:ring-offset-2',
          'bg-card border-border',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-studio-text cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
});

ThemedCheckbox.displayName = 'ThemedCheckbox';