import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  hint,
  className,
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-200',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'dark:bg-gray-800 dark:text-white dark:placeholder-gray-400',
            'placeholder:text-gray-500 dark:placeholder:text-gray-400',
            error
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
              : 'hover:border-gray-400 dark:hover:border-gray-500',
            LeftIcon ? 'pl-10' : '',
            RightIcon ? 'pr-10' : '',
            className
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <RightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
