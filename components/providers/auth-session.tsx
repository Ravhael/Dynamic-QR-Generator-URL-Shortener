'use client'

import { SessionProvider } from 'next-auth/react'

export default function AuthSessionProvider({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider 
      // Refresh session every 5 minutes
      refetchInterval={5 * 60}
      // Prevent flickering on first load
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}