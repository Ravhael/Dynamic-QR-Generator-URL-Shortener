import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserId, isAdministrator } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 })
    const admin = await isAdministrator(request)
    const body = await request.json()
    const { name, description, color } = body
    if (!name || !description || !color) {
      return NextResponse.json({ _error: 'Name, description, and color are required' }, { status: 400 })
    }
    const existing = await prisma.qr_categories.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ _error: 'Category not found' }, { status: 404 })
    // Non-admin: ensure it's either their own or a non-default (avoid modifying default if not admin)
    if (!admin) {
      if (existing.is_default && existing.user_id !== userId) {
        return NextResponse.json({ _error: 'Access denied' }, { status: 403 })
      }
      if (existing.user_id && existing.user_id !== userId && !existing.is_default) {
        return NextResponse.json({ _error: 'Access denied' }, { status: 403 })
      }
    }
    const updated = await prisma.qr_categories.update({
      where: { id },
      data: { name, description, color, updated_at: new Date() }
    })
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      color: updated.color,
      isDefault: updated.is_default ?? false,
      userId: updated.user_id,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    })
  } catch (e: any) {
    console.error('[QR CATEGORIES API][Prisma] PUT error:', e)
    return NextResponse.json({ _error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 })
    const admin = await isAdministrator(request)
    const existing = await prisma.qr_categories.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ _error: 'Category not found' }, { status: 404 })
    if (existing.is_default) return NextResponse.json({ _error: 'Cannot delete default categories' }, { status: 400 })
    if (!admin && existing.user_id !== userId) return NextResponse.json({ _error: 'Access denied' }, { status: 403 })
    const inUse = await prisma.qr_codes.count({ where: { category_id: id } })
    if (inUse > 0) return NextResponse.json({ _error: 'Cannot delete category in use', usedBy: inUse }, { status: 400 })
    await prisma.qr_categories.delete({ where: { id } })
    return NextResponse.json({ message: 'Category deleted successfully', id })
  } catch (e: any) {
    console.error('[QR CATEGORIES API][Prisma] DELETE error:', e)
    return NextResponse.json({ _error: 'Failed to delete category' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const category = await prisma.qr_categories.findUnique({ where: { id } })
    if (!category) return NextResponse.json({ _error: 'Category not found' }, { status: 404 })
    return NextResponse.json({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      isDefault: category.is_default ?? false,
      userId: category.user_id,
      createdAt: category.created_at,
      updatedAt: category.updated_at
    })
  } catch (e: any) {
    console.error('[QR CATEGORIES API][Prisma] GET error:', e)
    return NextResponse.json({ _error: 'Failed to get category' }, { status: 500 })
  }
}
