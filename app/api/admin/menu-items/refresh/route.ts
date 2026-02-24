import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST() {
  try {
    // Revalidate the menu-items cache
    revalidateTag('menu-items');
    
    return NextResponse.json({
      success: true,
      message: 'Menu items cache revalidated'
    });
  } catch (error) {
    console.error('Error revalidating menu items:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to revalidate menu items'
    }, { status: 500 });
  }
}