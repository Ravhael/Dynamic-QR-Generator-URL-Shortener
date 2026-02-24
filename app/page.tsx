"use client"

import { useEffect } from "react"

export default function HomePage() {
  // LANGSUNG REDIRECT KE LOGIN - SIMPLE!
  useEffect(() => {
    console.warn("[HOME] Redirecting to login...")
    window.location.replace('/login')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  )
}
