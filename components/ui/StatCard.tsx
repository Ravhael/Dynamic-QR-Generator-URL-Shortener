import React from 'react';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeText?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  loading?: boolean;
}

const colorVariants = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30',
    icon: 'text-blue-600 dark:text-blue-400',
    accent: 'border-blue-200 dark:border-blue-700',
    change: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/30',
    icon: 'text-green-600 dark:text-green-400',
    accent: 'border-green-200 dark:border-green-700',
    change: 'text-green-600 dark:text-green-400'
  },
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/30',
    icon: 'text-yellow-600 dark:text-yellow-400',
    accent: 'border-yellow-200 dark:border-yellow-700',
    change: 'text-yellow-600 dark:text-yellow-400'
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-800/30',
    icon: 'text-red-600 dark:text-red-400',
    accent: 'border-red-200 dark:border-red-700',
    change: 'text-red-600 dark:text-red-400'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-800/30',
    icon: 'text-purple-600 dark:text-purple-400',
    accent: 'border-purple-200 dark:border-purple-700',
    change: 'text-purple-600 dark:text-purple-400'
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/20 dark:to-blue-800/30',
    icon: 'text-indigo-600 dark:text-indigo-400',
    accent: 'border-indigo-200 dark:border-indigo-700',
    change: 'text-indigo-600 dark:text-indigo-400'
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeText,
  icon: Icon,
  color = 'blue',
  loading = false
}) => {
  const colors = colorVariants[color];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-smooth-lg animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      "rounded-xl border p-6 shadow-smooth-lg backdrop-blur-sm transition-all duration-300 hover:shadow-smooth-xl hover:-translate-y-1 group",
      colors.bg,
      colors.accent
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {(change !== undefined || changeText) && (
            <div className="flex items-center text-sm">
              {change !== undefined && (
                <span className={clsx(
                  "font-medium",
                  change >= 0 ? colors.change : "text-red-600 dark:text-red-400"
                )}>
                  {change >= 0 ? '+' : ''}{change}%
                </span>
              )}
              {changeText && (
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  {changeText}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={clsx(
          "p-3 rounded-xl transition-transform duration-200 group-hover:scale-110",
          colors.bg
        )}>
          <Icon className={clsx("h-6 w-6", colors.icon)} />
        </div>
      </div>
    </div>
  );
};
