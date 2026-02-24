import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enhancedAnalytics } from '../../../services/enhancedAnalytics'
import { getEffectiveUserSettings } from '@/lib/userSettingsCache'

/**
 * Public facing QR migration redirect route
 * Pattern: /qr-redirect/[key]
 * Supports both qr_migration.key and fallback to qr_codes (if key accidentally equals id)
 * Mirrors logic from /api/qr/[id] with adjustments for key-based lookup.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ key: string }> }) {
  try {
    const params = await context.params
    const { key } = params
    console.warn(`[QR KEY REDIRECT] 🔑 Incoming key scan: ${key}`)

    // 1. Lookup migration by key first
    let migration = await prisma.qr_migration.findFirst({ where: { key, status: 'active' } })
    let isMigration = false
    let qrCode: any = null

    if (migration) {
      isMigration = true
      qrCode = {
        id: migration.id,
        name: migration.name,
        content: migration.redirect_url,
        scans: migration.scans || 0,
        is_active: migration.status === 'active',
        expires_at: null,
        max_scans: null,
        user_id: migration.user_id
      }
      console.warn(`[QR KEY REDIRECT] ✅ Migration QR found: ${migration.key} -> ${migration.redirect_url}`)
    } else {
      // As a fallback, treat key as a qr_code id
      qrCode = await prisma.qr_codes.findUnique({ where: { id: key } })
      if (qrCode) console.warn('[QR KEY REDIRECT] ⚠️ Fallback resolved to qr_codes id match')
    }

    if (!qrCode || !qrCode.is_active) {
      console.warn('[QR KEY REDIRECT] ❌ QR record not found or inactive')
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // 2. Apply expiration / max scan checks (only if present on normal QR codes)
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Expired' }, { status: 410 })
    }
    if (qrCode.max_scans && qrCode.scans >= qrCode.max_scans) {
      return NextResponse.json({ error: 'Limit reached' }, { status: 410 })
    }

    // 3. User settings for analytics
    let effective: any = null
    try { if (qrCode.user_id) effective = await getEffectiveUserSettings(qrCode.user_id) } catch {}
    const analyticsEnabled = effective?.enable_analytics !== false
    const geoEnabled = effective?.geo_location !== false
    const anonymizeIP = effective?.anonymize_ip_addresses === true

    // 4. Collect analytics (best-effort)
    let analytics: any = { device: {}, location: {}, network: {}, browser: {}, os: {} }
    if (analyticsEnabled) {
      try { analytics = await enhancedAnalytics.collectRealTimeAnalytics() } catch (e) { console.warn('[QR KEY REDIRECT] analytics failed', e) }
    }
    if (!geoEnabled) analytics.location = { city: '', country: '' }
    if (anonymizeIP && analytics.network?.ip) {
      const ip = analytics.network.ip
      if (ip.includes('.')) { const parts = ip.split('.'); parts[3] = '0'; analytics.network.ip = parts.join('.') }
      else if (ip.includes(':')) { const segs = ip.split(':'); analytics.network.ip = segs.slice(0,4).join(':') + '::' }
    }

    // 5. UTM + Referrer
    const rawRef = request.headers.get('referer') || 'direct_scan'
    let referrerDomain: string | null = null
    const urlObj = new URL(request.url)
    const utm: Record<string,string|undefined> = {
      utm_source: urlObj.searchParams.get('utm_source') || undefined,
      utm_medium: urlObj.searchParams.get('utm_medium') || undefined,
      utm_campaign: urlObj.searchParams.get('utm_campaign') || undefined,
      utm_term: urlObj.searchParams.get('utm_term') || undefined,
      utm_content: urlObj.searchParams.get('utm_content') || undefined,
    }
    try {
      if (rawRef && rawRef !== 'direct_scan' && rawRef.startsWith('http')) {
        const refUrl = new URL(rawRef)
        referrerDomain = refUrl.hostname
        if (!utm.utm_source) utm.utm_source = refUrl.searchParams.get('utm_source') || undefined
        if (!utm.utm_medium) utm.utm_medium = refUrl.searchParams.get('utm_medium') || undefined
        if (!utm.utm_campaign) utm.utm_campaign = refUrl.searchParams.get('utm_campaign') || undefined
        if (!utm.utm_term) utm.utm_term = refUrl.searchParams.get('utm_term') || undefined
        if (!utm.utm_content) utm.utm_content = refUrl.searchParams.get('utm_content') || undefined
      }
    } catch {}

    const ipFinal = analytics.network?.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // 6. Core scan event
    const scanEvent = await prisma.scan_events.create({
      data: {
        qr_code_id: qrCode.id, // For migration we still store original migration id in migration_qr_id and reuse id in qr_code_id for foreign key integrity
        migration_qr_id: isMigration ? qrCode.id : null,
        scanned_at: new Date()
      },
      select: { id: true }
    })

    // 7. Extended analytics
    try {
      await prisma.qr_scan_analytics.create({
        data: {
          qr_code_id: qrCode.id,
          migration_qr_id: isMigration ? qrCode.id : null,
          scanned_at: new Date(),
          ip_address: ipFinal,
          user_agent: userAgent,
          country: analytics.location?.country || null,
          city: analytics.location?.city || null,
          device_type: analytics.device?.type || null,
          device_brand: analytics.device?.brand || null,
          device_model: analytics.device?.model || null,
          browser: analytics.browser?.name || null,
          operating_system: analytics.os?.name || null,
          referrer: rawRef,
          referrer_domain: referrerDomain,
          utm_source: utm.utm_source || null,
          utm_medium: utm.utm_medium || null,
          utm_campaign: utm.utm_campaign || null,
          utm_term: utm.utm_term || null,
          utm_content: utm.utm_content || null,
          user_id: qrCode.user_id || null,
          scan_event_id: scanEvent.id
        }
      })
    } catch (e) {
      console.warn('[QR KEY REDIRECT] failed to insert analytics row', e)
    }

    // 8. Increment scan count
    try {
      if (isMigration) {
        await prisma.qr_migration.update({ where: { id: qrCode.id }, data: { scans: { increment: 1 }, updated_at: new Date() } })
      } else {
        await prisma.qr_codes.update({ where: { id: qrCode.id }, data: { scans: { increment: 1 }, updated_at: new Date() } })
      }
    } catch (e) {
      console.warn('[QR KEY REDIRECT] failed to increment scans', e)
    }

    // 9. Redirect
    const targetUrl = qrCode.content
    console.warn(`[QR KEY REDIRECT] 🚀 Redirecting to ${targetUrl}`)
    return NextResponse.redirect(targetUrl, 302)
  } catch (error) {
    console.error('[QR KEY REDIRECT] ❌ Error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
