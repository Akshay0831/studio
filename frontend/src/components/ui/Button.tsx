import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
}

const variants = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
  ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
  link: 'text-blue-600 hover:text-blue-800 hover:underline focus:ring-blue-500'
};

const sizes = {
  default: 'h-10 px-4 py-2 text-sm font-medium',
  sm: 'h-9 px-3 text-xs font-medium',
  lg: 'h-11 px-8 text-base font-medium',
  icon: 'h-10 w-10'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  const isDisabled = disabled || loading;
  
  return (
    <button
      className={`
        ${variants[variant]}
        ${sizes[size]}
        inline-flex items-center justify-center rounded-md font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;