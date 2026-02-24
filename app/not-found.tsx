'use client'

import Link from "next/link"
import { ArrowLeftIcon, SparklesIcon } from "@heroicons/react/24/outline"
import { ExclamationTriangleIcon, GlobeAltIcon } from "@heroicons/react/24/solid"

export default function NotFound() {
  const tips = [
    { title: "Check the URL", copy: "Make sure the link is spelled correctly or still active." },
    { title: "Browse dashboards", copy: "Navigate from the main menu to locate the report you need." },
    { title: "Contact support", copy: "We are here to help you recover missing resources." },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 left-0 w-80 h-80 bg-purple-700 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute top-10 right-0 w-80 h-80 bg-fuchsia-500 rounded-full blur-3xl opacity-25 animate-pulse" />
        <div className="absolute bottom-0 left-16 w-96 h-96 bg-indigo-700 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] items-stretch">
          <section className="order-2 lg:order-1 bg-white/10 border border-white/15 rounded-[32px] p-6 sm:p-10 backdrop-blur-2xl shadow-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
              <span className="h-2 w-2 rounded-full bg-violet-300" aria-hidden="true" />
              Navigator Tips
            </div>
            <h2 className="mt-6 text-3xl sm:text-4xl font-semibold leading-tight">
              Let us guide you back to your QR & URL command center.
            </h2>
            <p className="mt-4 text-white/80 text-sm sm:text-base">
              The resource you were looking for could have been moved, archived, or requires additional permissions.
            </p>
            <ul className="mt-8 space-y-5">
              {tips.map((tip) => (
                <li key={tip.title} className="flex items-start gap-4">
                  <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
                    <SparklesIcon className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <p className="text-base font-semibold">{tip.title}</p>
                    <p className="text-sm text-white/75">{tip.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-10 grid grid-cols-2 gap-4 text-center text-sm">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-3xl font-semibold">404</p>
                <p className="text-xs text-white/70">Not Found</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-3xl font-semibold">24/7</p>
                <p className="text-xs text-white/70">Support coverage</p>
              </div>
            </div>
            <div className="mt-10 text-xs text-white/65">
              Need an audit trail for this link? Email <a href="mailto:admin@scanly.indovisual.co.id" className="underline decoration-white/40 decoration-dashed">admin@scanly.indovisual.co.id</a>.
            </div>
          </section>

          <section className="order-1 lg:order-2 bg-white text-slate-900 rounded-[32px] shadow-2xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500" aria-hidden="true" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-900/5 text-purple-600 shadow-inner">
                  <ExclamationTriangleIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-purple-500 uppercase">Lost signal</p>
                  <h1 className="text-3xl font-bold">Page not found</h1>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                We could not locate the requested resource. You can return to the dashboard, revisit the previous screen, or review documentation below.
              </p>

              <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-6">
                <h3 className="text-sm font-semibold text-slate-700">Helpful actions</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Link href="/dashboard" className="rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold text-center shadow-lg shadow-slate-900/20 hover:bg-slate-800">
                    Go to dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-center text-slate-700 hover:bg-white"
                  >
                    Go back
                  </button>
                </div>
                <Link href="/docs" className="mt-4 inline-flex items-center text-xs font-semibold text-purple-600 hover:text-purple-700">
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                  Open documentation
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <ArrowLeftIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Still stuck?</p>
                    <p className="text-xs">Ping the platform team for personalized help.</p>
                  </div>
                </div>
                <a href="mailto:admin@scanly.indovisual.co.id" className="font-semibold text-purple-600 hover:text-purple-700">
                  admin@scanly.indovisual.co.id
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
