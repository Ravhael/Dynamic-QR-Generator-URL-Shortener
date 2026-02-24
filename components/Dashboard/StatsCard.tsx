import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number | undefined;
  change?: number;
  growth?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  subtitle?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  growth,
  changeType,
  icon: Icon,
  color = 'blue',
  subtitle,
  className = ""
}) => {
  // Use growth prop if available, otherwise use change
  const actualChange = growth !== undefined ? growth : change || 0;
  
  // Prevent NaN from appearing if data is not valid yet
  const displayValue = (typeof value === "number" && !isNaN(value))
    ? value.toLocaleString()
    : value ?? 0;

  const displayChange = (!isNaN(actualChange) && isFinite(actualChange)) ? Math.abs(actualChange) : 0;
  
  // Determine change type if not provided
  const actualChangeType = changeType || (actualChange > 0 ? 'positive' : actualChange < 0 ? 'negative' : 'neutral');

  return (
    <div className={clsx(
      "group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 dark:border-slate-700/60 p-5 transition-all duration-200 md:hover:shadow-md md:hover:border-gray-300/60 dark:md:hover:border-slate-600/60 transform md:hover:-translate-y-0.5",
      className
    )}>
      
      {/* Subtle background gradient */}
      <div className={clsx(
        "absolute inset-0 rounded-xl opacity-20 transition-opacity duration-200 group-hover:opacity-30",
        color === 'blue' && "bg-gradient-to-br from-blue-500/10 to-blue-600/10",
        color === 'green' && "bg-gradient-to-br from-green-500/10 to-green-600/10",
        color === 'yellow' && "bg-gradient-to-br from-yellow-500/10 to-yellow-600/10",
        color === 'red' && "bg-gradient-to-br from-red-500/10 to-red-600/10"
      )}></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          <div className={clsx(
            "flex-shrink-0 p-2 rounded-lg transition-colors duration-200",
            color === 'blue' && "bg-blue-100/70 dark:bg-blue-900/30",
            color === 'green' && "bg-green-100/70 dark:bg-green-900/30",
            color === 'yellow' && "bg-yellow-100/70 dark:bg-yellow-900/30",
            color === 'red' && "bg-red-100/70 dark:bg-red-900/30"
          )}>
            <Icon className={clsx(
              "h-5 w-5 transition-colors duration-200",
              color === 'blue' && "text-blue-600 dark:text-blue-400",
              color === 'green' && "text-green-600 dark:text-green-400",
              color === 'yellow' && "text-yellow-600 dark:text-yellow-400",
              color === 'red' && "text-red-600 dark:text-red-400"
            )} />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
            {displayValue}
          </div>
          
          {actualChange !== 0 && (
            <div className={clsx(
              "flex items-center text-xs font-medium px-2 py-1 rounded-full",
              actualChangeType === 'positive' && "text-green-700 dark:text-green-400 bg-green-100/70 dark:bg-green-900/30",
              actualChangeType === 'negative' && "text-red-700 dark:text-red-400 bg-red-100/70 dark:bg-red-900/30",
              actualChangeType === 'neutral' && "text-gray-600 dark:text-gray-400 bg-gray-100/70 dark:bg-gray-800/30"
            )}>
              {actualChangeType === 'positive' && <ArrowUpIcon className="h-3 w-3 mr-1" />}
              {actualChangeType === 'negative' && <ArrowDownIcon className="h-3 w-3 mr-1" />}
              {displayChange}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
