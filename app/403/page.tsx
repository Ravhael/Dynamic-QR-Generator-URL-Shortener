"use client"

import Link from "next/link"
import { ShieldCheckIcon, LockClosedIcon, ArrowPathIcon } from "@heroicons/react/24/outline"
import { ExclamationCircleIcon } from "@heroicons/react/24/solid"

export default function ForbiddenPage() {
  const nextSteps = [
    {
      title: "Switch workspace role",
      detail: "Ask your administrator to grant the appropriate menu permission.",
    },
    {
      title: "Review access policies",
      detail: "Visit the permission matrix to understand which roles unlock this area.",
    },
    {
      title: "Contact Scanly support",
      detail: "We can help audit the request and fast-track approvals when needed.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-12 left-6 w-72 h-72 bg-emerald-600 rounded-full opacity-30 blur-3xl" />
        <div className="absolute top-16 right-8 w-80 h-80 bg-cyan-500 rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-0 left-20 w-96 h-96 bg-slate-700 rounded-full opacity-40 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] items-stretch">
          <section className="order-2 lg:order-1 bg-white/10 border border-white/15 rounded-[32px] p-6 sm:p-10 backdrop-blur-2xl shadow-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
              Access Guidance
            </div>
            <h2 className="mt-6 text-3xl sm:text-4xl font-semibold leading-tight">
              This route is protected by role-based controls.
            </h2>
            <p className="mt-4 text-white/80 text-sm sm:text-base">
              Your session is valid, but the current role does not grant permissions to view this resource. Use the quick tips below to regain access.
            </p>
            <ul className="mt-8 space-y-5">
              {nextSteps.map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
                    <ShieldCheckIcon className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <p className="text-base font-semibold">{item.title}</p>
                    <p className="text-sm text-white/75">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-10 grid grid-cols-2 gap-4 text-center text-sm">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-3xl font-semibold">403</p>
                <p className="text-xs text-white/70">Forbidden</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-3xl font-semibold">Role-based</p>
                <p className="text-xs text-white/70">Zero-trust enforced</p>
              </div>
            </div>
            <div className="mt-10 text-xs text-white/65">
              Need an escalation? Email <a href="mailto:admin@scanly.indovisual.co.id" className="underline decoration-white/40 decoration-dashed">admin@scanly.indovisual.co.id</a>.
            </div>
          </section>

          <section className="order-1 lg:order-2 bg-white text-slate-900 rounded-[32px] shadow-2xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" aria-hidden="true" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
                  <LockClosedIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-emerald-500 uppercase">Permission required</p>
                  <h1 className="text-3xl font-bold">Access denied</h1>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Only administrators or owners with the appropriate policy can view this area. Choose an option below to continue working without losing context.
              </p>

              <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <ExclamationCircleIcon className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Request access</p>
                    <p className="text-xs text-slate-500">Send a note to admins with a link to this page.</p>
                  </div>
                </div>
                <Link
                  href="mailto:admin@scanly.indovisual.co.id"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800"
                >
                  Email administrators
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
                >
                  Return to dashboard
                </Link>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.3em]">Need another task?</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Link href="/reports" className="rounded-2xl bg-emerald-600 text-white px-4 py-3 text-sm font-semibold text-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-700">
                    Browse reports
                  </Link>
                  <Link href="/settings" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-center text-slate-700 hover:bg-slate-50">
                    Manage profile
                  </Link>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <ArrowPathIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Refresh access</p>
                    <p className="text-xs">If you recently received access, refresh the page.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Reload
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
