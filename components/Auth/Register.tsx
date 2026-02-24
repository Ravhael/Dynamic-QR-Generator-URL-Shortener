"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { QrCodeIcon, CheckCircleIcon } from "@heroicons/react/24/solid"
export const Register: React.FC = () => {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const benefits = [
    {
      title: "Secure onboarding",
      copy: "SAML-ready auth, audit logs, and password guardrails keep every workspace protected.",
    },
    {
      title: "Unified control",
      copy: "Spin up QR campaigns, short links, and analytics dashboards without juggling tools.",
    },
    {
      title: "Enterprise scale",
      copy: "Provision teams in minutes with templates, role policies, and automated alerts.",
    },
  ]

  const metrics = [
    { value: "4,800+", label: "Teams onboarded" },
    { value: "12ms", label: "Avg. response time" },
  ]


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      // First create the user via dedicated API (no auto-login)
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password })
      })
      const regJson = await regRes.json().catch(() => ({}))
      if (!regRes.ok || !regJson.success) {
        throw new Error(regJson.message || 'Failed to register')
      }
      // Small delay to let user perceive form state change (optional UX polish)
      setTimeout(() => {
        router.push('/login?message=Registration successful. Please sign in.')
      }, 150)
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-10 -right-4 w-80 h-80 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-ping"></div>
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-indigo-700 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] items-stretch">
          {/* Story / benefits panel */}
          <section className="order-2 lg:order-1 bg-white/10 border border-white/15 rounded-[32px] p-6 sm:p-10 text-white backdrop-blur-2xl shadow-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
              Trusted onboarding
            </div>
            <h2 className="mt-6 text-3xl sm:text-4xl font-semibold leading-tight">
              Launch QR & URL operations on an enterprise-grade foundation.
            </h2>
            <p className="mt-4 text-white/80 text-sm sm:text-base">
              Scanly keeps marketing, product, and ops aligned with centralized governance, compliance-ready logging, and effortless collaboration.
            </p>
            <ul className="mt-8 space-y-5">
              {benefits.map(benefit => (
                <li key={benefit.title} className="flex items-start gap-4">
                  <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-slate-900">
                    <CheckCircleIcon className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <p className="text-base font-semibold">{benefit.title}</p>
                    <p className="text-sm text-white/75">{benefit.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-10 grid grid-cols-2 gap-4 text-center text-sm">
              {metrics.map(metric => (
                <div key={metric.label} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  <p className="text-3xl font-semibold">{metric.value}</p>
                  <p className="text-xs text-white/70">{metric.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-xs text-white/60">
              By registering you agree to the Scanly Terms & Privacy Policy.
            </div>
          </section>

          {/* Form panel */}
          <section className="order-1 lg:order-2 bg-white/95 rounded-[32px] shadow-2xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" aria-hidden="true" />
            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-900/5 text-blue-600 shadow-inner">
                  <QrCodeIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-blue-500 uppercase">Create account</p>
                  <h1 className="text-2xl font-bold text-slate-900">Join Scanly</h1>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">Set up your workspace credentials below. You can invite teammates once inside.</p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-slate-900 placeholder-slate-400 shadow-inner focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                    placeholder="Siti Maheswari"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Work email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-slate-900 placeholder-slate-400 shadow-inner focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                    placeholder="you@company.com"
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
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 shadow-inner focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Use at least 8 characters, including a number and symbol.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 shadow-inner focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                      placeholder="Repeat password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                      aria-label={showConfirmPassword ? 'Hide confirmation' : 'Show confirmation'}
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  By clicking "Create Account", you agree to abide by Scanly's Acceptable Use Policy.
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-blue-500/40 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60"
                >
                  {isLoading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 space-y-3 text-center text-sm text-slate-600">
                <p>
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                    Sign in
                  </Link>
                </p>
                <p className="text-xs text-slate-400">© 2025 Scanly by Indovisual. All rights reserved.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
