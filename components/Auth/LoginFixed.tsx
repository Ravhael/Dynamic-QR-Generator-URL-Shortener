'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { QrCodeIcon } from '@heroicons/react/24/solid'
import { useToast } from '@/components/contexts/ToastContext'

export function LoginFixed() {
  const router = useRouter()
  const { showSuccess } = useToast()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const featureHighlights = [
    {
      title: 'Real-time Analytics',
      description: 'Monitor scans, clicks, and usage from a single dashboard.'
    },
    {
      title: 'Role-based Security',
      description: 'Fine-grained controls keep your data safe and compliant.'
    },
    {
      title: 'Unified QR & URL Tools',
      description: 'Generate, categorize, and audit assets without switching tabs.'
    }
  ]

  // Show toast if redirected with a message param
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const msg = params.get('message')
      if (msg) {
        showSuccess(msg)
        // Optional: clean URL
        const url = new URL(window.location.href)
        url.searchParams.delete('message')
        window.history.replaceState({}, '', url.toString())
      }
    } catch {}
  }, [showSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Will redirect to /dashboard on success
      await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        callbackUrl: '/dashboard',
        redirect: true
      })

      // Code after this point won't execute if redirect is true
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-800 via-rose-800 to-pink-900 flex items-center justify-center py-10 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -top-10 right-0 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-ping"></div>
        <div className="absolute -bottom-16 left-12 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[1.05fr_0.95fr] items-stretch">
          {/* Narrative / highlight panel */}
          <section className="order-2 lg:order-1 bg-white/10 border border-white/20 rounded-[32px] text-white p-6 sm:p-10 backdrop-blur-2xl shadow-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/15 text-xs uppercase tracking-[0.2em] font-semibold text-white/80">
              <span className="h-2 w-2 rounded-full bg-lime-300" aria-hidden="true" />
              Secure Access
            </div>
            <h2 className="mt-6 text-3xl sm:text-4xl font-semibold leading-tight">
              Control your QR&nbsp;&amp;&nbsp;URL infrastructure with confidence.
            </h2>
            <p className="mt-4 text-base text-white/80">
              Manage dynamic QR codes, short links, and live analytics inside one professional workspace designed for marketing and ops teams.
            </p>
            <ul className="mt-8 space-y-5">
              {featureHighlights.map(feature => (
                <li key={feature.title} className="flex items-start gap-4">
                  <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-sm font-semibold text-white">
                    <QrCodeIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-base font-semibold">{feature.title}</p>
                    <p className="text-sm text-white/75">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-10 grid grid-cols-2 gap-4 text-center text-sm">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-3xl font-semibold">5K+</p>
                <p className="text-xs text-white/70">Active QR assets</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-3xl font-semibold">99.9%</p>
                <p className="text-xs text-white/70">Uptime guarantee</p>
              </div>
            </div>
          </section>

          {/* Form panel */}
          <section className="order-1 lg:order-2 bg-white/95 rounded-[32px] shadow-2xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300" aria-hidden="true" />
            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 shadow-inner">
                  <QrCodeIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-rose-500 uppercase">Scanly Portal</p>
                  <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">Sign in to continue orchestrating QR codes, URLs, and analytics.</p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-slate-900 placeholder-slate-400 shadow-inner focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100 transition"
                    placeholder="name@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 shadow-inner focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100 transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-600">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400"
                    />
                    Keep me signed in
                  </label>
                  <Link href="/forgot-password" className="font-medium text-rose-500 hover:text-rose-600">
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-orange-400 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:shadow-rose-500/40 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:opacity-60"
                >
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="text-center">
                  Need support?{' '}
                  <a href="mailto:admin@scanly.indovisual.co.id" className="font-semibold text-rose-500 hover:text-rose-600">
                    admin@scanly.indovisual.co.id
                  </a>
                </div>
                <div className="text-center">
                  Don't have an account?{' '}
                  <Link href="/register" className="font-semibold text-rose-500 hover:text-rose-600">
                    Create Account
                  </Link>
                </div>
                <div className="text-center text-xs text-slate-400">
                  © 2025 Scanly by Indovisual. All rights reserved.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}