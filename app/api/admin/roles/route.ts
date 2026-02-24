import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const started = Date.now();
  try {
    console.warn('🔍 [admin/roles] Fetching roles via Prisma...');
    const roles = await prisma.roles.findMany({
      orderBy: { name: 'asc' }
    });
    console.warn(`✅ [admin/roles] Retrieved ${roles.length} roles in ${Date.now() - started}ms`);
    return NextResponse.json({
      success: true,
      data: roles,
      message: 'Roles fetched successfully'
    });
  } catch (error: any) {
    console.error('❌ [admin/roles] Error fetching roles:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
