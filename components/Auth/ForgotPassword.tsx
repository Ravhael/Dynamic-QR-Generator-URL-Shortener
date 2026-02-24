"use client"

import React, { useState } from "react"
import Link from "next/link"
import { EnvelopeIcon, ShieldCheckIcon } from "@heroicons/react/24/outline"
import { CheckCircleIcon, QrCodeIcon } from "@heroicons/react/24/solid"

export function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success">("idle")
  const [error, setError] = useState("")

  const reassurance = [
    {
      title: "Adaptive security",
      copy: "Reset links expire within 30 minutes and require device fingerprinting before activation.",
    },
    {
      title: "Full visibility",
      copy: "Every password recovery is logged with geo data so admins can trace anomalies instantly.",
    },
    {
      title: "Policy aligned",
      copy: "Passwords must respect Scanly's complexity policies and 2FA prompts remain enforced.",
    },
  ]

  const stats = [
    { value: "<60s", label: "Avg. reset time" },
    { value: "ISO27001", label: "Security posture" },
  ]

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const details = await response.json().catch(() => ({}))
        throw new Error(details?.message || "Unable to process your request right now.")
      }

      setStatus("success")
    } catch (err: any) {
      console.error("Forgot password error", err)
      setError(err?.message || "Something went wrong. Please try again or contact admin@scanly.indovisual.co.id.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 left-0 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute top-16 right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-ping" />
        <div className="absolute -bottom-24 left-20 w-96 h-96 bg-teal-700 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] items-stretch">
          <section className="order-2 lg:order-1 bg-white/10 border border-white/15 rounded-[32px] p-6 sm:p-10 text-white backdrop-blur-2xl shadow-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
              <span className="h-2 w-2 rounded-full bg-lime-300" aria-hidden="true" />
              Recovery Control Center
            </div>
            <h2 className="mt-6 text-3xl sm:text-4xl font-semibold leading-tight">
              Restore secure access without filing IT tickets.
            </h2>
            <p className="mt-4 text-white/80 text-sm sm:text-base">
              Submit your verified workspace email and we will send a single-use recovery link with contextual alerts for your administrators.
            </p>
            <ul className="mt-8 space-y-5">
              {reassurance.map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
                    <ShieldCheckIcon className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <p className="text-base font-semibold">{item.title}</p>
                    <p className="text-sm text-white/75">{item.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-10 grid grid-cols-2 gap-4 text-center text-sm">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  <p className="text-3xl font-semibold">{stat.value}</p>
                  <p className="text-xs text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-xs text-white/65">
              Need immediate assistance? Email <a className="underline decoration-white/40 decoration-dashed" href="mailto:admin@scanly.indovisual.co.id">admin@scanly.indovisual.co.id</a>.
            </div>
          </section>

          <section className="order-1 lg:order-2 bg-white/95 rounded-[32px] shadow-2xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" aria-hidden="true" />
            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-teal-50 text-emerald-600 shadow-inner">
                  <QrCodeIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-emerald-500 uppercase">Password recovery</p>
                  <h1 className="text-2xl font-bold text-slate-900">Forgot your password?</h1>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">Enter your Scanly workspace email and we&apos;ll send reset steps right away.</p>

              {status === "success" ? (
                <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 px-6 py-8 text-center">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-emerald-500" />
                  <h3 className="mt-4 text-lg font-semibold text-emerald-900">Reset link dispatched</h3>
                  <p className="mt-2 text-sm text-emerald-800">
                    Check your inbox for instructions. The link remains valid for the next 30 minutes.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                      href="/login"
                      className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700"
                    >
                      Go to login
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setStatus("idle")
                        setEmail("")
                      }}
                      className="rounded-2xl border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-white"
                    >
                      Send again
                    </button>
                  </div>
                </div>
              ) : (
                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Work email
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 pl-12 text-slate-900 placeholder-slate-400 shadow-inner focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition"
                        placeholder="name@company.com"
                      />
                      <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500">Only verified workspace addresses can receive reset links.</p>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="assertive">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:shadow-emerald-500/40 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-60"
                  >
                    {isLoading ? "Sending instructions…" : "Send reset link"}
                  </button>

                  <div className="text-center text-sm text-slate-600">
                    <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
                      Return to login
                    </Link>
                  </div>
                </form>
              )}

              <div className="mt-6 space-y-1 text-xs text-slate-400">
                <p>Reset attempts are limited for security. Need help? admin@scanly.indovisual.co.id</p>
                <p>© 2025 Scanly by Indovisual. All rights reserved.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
