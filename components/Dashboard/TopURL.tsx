import { ArrowTrendingUpIcon, EyeIcon, LinkIcon, SparklesIcon, TrophyIcon } from "@heroicons/react/24/outline"

import React from 'react';
// import { EyeIcon, ArrowTrendingUpIcon, LinkIcon, TrophyIcon, SparklesIcon } - unused import from '@heroicons/react/24/outline';

interface TopURLProps {
  topURL: Array<{ id: string; title: string; shortCode?: string; originalUrl: string; clicks: number }> | undefined;
  totalClick: number | undefined;
}

export const TopURL: React.FC<TopURLProps> = ({
  topURL = [],
  totalClick = 0,
}) => {
  const rankColors = [
    { bg: 'bg-gradient-to-br from-yellow-400 to-orange-500', text: 'text-white', shadow: 'shadow-yellow-500/30' },
    { bg: 'bg-gradient-to-br from-gray-400 to-gray-600', text: 'text-white', shadow: 'shadow-gray-500/30' },
    { bg: 'bg-gradient-to-br from-amber-600 to-orange-700', text: 'text-white', shadow: 'shadow-amber-500/30' },
    { bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', text: 'text-white', shadow: 'shadow-blue-500/30' },
    { bg: 'bg-gradient-to-br from-green-500 to-emerald-600', text: 'text-white', shadow: 'shadow-green-500/30' },
  ];

  return (
    <div className="relative bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-purple-900/10 dark:to-indigo-900/20 rounded-2xl shadow-xl border border-purple-200/50 dark:border-purple-800/30 p-6 backdrop-blur-sm overflow-hidden h-[500px] flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 dark:from-purple-400/5 dark:to-indigo-400/5 rounded-2xl"></div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <TrophyIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-800 dark:from-white dark:via-purple-200 dark:to-indigo-200 bg-clip-text text-transparent">
              Top Performing URLs
            </h3>
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <SparklesIcon className="h-3 w-3" />
              <span>Most clicked links</span>
            </div>
          </div>
        </div>
        <ArrowTrendingUpIcon className="h-5 w-5 text-purple-500" />
      </div>

      {/* URLs List */}
      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-none space-y-4 min-h-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {topURL.slice(0, 5).map((url, index) => {
          const percentage = totalClick > 0 ? (url.clicks / totalClick) * 100 : 0;
          const colorScheme = rankColors[index] || rankColors[3];
          
          return (
            <div
              key={url.id}
              className="group relative bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/50 hover:bg-white/90 dark:hover:bg-gray-700/90 hover:scale-[1.02] transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Rank Badge */}
                  <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${colorScheme.bg} ${colorScheme.text} font-bold text-sm shadow-lg ${colorScheme.shadow}`}>
                    {index === 0 ? '👑' : index + 1}
                  </div>
                  
                  {/* URL Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {url.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      {url.originalUrl}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <EyeIcon className="h-3 w-3" />
                      <span className="font-medium">{url.clicks.toLocaleString()} clicks</span>
                      <span className="text-purple-500 dark:text-purple-400">•</span>
                      <span>{percentage.toFixed(1)}% of total</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-right">
                    <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {topURL.length === 0 && (
          <div className="text-center py-12">
            <div className="relative">
              <LinkIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-6 h-6 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full opacity-20 animate-ping"></div>
            </div>
            <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No URLs yet</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create your first short URL to see performance data</p>
          </div>
        )}
      </div>
    </div>
  );
};
