"use client"

import React, { createContext, useContext, type ReactNode } from "react"
import { toast, Toaster } from "sonner"

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
  showWarning: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    switch (type) {
      case "success":
        toast.success(message)
        break
      case "error":
        toast.error(message)
        break
      case "warning":
        toast.warning(message)
        break
      default:
        toast(message)
    }
  }

  const showSuccess = (message: string) => toast.success(message)
  const showError = (message: string) => toast.error(message)
  const showInfo = (message: string) => toast(message)
  const showWarning = (message: string) => toast.warning(message)

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster position="top-right" richColors />
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
