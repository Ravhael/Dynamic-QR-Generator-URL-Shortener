/**
 * Mobile Performance Optimization Hook
 * Detects mobile devices and reduces expensive animations/effects
 */

import { useState, useEffect } from 'react'

interface MobileOptimizationOptions {
  reduceMotion?: boolean
  reduceBlur?: boolean
  reduceAnimations?: boolean
}

export function useMobileOptimization(options: MobileOptimizationOptions = {}) {
  const [isMobile, setIsMobile] = useState(false)
  const [isLowPowerMode, setIsLowPowerMode] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      const isSmallScreen = window.innerWidth <= 768
      return isMobileDevice || isSmallScreen
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Check for low power mode (estimate based on performance)
    const checkLowPowerMode = () => {
      // Simple heuristic: if device has low memory or slow connection
      const connection = (navigator as any).connection
      const memory = (navigator as any).deviceMemory
      
      if (connection && connection.effectiveType) {
        return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
      }
      
      if (memory) {
        return memory <= 4 // Less than 4GB RAM
      }
      
      return false
    }

    setIsMobile(checkMobile())
    setIsLowPowerMode(checkLowPowerMode())
    setReducedMotion(prefersReducedMotion)

    // Listen for window resize
    const handleResize = () => {
      setIsMobile(checkMobile())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const shouldReduceAnimations = options.reduceAnimations !== false && (isMobile || isLowPowerMode || reducedMotion)
  const shouldReduceBlur = options.reduceBlur !== false && (isMobile || isLowPowerMode)
  const shouldReduceMotion = options.reduceMotion !== false && (reducedMotion || isLowPowerMode)

  return {
    isMobile,
    isLowPowerMode,
    reducedMotion,
    shouldReduceAnimations,
    shouldReduceBlur,
    shouldReduceMotion,
    // CSS class generators
    getBackdropBlur: (defaultBlur = 'backdrop-blur-xl') => 
      shouldReduceBlur ? 'backdrop-blur-sm' : defaultBlur,
    getTransition: (defaultTransition = 'transition-all duration-500') =>
      shouldReduceAnimations ? 'transition-none' : defaultTransition,
    getAnimation: (defaultAnimation = 'animate-pulse') =>
      shouldReduceMotion ? '' : defaultAnimation,
    getTransform: (defaultTransform = 'transform hover:scale-110') =>
      shouldReduceAnimations ? '' : defaultTransform,
  }
}
