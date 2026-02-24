import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enhancedAnalytics } from '../../../../services/enhancedAnalytics'
import { getEffectiveUserSettings } from '@/lib/userSettingsCache'

console.warn("[QR REDIRECT API] Loading route...")

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id: qrCodeId } = params
    
    console.warn(`[QR REDIRECT] 📱 QR Code scan detected: ${qrCodeId}`)

    // Prisma-only fetch
    let qrCode: any = await prisma.qr_codes.findUnique({ where: { id: qrCodeId } })
    let isMigration = false
    if (!qrCode || !qrCode.is_active) {
      const mig = await prisma.qr_migration.findUnique({ where: { id: qrCodeId } })
      if (!mig || mig.status !== 'active') {
        console.warn(`[QR REDIRECT] ❌ QR Code not found or inactive: ${qrCodeId}`)
        return new NextResponse('QR Code not found', { status: 404 })
      }
      qrCode = {
        id: mig.id,
        name: mig.name,
        content: mig.redirect_url,
        scans: mig.scans || 0,
        is_active: mig.status === 'active',
        expires_at: null,
        max_scans: null,
        user_id: mig.user_id
      }
      isMigration = true
    }
    console.warn(`[QR REDIRECT] ✅ QR Code found: ${qrCode.name} -> ${qrCode.content}`)

    // Check if QR Code is expired
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
      console.warn(`[QR REDIRECT] ⚠️ QR Code expired: ${qrCodeId}`)
      return new NextResponse('QR Code has expired', { status: 410 })
    }

    // Check max scans limit
    if (qrCode.max_scans && qrCode.scans >= qrCode.max_scans) {
      console.warn(`[QR REDIRECT] ⚠️ QR Code max scans reached: ${qrCodeId}`)
      return new NextResponse('QR Code scan limit reached', { status: 410 })
    }

    // Load per-user settings (owner) for analytics gating & privacy controls
    let effective: any = null
    try {
      if (qrCode.user_id) effective = await getEffectiveUserSettings(qrCode.user_id)
    } catch (e) { console.warn('[QR REDIRECT] ⚠️ Failed loading user settings', e) }
    const analyticsEnabled = effective?.enable_analytics !== false
    const geoEnabled = effective?.geo_location !== false
    const anonymizeIP = effective?.anonymize_ip_addresses === true

    try {
      // Collect real-time analytics dari scanner
      console.warn('[QR REDIRECT] 📊 Collecting analytics...')
      let analytics = { device: { brand: '', model: '', type: '' }, location: { city: '', country: '' }, network: { ip: '' }, browser: { name: '' }, os: { name: '' } } as any
      if (analyticsEnabled) {
        try { analytics = await enhancedAnalytics.collectRealTimeAnalytics() } catch (e) { console.warn('[QR REDIRECT] analytics collection failed', e) }
      } else {
        console.warn('[QR REDIRECT] ⚠️ Analytics disabled via user settings')
      }

      if (!geoEnabled) {
        analytics.location = { city: '', country: '' }
      }
      if (anonymizeIP && analytics.network?.ip) {
        const ip = analytics.network.ip
        if (ip.includes('.')) { const parts = ip.split('.'); parts[3] = '0'; analytics.network.ip = parts.join('.') }
        else if (ip.includes(':')) { const segs = ip.split(':'); analytics.network.ip = segs.slice(0,4).join(':') + '::' }
      }

      // Enrich referrer + UTM parsing (now also parse query params directly)
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
          // If no explicit utm from current URL, fallback to referrer params
          if (!utm.utm_source) utm.utm_source = refUrl.searchParams.get('utm_source') || undefined
          if (!utm.utm_medium) utm.utm_medium = refUrl.searchParams.get('utm_medium') || undefined
          if (!utm.utm_campaign) utm.utm_campaign = refUrl.searchParams.get('utm_campaign') || undefined
          if (!utm.utm_term) utm.utm_term = refUrl.searchParams.get('utm_term') || undefined
          if (!utm.utm_content) utm.utm_content = refUrl.searchParams.get('utm_content') || undefined
        }
      } catch {}

      console.warn('[QR REDIRECT] 📊 Analytics collected:', {
        device: `${analytics.device.brand} ${analytics.device.model}`,
        location: `${analytics.location.city}, ${analytics.location.country}`,
        ip: analytics.network.ip
      })

      // Persist minimal scan event using Prisma (model only has core fields)
      const ipFinal = analytics.network.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
      const userAgent = request.headers.get('user-agent') || 'Unknown'
      const refererFinal = rawRef
      const scanEvent = await prisma.scan_events.create({
        data: {
          qr_code_id: qrCodeId,
            migration_qr_id: isMigration ? qrCodeId : null,
          scanned_at: new Date()
        },
        select: { id: true, scanned_at: true }
      })
      console.warn('[QR REDIRECT] ✅ Scan event recorded (core):', scanEvent.id)

      // Insert extended analytics row
      try {
        await prisma.qr_scan_analytics.create({
          data: {
            qr_code_id: qrCodeId,
            migration_qr_id: isMigration ? qrCodeId : null,
            scanned_at: new Date(),
            ip_address: ipFinal,
            user_agent: userAgent,
            country: analytics.location.country || null,
            city: analytics.location.city || null,
            device_type: analytics.device.type || null,
            device_brand: analytics.device.brand || null,
            device_model: analytics.device.model || null,
            browser: analytics.browser.name || null,
            operating_system: analytics.os.name || null,
            referrer: refererFinal,
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
      } catch (qaErr) {
        console.warn('[QR REDIRECT] ⚠️ Failed inserting qr_scan_analytics row', qaErr)
      }

      // Increment scans (handle normal vs migration QR sources separately)
      try {
        if (isMigration) {
          await prisma.qr_migration.update({ where: { id: qrCodeId }, data: { scans: { increment: 1 }, updated_at: new Date() } })
          console.warn('[QR REDIRECT] ✅ Migration QR scan count updated')
        } else {
          await prisma.qr_codes.update({ where: { id: qrCodeId }, data: { scans: { increment: 1 }, updated_at: new Date() } })
          console.warn('[QR REDIRECT] ✅ QR code scan count updated')
        }
      } catch (incErr) {
        console.warn('[QR REDIRECT] ⚠️ Failed to increment scan count', incErr)
      }

    } catch (analyticsError) {
      console.warn('[QR REDIRECT] ⚠️ Analytics collection failed, but continuing redirect:', analyticsError)
      
      // Fallback minimal recording
      try {
        const fallback = await prisma.scan_events.create({ data: { qr_code_id: qrCodeId, migration_qr_id: isMigration ? qrCodeId : null, scanned_at: new Date() }, select: { id: true } })
        try { await prisma.qr_scan_analytics.create({ data: { qr_code_id: qrCodeId, migration_qr_id: isMigration ? qrCodeId : null, scanned_at: new Date(), user_id: qrCode.user_id || null, referrer: request.headers.get('referer') || 'direct_scan', scan_event_id: fallback.id } }) } catch {}
        try {
          if (isMigration) {
            await prisma.qr_migration.update({ where: { id: qrCodeId }, data: { scans: { increment: 1 }, updated_at: new Date() } })
          } else {
            await prisma.qr_codes.update({ where: { id: qrCodeId }, data: { scans: { increment: 1 }, updated_at: new Date() } })
          }
        } catch {}
        console.warn('[QR REDIRECT] ✅ Basic scan recorded (fallback):', fallback.id)
      } catch (fallbackError) {
        console.error('[QR REDIRECT] ❌ Fallback scan recording failed:', fallbackError)
      }
    }

    // Redirect ke target URL
    const targetUrl = qrCode.content
    console.warn(`[QR REDIRECT] 🚀 Redirecting to: ${targetUrl}`)

    // Return redirect response
    return NextResponse.redirect(targetUrl, 302)

  } catch (_error: any) {
    console.error('[QR REDIRECT] ❌ Error processing QR redirect:', _error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
