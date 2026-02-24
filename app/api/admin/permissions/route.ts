import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all menu permissions from database
    const result = await query(`
      SELECT 
        mp.id,
        mp.menu_id,
        mp.menu_name as name,
        mp.menu_description as description,
        'General' as category,
        mp.is_active,
        mp.created_at,
        mp.updated_at
      FROM menu_permissions mp
      WHERE mp.is_active = true
      ORDER BY mp.menu_name
    `);

    // Group permissions by category
    const permissionsByCategory: { [category: string]: any[] } = {};
    
    result.rows.forEach((permission: any) => {
      const category = 'General'; // Since we don't have category column
      if (!permissionsByCategory[category]) {
        permissionsByCategory[category] = [];
      }
      
      permissionsByCategory[category].push({
        id: permission.id,
        menuId: permission.menu_id,
        name: permission.name,
        description: permission.description
      });
    });

    // Convert to array format expected by frontend
    const permissions = Object.entries(permissionsByCategory).map(([category, perms]) => ({
      category,
      permissions: perms
    }));

    return NextResponse.json({
      success: true,
      permissions,
      total: result.rows.length,
      message: 'Permissions retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching permissions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch permissions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { menuId, name, description, category } = body;
    
    // Validate required fields
    if (!menuId || !name) {
      return NextResponse.json(
        { success: false, error: 'Menu ID and name are required' },
        { status: 400 }
      );
    }

    // Insert new permission
    const result = await query(`
      INSERT INTO menu_permissions (menu_id, menu_name, menu_description, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING *
    `, [menuId, name, description || null]);

    return NextResponse.json({
      success: true,
      permission: result.rows[0],
      message: 'Permission created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating permission:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create permission',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}