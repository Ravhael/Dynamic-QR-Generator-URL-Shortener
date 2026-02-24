import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserId, isAdministrator } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.warn('[QR CATEGORIES COUNT API][Prisma] GET counts');
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
    }
    const admin = await isAdministrator(request);

    // Ambil daftar categories yang user boleh lihat
    const categoryWhere = admin
      ? {}
      : { OR: [ { is_default: true }, { user_id: userId } ] };

    const categories = await prisma.qr_categories.findMany({
      where: categoryWhere,
      select: { id: true, name: true, is_default: true }
    });
    const categoryIds = categories.map(c => c.id);

    let grouped: { category_id: string | null; _count: { id: number } }[] = [];
    if (categoryIds.length > 0) {
      // Hitung jumlah qr_codes per category (hanya category yang ada di list)
      const raw = await prisma.qr_codes.groupBy({
        by: ['category_id'],
        where: { category_id: { in: categoryIds } },
        _count: { id: true }
      });
      grouped = raw.map(r => ({ category_id: r.category_id, _count: { id: r._count.id } }));
    }

    // Bentuk struktur counts & details menyerupai versi lama
    const counts: Record<string, number> = {};
    const details = categories
      .sort((a, b) => { // Keep default-first ordering similar to old ORDER BY is_default DESC, name ASC
        if ((a.is_default ? 1 : 0) !== (b.is_default ? 1 : 0)) return (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0);
        return a.name.localeCompare(b.name);
      })
      .map(cat => {
        const found = grouped.find(g => g.category_id === cat.id);
        const qr_count = found?._count.id || 0;
        counts[cat.id] = qr_count;
        return { category_id: cat.id, category_name: cat.name, qr_count };
      });

    return NextResponse.json({ counts, details });
  } catch (error: any) {
    console.error('[QR CATEGORIES COUNT API][Prisma] ERROR:', error);
    return NextResponse.json({ error: 'Failed to get QR codes count: ' + (error?.message || 'Unknown') }, { status: 500 });
  }
}
