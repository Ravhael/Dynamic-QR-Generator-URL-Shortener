import { NextResponse } from "next/server";
import { getMenuTreeForRole } from "@/lib/menuTree";
import { getToken } from "next-auth/jwt";
import getNextAuthToken from '@/lib/getNextAuthToken';

export async function GET(request: Request) {
  console.info('🔄 Processing menu structure request...');
  
  const token = await getNextAuthToken(request as any);
  
  if (!token) {
    console.warn('🚫 No auth token found');
    return NextResponse.json({ menus: [], error: 'Unauthorized' }, { status: 401 });
  }

  // Debug token contents
  console.info('🎫 Auth token:', {
    id: token.id,
    role: token.role,
    email: token.email,
    name: token.name,
    sub: token.sub,
    iat: token.iat,
    exp: token.exp,
    jti: token.jti
  });

  if (!token.role) {
    console.error('❌ No role found in token');
    return NextResponse.json({ menus: [], error: 'No role specified' }, { status: 403 });
  }

  console.info('👤 User role:', token.role);

  try {
    const menuTree = await getMenuTreeForRole({ roleName: token.role as string });

  console.info('✅ Generated menu tree (shared builder):', JSON.stringify(menuTree, null, 2));

    if (menuTree.length === 0) console.warn('⚠️ No accessible menus found in tree (after filtering/fallback)');

    return NextResponse.json({ menus: menuTree });
  } catch (error) {
    console.error('❌ Error fetching menus:', error);
    return NextResponse.json({ 
      menus: [], 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}