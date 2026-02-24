import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.warn("[QR MIGRATION SCAN API] POST - Recording migration QR scan");
  
  try {
    const body = await request.json();
    const { 
      migrationQrId, 
      ipAddress, 
      userAgent, 
      referrer,
      country,
      city,
      latitude,
      longitude,
      deviceType,
      browser,
      os 
    } = body;

    if (!migrationQrId) {
      return NextResponse.json(
        { error: 'Migration QR ID is required' },
        { status: 400 }
      );
    }

    // Transaction with Prisma
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.qr_migration.findUnique({ where: { id: migrationQrId } });
      if (!existing) return { notFound: true } as const;
      const updated = await tx.qr_migration.update({
        where: { id: migrationQrId },
        data: { scans: (existing.scans || 0) + 1, updated_at: new Date() }
      });
      // Placeholder qr_codes created on migration creation uses same id
      const scanEvent = await tx.scan_events.create({
        data: {
          migration_qr_id: migrationQrId,
          qr_code_id: migrationQrId, // same id linkage strategy
          user_id: existing.user_id,
          scanned_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        },
        select: { id: true }
      });
      // Store extended analytics metadata
      await tx.qr_scan_analytics.create({
        data: {
          qr_code_id: migrationQrId,
          migration_qr_id: migrationQrId,
          scanned_at: new Date(),
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
          referrer: referrer || null,
          country: country || null,
          city: city || null,
          latitude: latitude ? String(latitude) as any : null,
          longitude: longitude ? String(longitude) as any : null,
          device_type: deviceType || null,
          browser: browser || null,
          operating_system: os || null,
          created_at: new Date(),
          updated_at: new Date(),
          user_id: existing.user_id
        }
      });
      return { updated, scanEvent } as const;
    });

    if ((result as any).notFound) {
      return NextResponse.json({ error: 'Migration QR code not found' }, { status: 404 });
    }

    const { updated, scanEvent } = result as any;
    console.warn(`[QR MIGRATION SCAN API][Prisma] ✅ Successfully recorded scan for migration QR: ${updated.name}`);
    return NextResponse.json({
      success: true,
      message: 'Migration QR scan recorded successfully',
      data: { qrName: updated.name, redirectUrl: updated.redirect_url, scanEventId: scanEvent.id }
    });

  } catch (error: any) {
    console.error('[QR MIGRATION SCAN API] ❌ Error recording scan:', error);
    return NextResponse.json(
      { 
        error: 'Failed to record migration QR scan',
        details: error.message 
      },
      { status: 500 }
    );
  }
}