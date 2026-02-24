import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { enhancedAnalytics } from '../../../services/enhancedAnalytics'
import { getEffectiveUserSettings } from '@/lib/userSettingsCache'

console.warn("[QR SCAN API] Loading route...")

interface QRScanData {
  qrCodeId: string
  qrCodeTitle: string
  scannedText: string
  detectedType: string
  scanMethod: string
  scanLocation: string
}

export async function POST(request: NextRequest) {
  try {
    console.warn('[QR SCAN API] 📱 Processing QR scan event')
    
    const body = await request.json()
    const { qrCodeId, qrCodeTitle, customData } = body as {
      qrCodeId: string
      qrCodeTitle: string
      customData: QRScanData
    }

    if (!qrCodeId || !customData) {
      console.warn('[QR SCAN API] ❌ Missing required fields')
      return NextResponse.json(
        { error: 'qrCodeId and customData are required' },
        { status: 400 }
      )
    }

    // Get user ID for QR code ownership (if available, otherwise use authenticated user)
    const userId = await getAuthenticatedUserId(request)
    const ownerUserId = userId || 'af6b7277-5dd7-4a4d-9501-b5e6f15202e8' // Fallback to admin for external scans

    // Load per-user settings for analytics gating
    let effective: any = null
    try { effective = await getEffectiveUserSettings(ownerUserId) } catch (e) { console.warn('[QR SCAN API] user settings load fail', e) }
    const analyticsEnabled = effective?.enable_analytics !== false
    const geoEnabled = effective?.geo_location !== false
    const anonymizeIP = effective?.anonymize_ip_addresses === true

    let analytics: any = { device: { brand: '', model: '' }, location: { city: '', country: '' }, network: { ip: '' }, timestamp: Date.now() }
    if (analyticsEnabled) {
      console.warn('[QR SCAN API] 📊 Collecting enhanced analytics...')
      try { analytics = await enhancedAnalytics.collectRealTimeAnalytics() } catch (e) { console.warn('[QR SCAN API] analytics collection failed', e) }
    } else {
      console.warn('[QR SCAN API] ⚠️ Analytics disabled per user settings')
    }

    if (!geoEnabled) {
      analytics.location = { city: '', country: '' }
    }
    if (anonymizeIP && analytics.network?.ip) {
      const ip = analytics.network.ip
      if (ip.includes('.')) { // IPv4 simple anonymize
        const parts = ip.split('.')
        parts[3] = '0'
        analytics.network.ip = parts.join('.')
      } else if (ip.includes(':')) {
        const segs = ip.split(':')
        analytics.network.ip = segs.slice(0,4).join(':') + '::'
      }
    }
    
    console.warn('[QR SCAN API] 📊 Analytics collected:', {
      device: `${analytics.device.brand} ${analytics.device.model}`,
      location: `${analytics.location.city}, ${analytics.location.country}`,
      ip: analytics.network.ip
    })

    // First, check if QR code exists in database, if not create a placeholder
    let dbQRCodeId = qrCodeId
    
    try {
      const existing = await prisma.qr_codes.findUnique({ where: { id: qrCodeId } });
      if (!existing) {
        console.warn('[QR SCAN API] 🆕 Creating placeholder QR code entry');
        const created = await prisma.qr_codes.create({
          data: {
            id: qrCodeId,
            name: qrCodeTitle || 'External QR Code',
            type: customData.detectedType || 'text',
            content: customData.scannedText || '',
            is_dynamic: false,
            scans: 0,
            is_active: true,
            user_id: ownerUserId,
            qr_code_data: '',
          }
        });
        dbQRCodeId = created.id;
      }
    } catch (qrError) {
      console.warn('[QR SCAN API] ⚠️ QR code check/creation failed:', qrError);
    }

  let scanEventId: any = null
    if (analyticsEnabled) {
      console.warn('[QR SCAN API] 💾 Inserting scan event to database...')
      const scanEvent = await prisma.scan_events.create({
        data: {
          qr_code_id: dbQRCodeId,
          scanned_at: new Date(),
        }
      });
      scanEventId = scanEvent.id
    } else {
      console.warn('[QR SCAN API] ⏭️ Skipping scan_events insert (analytics disabled)')
    }

    // Update QR code scan count
    try {
      await prisma.qr_codes.update({
        where: { id: dbQRCodeId },
        data: { scans: { increment: 1 }, updated_at: new Date() }
      });
    } catch (updateError) {
      console.warn('[QR SCAN API] ⚠️ Failed to update scan count:', updateError);
    }

    console.warn('[QR SCAN API] 🎉 QR scan processing completed successfully')

    return NextResponse.json({
      success: true,
      scanEventId: scanEventId,
      qrCodeId: dbQRCodeId,
      analytics: {
        device: `${analytics.device.brand} ${analytics.device.model}`,
        location: `${analytics.location.city}, ${analytics.location.country}`,
        ip: analytics.network.ip,
        timestamp: analytics.timestamp
      },
      message: 'QR scan recorded successfully with real-time analytics'
    })

  } catch (_error) {
    console.error('[QR SCAN API] ❌ Error processing QR scan:', _error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process QR scan',
      details: _error instanceof Error ? _error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to retrieve recent scans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    console.warn('[QR SCAN API] 📊 Fetching recent QR scans, limit:', limit)
    
    const scans: any[] = await prisma.$queryRaw`SELECT se.id, se.qr_code_id, se.scanned_at, se.device_type, se.browser, se.os, qc.name as qr_code_name, qc.type as qr_code_type, qc.content as qr_code_content FROM scan_events se LEFT JOIN qr_codes qc ON se.qr_code_id = qc.id ORDER BY se.scanned_at DESC LIMIT ${limit}`;
    console.warn('[QR SCAN API] ✅ Retrieved', scans.length, 'scan records')

    return NextResponse.json({
      success: true,
      scans: scans.map((row: any) => ({
        id: row.id,
        qrCodeId: row.qr_code_id,
        qrCodeName: row.qr_code_name || 'Unknown QR Code',
        qrCodeType: row.qr_code_type || 'text',
        qrCodeContent: row.qr_code_content || '',
        scannedAt: row.scanned_at,
        ipAddress: row.ip_address, // may be undefined if column absent
        userAgent: row.user_agent,
        country: row.country,
        city: row.city,
        deviceType: row.device_type,
        browser: row.browser,
        os: row.os,
        utmSource: row.utm_source,
        utmMedium: row.utm_medium,
        utmCampaign: row.utm_campaign
      }))
    })

  } catch (_error) {
    console.error('[QR SCAN API] ❌ Error fetching scans:', _error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch scan records'
    }, { status: 500 })
  }
}
