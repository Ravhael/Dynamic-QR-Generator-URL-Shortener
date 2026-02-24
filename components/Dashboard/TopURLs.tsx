import { EyeIcon, LinkIcon } from "@heroicons/react/24/outline"

import React from 'react';
// import { EyeIcon, LinkIcon } - unused import from '@heroicons/react/24/outline';

interface TopURL {
  id: string;
  title: string;
  shortUrl: string;
  originalUrl: string;
  clicks: number;
}

interface TopURLsProps {
  topURLs: TopURL[];
  totalClicks: number;
}

export const TopURLs: React.FC<TopURLsProps> = ({ topURLs = [], totalClicks = 0 }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-xl h-full">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <LinkIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Performing URLs
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Most clicked links
          </p>
        </div>
      </div>

      {/* URL List */}
      <div className="space-y-4">
        {topURLs.slice(0, 5).map((url, index) => {
          const percentage = totalClicks > 0 ? (url.clicks / totalClicks) * 100 : 0;
          const rankColors = [
            'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg', // Gold
            'bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-lg',    // Silver
            'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg', // Bronze
            'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/50 dark:to-blue-800/50 dark:text-blue-300',
            'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900/50 dark:to-purple-800/50 dark:text-purple-300'
          ];

          return (
            <div 
              key={url.id} 
              className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                {/* Rank Badge */}
                <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full text-sm font-bold transition-all duration-300 group-hover:scale-110 ${rankColors[index] || rankColors[4]}`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </div>

                {/* URL Info */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {url.title || 'Untitled URL'}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-48">
                      {url.shortUrl || url.originalUrl}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 mt-2">
                    <EyeIcon className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {url.clicks.toLocaleString()} clicks
                    </span>
                  </div>
                </div>
              </div>

              {/* Percentage & Progress */}
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {percentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  of total
                </div>
                {/* Progress Bar */}
                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {topURLs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <LinkIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No URLs created yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Create your first short URL to see performance data and analytics here.
            </p>
            <div className="mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                💡 Tip: URLs with more clicks will appear at the top
              </p>
            </div>
          </div>
        )}

        {/* Show more indicator if there are more URLs */}
        {topURLs.length > 5 && (
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing top 5 of {topURLs.length} URLs
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
