import { NextResponse } from 'next/server'
import { loadSystemConfig } from '@/lib/systemConfig'

// Lightweight internal endpoint consumed by edge middleware to avoid using Prisma directly in middleware.
// NOTE: This runs in the Node.js runtime (not edge) so Prisma usage inside loadSystemConfig is safe.
export async function GET() {
  try {
    const cfg = await loadSystemConfig()
    return NextResponse.json({
      maintenanceMode: cfg.maintenanceMode,
      enableRegistration: cfg.enableRegistration,
      require2FA: cfg.require2FA,
      enableApiAccess: cfg.enableApiAccess,
      sessionTimeoutSeconds: cfg.sessionTimeoutSeconds,
    }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ _error: 'Failed to load runtime config', detail: e?.message }, { status: 500 })
  }
}
