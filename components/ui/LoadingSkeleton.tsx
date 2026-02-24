import React from 'react';
import { clsx } from 'clsx';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'chart';
  lines?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = 'text',
  lines = 1
}) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700";

  switch (variant) {
    case 'card':
      return (
        <div className={clsx(
          "bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-smooth-lg",
          className
        )}>
          <div className="space-y-4">
            <div className={clsx(baseClasses, "h-4 rounded w-3/4")}></div>
            <div className={clsx(baseClasses, "h-8 rounded w-1/2")}></div>
            <div className={clsx(baseClasses, "h-32 rounded")}></div>
          </div>
        </div>
      );
    
    case 'circle':
      return (
        <div className={clsx(baseClasses, "rounded-full w-10 h-10", className)}></div>
      );
    
    case 'chart':
      return (
        <div className={clsx("space-y-4", className)}>
          <div className={clsx(baseClasses, "h-6 rounded w-1/3")}></div>
          <div className={clsx(baseClasses, "h-64 rounded")}></div>
        </div>
      );
    
    case 'text':
    default:
      return (
        <div className={clsx("space-y-2", className)}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={`item-${index}`}
              className={clsx(
                baseClasses,
                "h-4 rounded",
                index === lines - 1 ? "w-2/3" : "w-full"
              )}
            ></div>
          ))}
        </div>
      );
  }
};
