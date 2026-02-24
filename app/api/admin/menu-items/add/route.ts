import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidateMenuCache } from '@/lib/menuTree';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received menu item data:', body);
    
    const { 
      name,
      icon,
      path,
      parent_id,
      sort_order,
      is_active 
    } = body;

    // Basic validation
    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Name is required'
      }, { status: 400 });
    }

    // Generate menu_id from name
    const menu_id = name.toLowerCase().replace(/\s+/g, '-');

    // Insert new menu item
    const newMenuItem = await prisma.menu_items.create({
      data: {
        menu_id,
        name,
        icon: icon || null,
        path: path || null,
        parent_id: parent_id || null,
        sort_order: sort_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        is_group: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Revalidate the menu items cache
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/menu-items/refresh`, {
        method: 'POST',
        cache: 'no-store'
      });
    } catch (error) {
      console.error('Failed to revalidate menu items:', error);
    }

    // Invalidate all role menu caches since structure changed
    invalidateMenuCache();
    return NextResponse.json({
      success: true,
      data: newMenuItem,
      message: 'Menu item created successfully (cache invalidated)'
    });

  } catch (error) {
    console.error('Error in POST /api/admin/menu-items/add:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}