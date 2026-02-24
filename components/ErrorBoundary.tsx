"use client"

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: () => void
  level?: 'page' | 'component' | 'global'
}

interface State {
  hasError: boolean
  _error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    _error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(_error: Error): State {
    return {
      hasError: true,
      _error,
      errorInfo: null,
    }
  }

  public override componentDidCatch(_error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', _error)
      console.error('Error info:', errorInfo)
    }

    // Call custom error handler if provided
    this.props.onError?.()

    this.setState({
      _error,
      errorInfo,
    })

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Here you would log to your error tracking service
      // Example: Sentry.captureException(_error, { extra: errorInfo })
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      _error: null,
      errorInfo: null,
    })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public override render() {
    if (this.state.hasError) {
      // Return custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI based on level
      const { level = 'component' } = this.props
      
      if (level === 'global') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
                Something went wrong
              </h1>
              
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                The application encountered an unexpected error. Please try refreshing the page.
              </p>

              {process.env.NODE_ENV === 'development' && this.state._error && (
                <details className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                    {this.state._error.message}
                    {this.state._error.stack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        )
      }

      if (level === 'page') {
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Page Error
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This page encountered an error and couldn't load properly.
              </p>
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )
      }

      // Component level error
      return (
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Component Error
            </span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            This component failed to render
          </p>
          {process.env.NODE_ENV === 'development' && (
            <Button 
              onClick={this.handleRetry} 
              size="sm" 
              variant="outline" 
              className="mt-2"
            >
              Retry
            </Button>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (_props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {..._props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// React Query Error Boundary
export function QueryErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      level="component"
      fallback={
        <div className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Failed to load data
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
