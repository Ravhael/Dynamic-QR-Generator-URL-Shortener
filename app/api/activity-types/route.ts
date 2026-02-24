import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from "next-auth/jwt";
import { PrismaClient } from '@prisma/client';
import { getActivityTheme } from '@/lib/activityTypeTheme';

// Singleton pattern untuk PrismaClient
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Prevent response caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Simple in-memory cache (scoped per server instance)
let cache: { data: any; ts: number } | null = null;
const TTL_MS = 60_000; // 1 minute

export async function GET(request: NextRequest) {
  try {
    console.warn("[ACTIVITY TYPES API] Starting request processing");

    // Auth check with more robust token validation
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Accept any authenticated user; some tokens carry role_id instead of role name
    // We only require a valid session/token for READ access
    if (!token) {
      return NextResponse.json({ 
        success: false,
        message: 'Authentication required',
        error: 'No authentication token'
      }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    }

    const now = Date.now();
    if (cache && now - cache.ts < TTL_MS) {
      console.warn('[ACTIVITY TYPES API] Serving from cache');
      return NextResponse.json({
        success: true,
        cached: true,
        ttl: TTL_MS - (now - cache.ts),
        data: cache.data,
        message: 'Activity types retrieved successfully (cache)'
      }, {
        headers: {
          'Cache-Control': 'public, max-age=30',
          'Content-Type': 'application/json'
        }
      });
    }

    console.warn("[ACTIVITY TYPES API] Fetching activity types from database");

    const rows = await prisma.activity_types.findMany({
      where: { is_active: true },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        category: true,
        icon: true,
        color: true,
        is_sensitive: true,
        requires_approval: true,
        created_at: true,
        is_active: true
      },
      // After regenerating Prisma client (npx prisma generate) with new columns, replace ordering with priority then code
      orderBy: [ { category: 'asc' }, { name: 'asc' } ]
    });

    const activityTypes = rows.map(r => ({
      ...r,
      // Placeholder priority/weight until regenerated types include columns
      priority:  typeof (r as any).priority === 'number' ? (r as any).priority : getActivityTheme(r.code).priority,
      weight: typeof (r as any).weight === 'number' ? (r as any).weight : 0,
      icon: r.icon || getActivityTheme(r.code).icon,
      color: r.color || getActivityTheme(r.code).color,
    }));

    console.warn(`[ACTIVITY TYPES API] Found ${activityTypes.length} activity types`);

    const categorizedTypes = activityTypes.reduce((acc: Record<string, any[]>, type) => {
      const category = type.category || 'Uncategorized';
      (acc[category] ||= []).push(type);
      return acc;
    }, {} as Record<string, any[]>);

    const payload = {
      activity_types: activityTypes,
      categorized: categorizedTypes,
      total: activityTypes.length,
      categories: Object.keys(categorizedTypes)
    };

    cache = { data: payload, ts: now };

    return NextResponse.json({
      success: true,
      cached: false,
      data: payload,
      metadata: {
        timestamp: new Date().toISOString(),
        user: token.email
      },
      ttl: TTL_MS,
      message: 'Activity types retrieved successfully'
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30',
        'Content-Type': 'application/json'
      }
    });

  } catch (error: unknown) {
    // Detailed error logging
    console.error('[ACTIVITY TYPES API] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch activity types',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Content-Type': 'application/json'
      }
    });
  } finally {
    // Only disconnect in development to prevent connection churn in production
    if (process.env.NODE_ENV !== 'production') {
      await prisma.$disconnect().catch(console.error);
    }
  }
}

// POST: Create new activity type
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token?.role) {
      return NextResponse.json({ 
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Only admin can create activity types
    {
      const roleStr = typeof token.role === 'string' ? token.role : String(token.role || '');
      if (roleStr.toLowerCase() !== 'admin') {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 403 });
      }
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.code) {
      return NextResponse.json({
        success: false,
        message: 'Name and code are required'
      }, { status: 400 });
    }

    // Create activity type
    const createData: any = {
      code: body.code,
      name: body.name,
      description: body.description,
      category: body.category || 'general',
      icon: body.icon,
      color: body.color || '#3B82F6',
      is_sensitive: body.is_sensitive || false,
      requires_approval: body.requires_approval || false,
      is_active: true,
      created_by: token.sub,
      created_at: new Date()
    };
    // Assign after regeneration if available
    if ('priority' in prisma.activity_types.fields) {
      createData.priority = typeof body.priority === 'number' ? body.priority : 100;
      createData.weight = typeof body.weight === 'number' ? body.weight : 0;
    }
    const activityType = await prisma.activity_types.create({ data: createData });

    return NextResponse.json({
      success: true,
      data: activityType,
      message: 'Activity type created successfully'
    });

  } catch (error: unknown) {
    console.error('[ACTIVITY TYPES API] Create Error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create activity type',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT: Update activity type
export async function PUT(request: NextRequest) {
  try {
    // Auth check
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token?.role) {
      return NextResponse.json({ 
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Only admin can update activity types
    {
      const roleStr = typeof token.role === 'string' ? token.role : String(token.role || '');
      if (roleStr.toLowerCase() !== 'admin') {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 403 });
      }
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({
        success: false,
        message: 'Activity type ID is required'
      }, { status: 400 });
    }

    // Update activity type
    const updateData: any = {
      code: body.code,
      name: body.name,
      description: body.description,
      category: body.category,
      icon: body.icon,
      color: body.color,
      is_sensitive: body.is_sensitive,
      requires_approval: body.requires_approval,
      is_active: body.is_active,
      updated_by: token.sub,
      updated_at: new Date()
    };
    if ('priority' in prisma.activity_types.fields) {
      if (typeof body.priority === 'number') updateData.priority = body.priority;
      if (typeof body.weight === 'number') updateData.weight = body.weight;
    }
    const activityType = await prisma.activity_types.update({ where: { id: body.id }, data: updateData });

    return NextResponse.json({
      success: true,
      data: activityType,
      message: 'Activity type updated successfully'
    });

  } catch (error: unknown) {
    console.error('[ACTIVITY TYPES API] Update Error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to update activity type',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE: Delete/deactivate activity type
export async function DELETE(request: NextRequest) {
  try {
    // Auth check
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token?.role) {
      return NextResponse.json({ 
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Only admin can delete activity types
    {
      const roleStr = typeof token.role === 'string' ? token.role : String(token.role || '');
      if (roleStr.toLowerCase() !== 'admin') {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 403 });
      }
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({
        success: false,
        message: 'Activity type ID is required'
      }, { status: 400 });
    }

    // Soft delete by updating is_active
    const activityType = await prisma.activity_types.update({
      where: { id: body.id },
      data: {
        is_active: false,
        updated_by: token.sub,  // User ID from token
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: activityType,
      message: 'Activity type deleted successfully'
    });

  } catch (error: unknown) {
    console.error('[ACTIVITY TYPES API] Delete Error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to delete activity type',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}