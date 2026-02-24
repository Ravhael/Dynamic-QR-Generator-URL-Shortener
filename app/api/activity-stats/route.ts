import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from "next-auth/jwt";
import { PrismaClient } from '@prisma/client';

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

interface ActivityStats {
  totalActivities: number;
  totalUsers: number;
  activeGroups: number;
  activityBreakdown: {
    [key: string]: number;
  };
  timestamp: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Auth check with more robust token validation
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token?.role) {
      console.warn('[ACTIVITY STATS API] Auth failed:', { 
        token: token ? 'exists' : 'missing',
        role: token?.role 
      });
      
      return NextResponse.json({ 
        success: false,
        message: 'Authentication required',
        error: token ? 'Insufficient permissions' : 'No authentication token'
      }, { 
        status: token ? 403 : 401,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    }



    const stats: ActivityStats = {
      totalActivities: 0,
      totalUsers: 0,
      activeGroups: 0,
      activityBreakdown: {},
      timestamp: new Date().toISOString()
    };

    // Get all required stats in parallel
    const [
      totalActivitiesResult,
      uniqueUsersResult,
      activeGroupsResult,
      activityBreakdownResult
    ] = await Promise.allSettled([
      // Get total activities
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM user_activity ua
        INNER JOIN activity_types at ON ua.activity_type_id = at.id
        WHERE ua.deleted_at IS NULL
        AND at.is_active = true
      `,

      // Get unique active users count
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT ua.user_id) as count
        FROM user_activity ua
        INNER JOIN activity_types at ON ua.activity_type_id = at.id
        INNER JOIN users u ON ua.user_id = u.id
        WHERE ua.deleted_at IS NULL
        AND at.is_active = true
        AND u.deleted_at IS NULL
      `,

      // Get active groups count
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT g.id) as count
        FROM groups g
        INNER JOIN users u ON u.group_id = g.id
        INNER JOIN user_activity ua ON ua.user_id = u.id
        INNER JOIN activity_types at ON ua.activity_type_id = at.id
        WHERE g.deleted_at IS NULL
        AND u.deleted_at IS NULL
        AND ua.deleted_at IS NULL
        AND at.is_active = true
      `,

      // Get activity breakdown by type
      prisma.$queryRaw<Array<{ type: string, count: bigint }>>`
        SELECT at.name as type, COUNT(*) as count
        FROM user_activity ua
        INNER JOIN activity_types at ON ua.activity_type_id = at.id
        WHERE ua.deleted_at IS NULL
        AND at.is_active = true
        GROUP BY at.name
        ORDER BY count DESC
      `
    ]);

    // Process results with error handling
    if (totalActivitiesResult.status === 'fulfilled') {
      stats.totalActivities = Number(totalActivitiesResult.value[0]?.count || 0);
    }

    if (uniqueUsersResult.status === 'fulfilled') {
      stats.totalUsers = Number(uniqueUsersResult.value[0]?.count || 0);
    }

    if (activeGroupsResult.status === 'fulfilled') {
      stats.activeGroups = Number(activeGroupsResult.value[0]?.count || 0);
    }

    if (activityBreakdownResult.status === 'fulfilled') {
      stats.activityBreakdown = activityBreakdownResult.value.reduce((acc, curr) => {
        acc[curr.type] = Number(curr.count);
        return acc;
      }, {} as { [key: string]: number });
    }

    const endTime = Date.now();
    console.log('[ACTIVITY STATS API] Stats retrieved successfully:', {
      ...stats,
      execution_time_ms: endTime - startTime,
      query_timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: stats,
      metadata: {
        execution_time_ms: endTime - startTime,
        query_timestamp: new Date().toISOString()
      },
      message: 'Activity statistics retrieved successfully'
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Content-Type': 'application/json'
      }
    });

  } catch (error: unknown) {
    const endTime = Date.now();
    const errorDetails = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined,
      execution_time_ms: endTime - startTime,
      timestamp: new Date().toISOString()
    };

    console.error('[ACTIVITY STATS API] Error details:', errorDetails);

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: errorDetails.message,
      metadata: {
        execution_time_ms: endTime - startTime,
        error_timestamp: new Date().toISOString()
      }
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