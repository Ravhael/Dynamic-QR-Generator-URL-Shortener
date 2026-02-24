"use client"

import React, { useMemo, useCallback, useRef, useEffect } from 'react'

// Performance optimization utilities for React components
export interface PerformanceMetrics {
  renderCount: number
  lastRenderTime: number
  averageRenderTime: number
  memoryUsage: number
}

// Hook to measure component render performance
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0)
  const renderTimes = useRef<number[]>([])
  const startTime = useRef<number>(0)

  useEffect(() => {
    startTime.current = performance.now()
    renderCount.current++

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime.current
      renderTimes.current.push(renderTime)

      // Keep only last 10 render times for average calculation
      if (renderTimes.current.length > 10) {
        renderTimes.current = renderTimes.current.slice(-10)
      }

      if (process.env.NODE_ENV === 'development') {
        const averageTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
        
        if (renderTime > 16) { // Warn if render takes longer than 1 frame (60fps)
          console.warn(
            `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms ` +
            `(avg: ${averageTime.toFixed(2)}ms, renders: ${renderCount.current})`
          )
        }
      }
    }
  })

  const getMetrics = useCallback((): PerformanceMetrics => {
    const averageTime = renderTimes.current.length > 0
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      : 0

    return {
      renderCount: renderCount.current,
      lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0,
      averageRenderTime: averageTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
    }
  }, [])

  return getMetrics
}

// Memoized component wrapper with performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) {
  const MemoizedComponent = React.memo(Component)
  const componentName = displayName || Component.displayName || Component.name || 'UnknownComponent'

  const PerformanceMonitoredComponent: React.FC<P> = (_props: P) => {
    const getMetrics = useRenderPerformance(componentName)

    // Log performance metrics in development
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        const metrics = getMetrics()
        if (metrics.renderCount % 10 === 0) { // Log every 10 renders
          console.warn(`[Performance Metrics] ${componentName}:`, metrics)
        }
      }
    })

    return React.createElement(MemoizedComponent, _props)
  }

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${componentName})`
  
  return PerformanceMonitoredComponent
}

// Deep comparison for complex objects in React.memo
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false

  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
        return false
      }
    }
    return true
  }

  return false
}

// Optimized memo wrapper for complex props
export function memoDeep<P extends object>(Component: React.ComponentType<P>) {
  return React.memo(Component, deepEqual)
}

// Hook for debouncing expensive operations
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook for throttling operations
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value)
  const lastRan = useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

// Hook for lazy loading components
export function useLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const [Component, setComponent] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [_error, setError] = React.useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    importFunc()
      .then((module) => {
        if (mounted) {
          setComponent(() => module.default)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err)
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [importFunc])

  if (loading && fallback) {
    return { Component: fallback, loading, error: _error }
  }

  return { Component, loading, error: _error }
}

// Memory usage monitor hook
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = React.useState({
    used: 0,
    total: 0,
    limit: 0,
  })

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory
        setMemoryInfo({
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        })
      }
    }

    // Update immediately and then every 5 seconds
    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000)

    return () => clearInterval(interval)
  }, [])

  return memoryInfo
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false)
  const [hasIntersected, setHasIntersected] = React.useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
      if (entry.isIntersecting) {
        setHasIntersected(true)
      }
    }, options)

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return { isIntersecting, hasIntersected }
}

// Performance optimization constants
export const PERFORMANCE_CONFIG = {
  LARGE_DATASET_THRESHOLD: 1000,
  VIRTUAL_SCROLL_THRESHOLD: 50,
  DEBOUNCE_DELAY: 300,
  THROTTLE_LIMIT: 100,
  RENDER_WARNING_THRESHOLD: 16, // ms
  MEMORY_WARNING_THRESHOLD: 50, // MB
} as const

const usePerformanceService = {
  useRenderPerformance,
  withPerformanceMonitoring,
  deepEqual,
  memoDeep,
  useDebounce,
  useThrottle,
  useLazyComponent,
  useMemoryMonitor,
  useIntersectionObserver,
  PERFORMANCE_CONFIG,
}

export default usePerformanceService