import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastComponentProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

// shadcn/ui compatible ToastProps
export interface ToastProps extends Record<string, any> {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'default' | 'destructive';
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast, onRemove }) => {
  const { id, type, title, message, duration = 5000 } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [id, duration, onRemove]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-600/50';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-red-200 dark:border-red-600/50';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-600/50';
      case 'info':
        return 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200 dark:border-blue-600/50';
      default:
        return 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200 dark:border-blue-600/50';
    }
  };

  return (
    <div className={`rounded-xl border p-4 shadow-2xl backdrop-blur-xl ${getBgColor()} transition-all duration-500 ease-in-out max-w-sm w-full transform hover:scale-105 animate-in slide-in-from-right-full duration-300`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 animate-pulse">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {message && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {message}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            className="inline-flex rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
            onClick={() => onRemove(id)}
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastComponent;

// For compatibility with shadcn/ui toaster
export const Toast = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg">
    {children}
  </div>
);
export const ToastClose = ({ onClick }: { onClick?: () => void }) => (
  <button onClick={onClick} className="text-gray-500 hover:text-gray-700">×</button>
);
export const ToastDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm text-gray-600 dark:text-gray-300">{children}</div>
);
export const ToastProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const ToastTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="font-semibold dark:text-white">{children}</div>
);
export const ToastViewport = ({ children }: { children?: React.ReactNode }) => (
  <div className="fixed top-4 right-4 z-50">{children}</div>
);

export type ToastActionElement = React.ReactElement;
