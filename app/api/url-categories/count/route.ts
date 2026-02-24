import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get URL count for each category (Prisma version)
export async function GET(_request: NextRequest) {
  try {
    console.warn('[URL CATEGORIES COUNT API][PRISMA] 🔥 GET URL CATEGORIES COUNT')

    // We need active short URL counts per category including categories with zero active URLs.
    // Using a raw query through Prisma for LEFT JOIN semantics; still parameterless (safe).
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; url_count: bigint | number }>>(`
      SELECT 
        uc.id,
        uc.name,
        COUNT(su.id)::bigint AS url_count
      FROM url_categories uc
      LEFT JOIN short_urls su 
        ON uc.id = su.category_id 
       AND su.is_active = true
      GROUP BY uc.id, uc.name
      ORDER BY uc.name
    `)

    const categoryCounts: Record<string, number> = {}
    rows.forEach(r => {
      const count = typeof r.url_count === 'bigint' ? Number(r.url_count) : Number(r.url_count || 0)
      categoryCounts[r.id] = count
    })

    console.warn('[URL CATEGORIES COUNT API][PRISMA] ✅ Categories counted:', Object.keys(categoryCounts).length)

    return NextResponse.json({
      success: true,
      counts: categoryCounts,
      message: `Retrieved counts for ${rows.length} categories`
    })
  } catch (error: any) {
    console.error('[URL CATEGORIES COUNT API][PRISMA] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch category counts',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}
