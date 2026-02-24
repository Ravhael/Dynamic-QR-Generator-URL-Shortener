import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { operation, categoryIds } = await request.json();

    if (!operation || !categoryIds || !Array.isArray(categoryIds)) {
      return NextResponse.json({ 
        error: 'Operation and categoryIds array are required' 
      }, { status: 400 });
    }

    if (categoryIds.length === 0) {
      return NextResponse.json({ 
        error: 'No categories selected' 
      }, { status: 400 });
    }

    if (operation === 'delete') {
      // Ambil kategori dengan hitungan QR codes untuk validasi
      const categories = await prisma.qr_categories.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, qr_codes: { select: { id: true }, take: 1 } }
      });
      const blocked = categories.filter(c => c.qr_codes.length > 0);
      if (blocked.length > 0) {
        const msg = blocked.map(c => `${c.name} (has QR codes)`).join(', ');
        return NextResponse.json({
          error: `Cannot delete categories with QR codes: ${msg}. Please delete or reassign those QR codes first.`
        }, { status: 400 });
      }
      // Delete categories
      const deleted = await prisma.qr_categories.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } });
      await prisma.qr_categories.deleteMany({ where: { id: { in: categoryIds } } });
      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${deleted.length} categories`,
        deletedCategories: deleted
      });
    } else {
      return NextResponse.json({
        error: 'Invalid operation. Only "delete" is supported.'
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Bulk categories operation error:', error);
    return NextResponse.json({ 
      error: 'Failed to perform bulk operation',
      details: error.message
    }, { status: 500 });
  }
}