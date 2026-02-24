"use client"

import React, { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import PermissionAwareSidebar from "./PermissionAwareSidebar"
import { clsx } from "clsx"
import { useMenuPermissions } from "../../hooks/useMenuPermissions"
import { Header } from "./Header"

interface LayoutProps {
  usePermissionAwareSidebar?: boolean // kept for backward-compat - ignored; layout always uses PermissionAwareSidebar
  children?: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { checkMenuAccess } = useMenuPermissions()

  const getActiveTab = () => {
    const path = pathname.substring(1)
    return path || "dashboard"
  }

  // Ensure mobile overlay never lingers after navigation
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close the mobile drawer automatically when the viewport becomes desktop-sized
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)")
    const closeOnDesktop = (matches: boolean) => {
      if (matches) {
        setIsMobileMenuOpen(false)
      }
    }
    const handleChange = (event: MediaQueryListEvent) => closeOnDesktop(event.matches)

    closeOnDesktop(mediaQuery.matches)
    mediaQuery.addEventListener?.("change", handleChange)
    mediaQuery.addListener?.(handleChange)

    return () => {
      mediaQuery.removeEventListener?.("change", handleChange)
      mediaQuery.removeListener?.(handleChange)
    }
  }, [])

  const handleTabChange = (tab: string) => {
    const newPath = `/${tab === "dashboard" ? "" : tab}`

    // Check if user can access the path
    if (checkMenuAccess(tab)) {
      router.push(newPath)
    } else {
      // Redirect to dashboard if access denied
      router.push("/dashboard")
    }
  }

  // Toggle sidebar collapse
  const handleToggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex">
      {/* Always render the canonical PermissionAwareSidebar */}
      <PermissionAwareSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activeTab={getActiveTab()}
        onTabChange={handleTabChange}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div
        className={clsx(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          isCollapsed ? "lg:ml-16" : "lg:ml-64",
        )}
      >
        <Header 
          isMobileMenuOpen={isMobileMenuOpen} 
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        <div className="h-16" aria-hidden="true" />
        <main className="flex-1 p-3 sm:p-4 md:p-4 lg:p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

// Enhanced Layout with Permission Control
export const PermissionControlledLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <Layout usePermissionAwareSidebar={true}>{children}</Layout>
}
