import React from 'react';
import { clsx } from 'clsx';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  actions?: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  className,
  loading = false,
  actions
}) => {
  if (loading) {
    return (
      <div className={clsx(
        "bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-smooth-lg",
        className
      )}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
            {subtitle && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>}
          </div>
          {actions && <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}
        </div>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={clsx(
      "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-smooth-lg transition-all duration-300 hover:shadow-smooth-xl",
      className
    )}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      <div className="min-h-[300px]">
        {children}
      </div>
    </div>
  );
};
