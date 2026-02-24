import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.warn('[URL CATEGORIES API] 🔍 GET URL CATEGORY by ID:', id);
    
    const category = await prisma.url_categories.findUnique({ where: { id } })
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }
    console.warn('[URL CATEGORIES API][PRISMA] ✅ Category found:', category.name);
    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        color: category.color || undefined,
        created_at: category.created_at,
        updated_at: category.updated_at
      }
    });
  } catch (_error: any) {
    console.error('[URL CATEGORIES API] ❌ Get _error:', _error);
    return NextResponse.json(
      { 
        success: false, 
        _error: 'Internal server error', 
        details: _error.message 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, color } = body

    console.warn('[URL CATEGORIES API] 🔧 UPDATE URL CATEGORY:', id, { name });
    
    if (!name) {
      return NextResponse.json(
        { success: false, _error: 'Category name is required' },
        { status: 400 }
      )
    }

    const updated = await prisma.url_categories.update({
      where: { id },
      data: {
        name,
        description: description || null,
        color: color || null,
        updated_at: new Date()
      }
    }).catch(() => null)

    if (!updated) {
      return NextResponse.json(
        { success: false, _error: 'Category not found' },
        { status: 404 }
      )
    }
    console.warn('[URL CATEGORIES API][PRISMA] ✅ Category updated:', updated.name);
    return NextResponse.json({
      success: true,
      category: {
        id: updated.id,
        name: updated.name,
        description: updated.description || undefined,
        color: updated.color || undefined,
        created_at: updated.created_at,
        updated_at: updated.updated_at
      },
      message: 'Category updated successfully'
    });
  } catch (_error: any) {
    console.error('[URL CATEGORIES API] ❌ Update _error:', _error);
    
    if (_error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { success: false, _error: 'Category name already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        _error: 'Failed to update category', 
        details: _error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.warn('[URL CATEGORIES API] 🗑️ DELETE URL CATEGORY:', id);
    
    // Check usage
    const urlCount = await prisma.short_urls.count({ where: { category_id: id } })
    
    if (urlCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          _error: `Cannot delete category. It is being used by ${urlCount} URL(s). Please reassign or delete those URLs first.`
        },
        { status: 409 }
      )
    }
    const deleted = await prisma.url_categories.delete({ where: { id } }).catch(() => null)
    if (!deleted) {
      return NextResponse.json(
        { success: false, _error: 'Category not found' },
        { status: 404 }
      )
    }
    console.warn('[URL CATEGORIES API][PRISMA] ✅ Category deleted:', deleted.name);
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (_error: any) {
    console.error('[URL CATEGORIES API] ❌ Delete _error:', _error);
    return NextResponse.json(
      { 
        success: false, 
        _error: 'Failed to delete category', 
        details: _error.message 
      },
      { status: 500 }
    );
  }
}
