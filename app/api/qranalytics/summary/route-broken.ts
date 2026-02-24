import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthenticatedUserId } from '@/lib/auth'

console.warn("[QR ANALYTICS SUMMARY API] Loading route...")

export async function GET(request: NextRequest) {
  try {
    // GET DYNAMIC USER ID FROM AUTHENTICATION - NO MORE HARDCODE!
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      console.warn('[QR ANALYTICS SUMMARY API] ❌ No authenticated user found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log('[QR ANALYTICS SUMMARY API] ✅ User authenticated:', userId);
    
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    
    console.warn(`[QR ANALYTICS SUMMARY API] 🔥 GET ANALYTICS DATA - ${days} DAYS`)

    // 1. QR CODES COUNT & SCANS SUMMARY
    const qrCodesResult = await pool.query(`
      SELECT 
        COUNT(*) as qr_code_count,
        COUNT(*) FILTER (WHERE is_active = true) as active_qr_codes,
        SUM(scans) as total_scans
      FROM qr_codes 
      WHERE user_id = $1
    `, [userId])

    const qrSummary = qrCodesResult.rows[0]

    // 2. SCANS BY DAY (last X days)
    const scansByDayResult = await pool.query(`
      SELECT 
        DATE(scanned_at) as date,
        COUNT(*) as count
      FROM scan_events se
      JOIN qr_codes qc ON se.qr_code_id = qc.id
      WHERE qc.user_id = $1 
        AND scanned_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(scanned_at)
      ORDER BY date DESC
      LIMIT $2
    `, [userId, days])

    // 3. SCANS BY DEVICE
    const scansByDeviceResult = await pool.query(`
      SELECT 
        COALESCE(device_type, 'unknown') as device,
        COUNT(*) as count
      FROM scan_events se
      JOIN qr_codes qc ON se.qr_code_id = qc.id
      WHERE qc.user_id = $1
        AND scanned_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY device_type
      ORDER BY count DESC
    `, [userId])

    // 4. SCANS BY LOCATION (country + city)
    const scansByLocationResult = await pool.query(`
      SELECT 
        CONCAT(COALESCE(country, 'Unknown'), ', ', COALESCE(city, 'Unknown')) as location,
        COUNT(*) as count
      FROM scan_events se
      JOIN qr_codes qc ON se.qr_code_id = qc.id
      WHERE qc.user_id = $1
        AND scanned_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY country, city
      ORDER BY count DESC
      LIMIT 10
    `, [userId])

    // 5. TOP PERFORMING QR CODES
    const topQRCodesResult = await pool.query(`
      SELECT 
        qc.id,
        qc.name,
        qc.scans
      FROM qr_codes qc
      WHERE qc.user_id = $1
      ORDER BY qc.scans DESC
      LIMIT 5
    `, [userId])

    // FORMAT RESPONSE ACCORDING TO AnalyticsSummary interface
    const analyticsData = {
      qrCodeCount: parseInt(qrSummary.qr_code_count) || 0,
      shortUrlCount: 0, // Will be implemented later
      totalScans: parseInt(qrSummary.total_scans) || 0,
      totalClicks: 0, // Will be implemented later
      activeQRCodes: parseInt(qrSummary.active_qr_codes) || 0,
      
      scansByDay: scansByDayResult.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count)
      })),
      
      clicksByDay: [], // Will be implemented later
      
      scansByDevice: scansByDeviceResult.rows.map(row => ({
        device: row.device,
        count: parseInt(row.count)
      })),
      
      clicksByDevice: [], // Will be implemented later
      
      scansByLocation: scansByLocationResult.rows.map(row => ({
        location: row.location,
        count: parseInt(row.count)
      })),
      
      clicksByLocation: [], // Will be implemented later
      
      topQRCodes: topQRCodesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        scans: parseInt(row.scans)
      })),
      
      topShortUrls: [] // Will be implemented later
    }

    console.warn(`[QR ANALYTICS SUMMARY API] ✅ FOUND:`)
    console.warn(`  - QR Codes: ${analyticsData.qrCodeCount}`)
    console.warn(`  - Total Scans: ${analyticsData.totalScans}`)
    console.warn(`  - Scans by Day: ${analyticsData.scansByDay.length} days`)
    console.warn(`  - Devices: ${analyticsData.scansByDevice.length} types`)
    console.warn(`  - Locations: ${analyticsData.scansByLocation.length} places`)
    
    return NextResponse.json(analyticsData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    console.error('[QR ANALYTICS SUMMARY API] ❌ ERROR:', error)
    return NextResponse.json(
      { _error: 'Failed to fetch QR analytics summary: ' + error.message },
      { status: 500 }
    )
  }
}
