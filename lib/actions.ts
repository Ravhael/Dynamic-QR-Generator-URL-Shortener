"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Server action: sign in using internal Next.js API (no Supabase)
export async function signIn(_prevState: unknown, formData: FormData) {
  try {
    if (!formData) {
      return { _error: "Form data is missing" }
    }

    const email = formData.get("email")?.toString().trim()
    const password = formData.get("password")?.toString()

    if (!email || !password) {
      return { _error: "Email and password are required" }
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Server Actions run on the server, relative URLs work but explicit base aids some hosts
      body: JSON.stringify({ email, password }),
      cache: 'no-store'
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { _error: (data as any).error || `Login failed (${res.status})` }
    }

    const data = await res.json()
    const token = data.token as string | undefined

    // Persist token to cookies for middleware compatibility
    if (token) {
      const cookieStore = await cookies()
      const opts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      }
      cookieStore.set('scanly_auth', token, opts)
      cookieStore.set('token', token, opts)
      cookieStore.set('auth_token', token, opts)
    }

    return { success: true, user: data.user }
  } catch (_error) {
    console.error("Login _error:", _error)
    return { _error: "An unexpected error occurred. Please try again." }
  }
}

// Server action: optional sign up handler (no-op or route to API if available)
export async function signUp(_prevState: unknown, formData: FormData) {
  try {
    if (!formData) {
      return { _error: "Form data is missing" }
    }
    const email = formData.get("email")?.toString().trim()
    const password = formData.get("password")?.toString()
    if (!email || !password) {
      return { _error: "Email and password are required" }
    }

    // If a registration endpoint exists, call it here. Otherwise, return a friendly message.
    return { _error: "Registration is currently disabled. Please contact an administrator." }
  } catch (_error) {
    console.error("Sign up _error:", _error)
    return { _error: "An unexpected error occurred. Please try again." }
  }
}

// Server action: sign out using internal API and clear cookies
export async function signOut() {
  try {
    // Fire-and-forget API log out (will clear cookies in response too)
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/auth/logout`, {
      method: 'POST',
      cache: 'no-store'
    }).catch(() => {})

  const cookieStore = await cookies()
    const expired = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', expires: new Date(0) }
    cookieStore.set('scanly_auth', '', expired)
    cookieStore.set('token', '', expired)
    cookieStore.set('auth_token', '', expired)

    redirect("/login")
  } catch (_error) {
    console.error('Logout _error:', _error)
    redirect("/login")
  }
}
