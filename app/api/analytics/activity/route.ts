import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermission } from '@/lib/ensurePermission'

export const GET = withPermission({ resource: 'analytics', action: 'read' }, async (request: NextRequest) => {
  try {
    console.warn('[ACTIVITY API] GET request received');
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    
    console.warn('[ACTIVITY API] Fetching scan events via Prisma $queryRaw...');
    const scanLimit = Math.ceil(limit / 2);
    const scanEvents: any[] = await prisma.$queryRaw`
      SELECT 
        scan.id,
        'qr_scan' as type,
        'Anonymous' as user,
        CONCAT('Scanned QR Code "', qr.name, '"') as action,
        scan.scanned_at as timestamp,
        'Unknown Location' as location,
        'Unknown Device' as device
      FROM scan_events scan
      JOIN qr_codes qr ON scan.qr_code_id = qr.id
      ORDER BY scan.scanned_at DESC
      LIMIT ${scanLimit}
    `;
    console.warn('[ACTIVITY API] Scan events found:', scanEvents.length);

    console.warn('[ACTIVITY API] Fetching click events via Prisma $queryRaw...');
    const clickLimit = Math.ceil(limit / 2);
    const clickEvents: any[] = await prisma.$queryRaw`
      SELECT 
        click.id,
        'url_click' as type,
        'Anonymous' as user,
        CONCAT('Clicked short URL "', su.short_code, '"') as action,
        click.clicked_at as timestamp,
        'Unknown Location' as location,
        'Unknown Device' as device
      FROM click_events click
      JOIN short_urls su ON click.url_id = su.id
      ORDER BY click.clicked_at DESC
      LIMIT ${clickLimit}
    `;
    console.warn('[ACTIVITY API] Click events found:', clickEvents.length);

    // Combine and sort activities by timestamp
    const activities = [
      ...scanEvents.map((row: any) => ({
        id: row.id,
        type: row.type,
        user: row.user,
        action: row.action,
        timestamp: row.timestamp,
        location: row.location,
        device: row.device
      })),
      ...clickEvents.map((row: any) => ({
        id: row.id,
        type: row.type,
        user: row.user,
        action: row.action,
        timestamp: row.timestamp,
        location: row.location,
        device: row.device
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
    
    console.warn(`[ACTIVITY API] Returning ${activities.length} real activities from database`)
    return NextResponse.json({
      activities: activities,
      total: activities.length,
      limit: limit
    })
    
  } catch (error: any) {
    console.error('[ACTIVITY API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch activity data' }, { status: 500 })
  }
})
