"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "../contexts/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "admin" | "editor" | "viewer"
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const [isLoading, setIsLoading] = useState(true)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const pathname = usePathname()

  const ADMIN_ROLE_LABELS = ["admin", "administrator", "superadmin"]
  const ADMIN_MENU_SEGMENTS = new Set([
    "administrator",
    "admin-panel",
    "users",
    "groups",
    "scan-click-activity",
    "user-activity",
    "menu-settings",
    "permissions-roles",
    "system-settings",
    "settings"
  ])

  const isAdminRole = (role?: string) =>
    !!role && ADMIN_ROLE_LABELS.includes(role.toLowerCase())

  const currentSegment = (pathname || "/").split("/")[1] || ""
  const isAdminOnlySegment = ADMIN_MENU_SEGMENTS.has(currentSegment)

  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) {
        return
      }
      setIsLoading(false)
    }

    const timer = setTimeout(checkAuth, 50)
    return () => clearTimeout(timer)
  }, [authLoading])

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access this page.</p>
          <a
            href="/login"
            className="inline-block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  if (requiredRole) {
    const hasRequiredRole = user.role === "admin" || user.role === requiredRole
    if (!hasRequiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don't have the required permissions to access this page.</p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }
  }

  if (isAdminOnlySegment && !isAdminRole(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Admin Only</h1>
          <p className="text-gray-600 mb-6">
            You need an administrator account to access this section.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
