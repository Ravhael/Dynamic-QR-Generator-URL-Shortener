'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface LayoutWrapperProps {
  children: ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  
  // Halaman yang tidak perlu padding (full-screen pages)
  const fullScreenPages = ['/login', '/register', '/auth']
  
  // Check if current page should be full screen
  const isFullScreen = fullScreenPages.some(page => pathname.startsWith(page))
  
  if (isFullScreen) {
    return <>{children}</>
  }
  
  // Return with padding for dashboard and other pages
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {children}
    </div>
  )
}