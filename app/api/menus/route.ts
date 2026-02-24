import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import getNextAuthToken from '@/lib/getNextAuthToken';
import { getMenuTreeForRole } from '@/lib/menuTree';

export async function GET(request: Request) {
  try {
    console.log('Fetching menus...');
  const token = await getNextAuthToken(request as any);
    
    if (!token) {
      console.log('No token found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Token:', token);

    const menuTree = await getMenuTreeForRole({ roleName: token.role as string });
    return NextResponse.json({ menus: menuTree });
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json({ error: 'Failed to fetch menus' }, { status: 500 });
  } finally {
    // Jangan disconnect prisma global setiap request (biarkan connection pool dikelola otomatis)
  }
}