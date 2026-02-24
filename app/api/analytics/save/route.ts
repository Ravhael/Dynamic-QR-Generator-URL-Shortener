import { NextRequest, NextResponse } from 'next/server';
import { query as dbQuery } from '@/lib/db';
import { enhancedAnalytics } from '../../../../services/enhancedAnalytics';

export async function POST(request: NextRequest) {
  try {
    const { eventType, resourceId, customData } = await request.json();
    
    // Collect real-time analytics
    const analytics = await enhancedAnalytics.collectRealTimeAnalytics(request);
    
    console.warn('📊 [ANALYTICS] Collecting real-time data:', {
      eventType,
      resourceId,
      device: analytics.device,
      location: analytics.location,
      timestamp: analytics.timestamp
    });

    // Save to appropriate analytics table
    if (eventType === 'qr_scan') {
      await saveQRScanAnalytics(resourceId, analytics, customData);
    } else if (eventType === 'url_click') {
      await saveURLClickAnalytics(resourceId, analytics, customData);
    }

    return NextResponse.json({
      success: true,
      analytics: {
        device: analytics.device,
        location: {
          country: analytics.location.country,
          city: analytics.location.city,
          timezone: analytics.location.timezone
        },
        timestamp: analytics.timestamp
      }
    });

  } catch (_error) {
    console.error('❌ [ANALYTICS] Error saving analytics:', _error);
    return NextResponse.json(
      { _error: 'Failed to save analytics' },
      { status: 500 }
    );
  }
}

async function saveQRScanAnalytics(qrCodeId: string, analytics: any, _customData?: any) {
  const query = `
    INSERT INTO qr_scan_analytics (
      qr_code_id, 
      user_agent, 
      ip_address, 
      country, 
      city, 
      device_type,
      device_brand,
      device_model, 
      operating_system,
      browser,
      screen_resolution,
      language,
      timezone,
      latitude,
      longitude,
      isp,
      session_id,
      scanned_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
  `;

  const values = [
    qrCodeId,
    analytics.userAgent,
    analytics.location.ip,
    analytics.location.country,
    analytics.location.city,
    analytics.device.type,
    analytics.device.brand,
    analytics.device.model,
    analytics.device.os,
    analytics.device.browser,
    `${analytics.screenWidth}x${analytics.screenHeight}`,
    analytics.language,
    analytics.location.timezone,
    analytics.location.latitude,
    analytics.location.longitude,
    analytics.location.isp || 'Unknown',
    analytics.sessionId,
    analytics.timestamp
  ];

  await dbQuery(query, values);
  console.warn('✅ [ANALYTICS] QR scan analytics saved');
}

async function saveURLClickAnalytics(urlId: string, analytics: any, _customData?: any) {
  const query = `
    INSERT INTO url_click_analytics (
      short_url_id, 
      user_agent, 
      ip_address, 
      country, 
      city, 
      device_type,
      device_brand,
      device_model, 
      operating_system,
      browser,
      screen_resolution,
      language,
      timezone,
      latitude,
      longitude,
      isp,
      session_id,
      clicked_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
  `;

  const values = [
    urlId,
    analytics.userAgent,
    analytics.location.ip,
    analytics.location.country,
    analytics.location.city,
    analytics.device.type,
    analytics.device.brand,
    analytics.device.model,
    analytics.device.os,
    analytics.device.browser,
    `${analytics.screenWidth}x${analytics.screenHeight}`,
    analytics.language,
    analytics.location.timezone,
    analytics.location.latitude,
    analytics.location.longitude,
    analytics.location.isp || 'Unknown',
    analytics.sessionId,
    analytics.timestamp
  ];

  await dbQuery(query, values);
  console.warn('✅ [ANALYTICS] URL click analytics saved');
}
