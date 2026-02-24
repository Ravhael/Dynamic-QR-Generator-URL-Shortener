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
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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
        role: (session.user.role || 'user').toUpperCase(),
        is_active: (session.user as any).is_active,
        group_id: (session.user as any).groupId,
      })
    } else {
      setUser(null)
    }
  }, [session])

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) return { success: false, message: result.error }
      return { success: true }
    } catch (_error) {
      return { success: false, message: 'Unexpected error' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      setUser(null)
      await signOut({ redirect: false })
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
