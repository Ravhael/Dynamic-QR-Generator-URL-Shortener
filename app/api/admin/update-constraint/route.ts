import { NextRequest, NextResponse } from 'next/server';
import { getToken } from "next-auth/jwt";
import getNextAuthToken from '@/lib/getNextAuthToken'
import { PrismaClient } from '@prisma/client';

// Singleton pattern for PrismaClient
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = await getNextAuthToken(request as any);

    if (!token?.role) {
      return NextResponse.json({ 
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Only admin can update system constraints
    const tokenRole = typeof token.role === 'string' ? token.role : String(token.role || '');
    if (tokenRole.toLowerCase() !== 'admin') {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 403 });
    }

    console.warn('[UPDATE CONSTRAINT] Starting database constraint update...');
    
    // Using Prisma's executeRaw for raw SQL operations that Prisma doesn't support directly
    // Drop existing constraint
    await prisma.$executeRaw`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`;
    console.warn('[UPDATE CONSTRAINT] Dropped old constraint');
    
    // Add new constraint that includes all roles
    await prisma.$executeRaw`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('admin', 'editor', 'viewer', 'user'))
    `;
    console.warn('[UPDATE CONSTRAINT] Added new constraint with user role');
    
    // Update default role to 'user'
    await prisma.$executeRaw`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'`;
    console.warn('[UPDATE CONSTRAINT] Updated default role to user');

    // Attempt lightweight logging (console) since no activity_logs table exists in schema
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    const ip = cfConnectingIP || realIP || (forwarded ? forwarded.split(',')[0].trim() : 'unknown');
    console.info('[UPDATE CONSTRAINT] Logged operation', {
      user_id: token.sub,
      action: 'UPDATE_CONSTRAINT',
      ip_address: ip,
      user_agent: request.headers.get('user-agent') || 'unknown',
      status: 'success'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Database constraint updated successfully',
      details: {
        constraint: 'users_role_check now includes: admin, editor, viewer, user',
        default_role: 'user'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        user: token.email
      }
    });
    
  } catch (error: unknown) {
    console.error('[UPDATE CONSTRAINT] Error:', error);

    // Try to log the failure (console-only)
    try {
      const t = await getNextAuthToken(request as any);
      const forwarded = request.headers.get('x-forwarded-for');
      const realIP = request.headers.get('x-real-ip');
      const cfConnectingIP = request.headers.get('cf-connecting-ip');
      const ip = cfConnectingIP || realIP || (forwarded ? forwarded.split(',')[0].trim() : 'unknown');
      console.error('[UPDATE CONSTRAINT] Operation failed', {
        user_id: t?.sub || 'system',
        action: 'UPDATE_CONSTRAINT',
        error: error instanceof Error ? error.message : 'Unknown error',
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || 'unknown',
        status: 'error'
      });
    } catch (logError) {
      console.error('[UPDATE CONSTRAINT] Failed to log error:', logError);
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to update database constraint',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });
  } finally {
    // Only disconnect in development
    if (process.env.NODE_ENV !== 'production') {
      await prisma.$disconnect().catch(console.error);
    }
  }
}