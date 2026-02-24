"use client"

import type React from "react"
import { redirect } from "next/navigation"
import { useMenuPermissions } from "../../hooks/useMenuPermissions"

interface MenuPermissionRouteGuardProps {
  children: React.ReactNode
  requiredPath?: string
  requiredMenuId?: string
  fallbackPath?: string
}

// Renamed to avoid name collision with the general auth ProtectedRoute
export const MenuPermissionRouteGuard: React.FC<MenuPermissionRouteGuardProps> = ({
  children,
  requiredPath,
  requiredMenuId,
  fallbackPath = "/dashboard",
}) => {
  const { canAccessPath, checkMenuAccess } = useMenuPermissions()

  if (requiredPath && !canAccessPath(requiredPath)) {
    redirect(fallbackPath)
    return null
  }

  if (requiredMenuId && !checkMenuAccess(requiredMenuId)) {
    redirect(fallbackPath)
    return null
  }

  return <>{children}</>
}

interface MenuGuardProps {
  children: React.ReactNode
  menuId: string
  fallback?: React.ReactNode
  showRestrictionMessage?: boolean
}

export const MenuGuard: React.FC<MenuGuardProps> = ({
  children,
  menuId,
  fallback = null,
  showRestrictionMessage = false,
}) => {
  const { checkMenuAccess, userRole } = useMenuPermissions()

  if (!checkMenuAccess(menuId)) {
    if (showRestrictionMessage) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Akses Terbatas</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Anda tidak memiliki akses ke menu ini. Role Anda ({userRole || 'unknown'}) tidak memiliki permission yang
                  diperlukan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface ConditionalMenuProps {
  children: React.ReactNode
  menuId: string
  hideIfRestricted?: boolean
}

export const ConditionalMenu: React.FC<ConditionalMenuProps> = ({ children, menuId, hideIfRestricted = true }) => {
  const { checkMenuAccess } = useMenuPermissions()

  if (hideIfRestricted && !checkMenuAccess(menuId)) {
    return null
  }

  return <>{children}</>
}
