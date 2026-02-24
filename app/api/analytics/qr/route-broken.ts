import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('[QR ANALYTICS API] Fetching REAL data from database...');
    
    // GET DYNAMIC USER ID FROM AUTHENTICATION - NO MORE HARDCODE!
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      console.warn('[QR ANALYTICS API] ❌ No authenticated user found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log('[QR ANALYTICS API] ✅ User authenticated:', userId);
    
    // 1. Get REAL QR codes data
    const qrQuery = `
      SELECT 
        id, name, type, content, scans, is_active, created_at, category_id
      FROM qr_codes 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const qrResult = await pool.query(qrQuery, [userId]);
    const qrCodes = qrResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      content: row.content,
      scans: row.scans || 0,
      isActive: row.is_active,
      createdAt: row.created_at,
      category: row.category_id || 'Uncategorized'
    }));

    // 2. Get REAL scan statistics
    const qrCodeCount = qrCodes.length;
    const totalScans = qrCodes.reduce((sum, qr) => sum + (qr.scans || 0), 0);
    const activeQRCodes = qrCodes.filter(qr => qr.isActive).length;

    // 3. Get REAL scans by day from scan_events table
    const scansByDayQuery = `
      SELECT 
        DATE(se.scanned_at) as scan_date,
        COUNT(*) as scan_count
      FROM scan_events se
      JOIN qr_codes qc ON se.qr_code_id = qc.id
      WHERE qc.user_id = $1
        AND se.scanned_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(se.scanned_at)
      ORDER BY scan_date DESC
    `;
    const scansByDayResult = await pool.query(scansByDayQuery, [userId]);
    const scansByDay = scansByDayResult.rows.map(row => ({
      date: row.scan_date,
      count: parseInt(row.scan_count)
    }));

    // 4. Get REAL device distribution from scan_events
    const scansByDeviceQuery = `
      SELECT 
        COALESCE(se.device_type, 'Unknown') as device,
        COUNT(*) as count
      FROM scan_events se
      JOIN qr_codes qc ON se.qr_code_id = qc.id
      WHERE qc.user_id = $1
      GROUP BY se.device_type
      ORDER BY count DESC
    `;
    const scansByDeviceResult = await pool.query(scansByDeviceQuery, [userId]);
    const scansByDevice = scansByDeviceResult.rows.map(row => ({
      device: row.device,
      count: parseInt(row.count)
    }));

    // 5. Get REAL location distribution from scan_events
    const scansByLocationQuery = `
      SELECT 
        CONCAT(COALESCE(se.city, 'Unknown'), ', ', COALESCE(se.country, 'Unknown')) as location,
        COUNT(*) as count
      FROM scan_events se
      JOIN qr_codes qc ON se.qr_code_id = qc.id
      WHERE qc.user_id = $1
      GROUP BY se.city, se.country
      ORDER BY count DESC
      LIMIT 10
    `;
    const scansByLocationResult = await pool.query(scansByLocationQuery, [userId]);
    const scansByLocation = scansByLocationResult.rows.map(row => ({
      location: row.location,
      count: parseInt(row.count)
    }));

    // 6. Get REAL OS distribution from scan_events
    const scansByOSQuery = `
      SELECT 
        COALESCE(se.os, 'Unknown') as os,
        COUNT(*) as count
      FROM scan_events se
      JOIN qr_codes qc ON se.qr_code_id = qc.id
      WHERE qc.user_id = $1
      GROUP BY se.os
      ORDER BY count DESC
    `;
    const scansByOSResult = await pool.query(scansByOSQuery, [userId]);
    const scansByOS = scansByOSResult.rows.map(row => ({
      os: row.os,
      count: parseInt(row.count)
    }));

    // 7. Get REAL IP distribution from scan_events (anonymized)
    const scansByIpQuery = `
      SELECT 
        CONCAT(SPLIT_PART(se.ip_address::text, '.', 1), '.', SPLIT_PART(se.ip_address::text, '.', 2), '.***.***') as ip,
        COUNT(*) as count
      FROM scan_events se
      JOIN qr_codes qc ON se.qr_code_id = qc.id
      WHERE qc.user_id = $1
      GROUP BY SPLIT_PART(se.ip_address::text, '.', 1), SPLIT_PART(se.ip_address::text, '.', 2)
      ORDER BY count DESC
      LIMIT 10
    `;
    const scansByIpResult = await pool.query(scansByIpQuery, [userId]);
    const scansByIp = scansByIpResult.rows.map(row => ({
      ip: row.ip,
      count: parseInt(row.count)
    }));

    // 8. Empty click data for URL shortener (not related to QR)
    const clicksByLocation: { location: string; count: number }[] = [];

    // 9. Get top QR codes by actual scans
    const topQRCodes = qrCodes
      .sort((a, b) => (b.scans || 0) - (a.scans || 0))
      .slice(0, 10)
      .map(qr => ({
        id: qr.id,
        name: qr.name || 'Untitled QR Code',
        type: qr.type || 'url',
        scans: qr.scans || 0
      }));

    const analyticsData = {
      qrCodeCount,
      totalScans,
      activeQRCodes,
      qrCodes, // Include full QR codes data for detailed analytics
      scansByDay,
      scansByDevice,
      scansByLocation,
      clicksByLocation,
      scansByOS,
      scansByIp,
      topQRCodes
    };

    console.log('[QR ANALYTICS API] REAL data returned:', {
      qrCodeCount,
      totalScans,
      activeQRCodes,
      scanEventsCount: scansByDay.reduce((sum, day) => sum + day.count, 0)
    });

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('[QR ANALYTICS API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch QR analytics data' }, { status: 500 });
  }
}