"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useSession, signIn, signOut } from "next-auth/react"

export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  is_active?: boolean
  group_id?: number
  lastLogin?: string
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>

  // Authorization helpers
  checkPermission: (params: {
    resourceType: 'qr_codes' | 'urls' | 'users' | 'groups' | 'analytics' | 'system';
    permissionType: 'create' | 'read' | 'update' | 'delete' | 'manage';
  }) => Promise<boolean>
  getUserRole: () => string | null
  // Legacy/compat helpers expected by some components
  isAdmin: () => boolean
  isEditor: () => boolean
  isViewer: () => boolean
  canAccessUserManagement: () => boolean
  canCreateResources: () => boolean
  canModifyResource: (resourceOwnerId: string) => boolean
  canViewResource: (resourceOwnerId: string, resourceGroupId?: number) => boolean
  getUserGroupId: () => number | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const isLoading = status === "loading"

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role || "USER",
        is_active: session.user.is_active,
        group_id: session.user.groupId,
      })
    } else {
      setUser(null)
    }
  }, [session])

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        return { success: false, message: result.error }
      }

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    try {
      // Best-effort server-side cookie purge
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      // Local state reset immediately to avoid flash of protected content
      setUser(null)
      // Use signOut without redirect handling then force a hard navigation (prevents cache issues)
      await signOut({ redirect: false })
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  const refreshAuth = async () => {
    // No need to implement this with NextAuth as it handles token refresh automatically
  }

  // Authorization helpers
  const isAdmin = () => user?.role === "ADMIN"
  const isEditor = () => user?.role === "EDITOR" || isAdmin()
  const isViewer = () => user?.role === "USER" || isEditor()

  const canAccessUserManagement = () => isAdmin()
  const canCreateResources = () => isEditor() || isAdmin()

  const canModifyResource = (resourceOwnerId: string) => {
    if (isAdmin()) return true
    if (isEditor() && user?.id === resourceOwnerId) return true
    return false
  }

  const canViewResource = (resourceOwnerId: string, resourceGroupId?: number) => {
    if (isAdmin() || isEditor()) return true
    if (user?.id === resourceOwnerId) return true
    if (resourceGroupId && user?.group_id === resourceGroupId) return true
    return false
  }

  const getUserRole = () => user?.role || null
  const getUserGroupId = () => user?.group_id || null

  // Implement checkPermission according to your app's logic
  const checkPermission = async (params: {
    resourceType: 'qr_codes' | 'urls' | 'users' | 'groups' | 'analytics' | 'system';
    permissionType: 'create' | 'read' | 'update' | 'delete' | 'manage';
  }): Promise<boolean> => {
    // Example logic: only admins can 'manage', editors can 'create', 'read', 'update', 'delete', viewers can 'read'
    const role = user?.role;
    if (!role) return false;
    if (params.permissionType === 'manage') return role === 'ADMIN';
    if (['create', 'update', 'delete'].includes(params.permissionType)) return role === 'ADMIN' || role === 'EDITOR';
    if (params.permissionType === 'read') return !!role;
    return false;
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshAuth,
    isAdmin,
    isEditor,
    isViewer,
    canAccessUserManagement,
    canCreateResources,
    canModifyResource,
    canViewResource,
    getUserRole,
    getUserGroupId,
    checkPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}