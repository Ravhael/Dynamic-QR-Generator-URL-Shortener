import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth'
import { upsertSingleSetting } from '@/lib/services/systemSettingsService'
import path from 'path'
import { promises as fs } from 'fs'
import sharp from 'sharp'
// @ts-ignore - no types
import pngToIco from 'png-to-ico'

export const runtime = 'nodejs'

// Config
const MAX_SIZE = 1024 * 1024 // 1MB
const MAX_HEIGHT = 128 // px for stored primary logo (resized if larger for consistency)
const HARD_REJECT_HEIGHT = 2048 // if absurdly large, reject early
const ALLOWED = ['image/png','image/svg+xml','image/jpeg','image/webp']
const FAVICON_SIZES = [16,32,48]

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req).catch(() => null)
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ success: false, error: 'File field "file" required' }, { status: 400 })

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Unsupported file type' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'File too large (max 1MB)' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'branding')
    await fs.mkdir(uploadDir, { recursive: true })
    const safeNameBase = 'logo'
    const ext = file.type === 'image/svg+xml' ? '.svg' : (file.type === 'image/png' ? '.png' : (file.type === 'image/webp' ? '.webp' : '.jpg'))
    const fileName = `${safeNameBase}${ext}`
    const fullPath = path.join(uploadDir, fileName)

    let finalPublicPath: string
    let rasterForFavicon: Buffer | null = null

    if (file.type === 'image/svg+xml') {
      // Basic dimension check (rough) & store as-is, then rasterize via sharp from SVG buffer
      const svgContent = bytes.toString('utf8')
      // Quick height extraction if present
      const heightMatch = svgContent.match(/height="(\d+)(px)?"/i)
      if (heightMatch) {
        const h = parseInt(heightMatch[1], 10)
        if (h > HARD_REJECT_HEIGHT) {
          return NextResponse.json({ success: false, error: 'SVG height too large' }, { status: 400 })
        }
      }
      await fs.writeFile(fullPath, bytes)
      // Rasterize to PNG (max height rule applied)
      let png = await sharp(bytes).png().toBuffer()
      const meta = await sharp(png).metadata()
      if ((meta.height || 0) > MAX_HEIGHT) {
        png = await sharp(png).resize({ height: MAX_HEIGHT }).png().toBuffer()
      }
      rasterForFavicon = png
    } else {
      // Raster handling
      const image = sharp(bytes)
      const meta = await image.metadata()
      if ((meta.height || 0) > HARD_REJECT_HEIGHT) {
        return NextResponse.json({ success: false, error: 'Image height too large' }, { status: 400 })
      }
      let pipeline = image
      if ((meta.height || 0) > MAX_HEIGHT) {
        pipeline = image.resize({ height: MAX_HEIGHT })
      }
      const optimized = await pipeline.toBuffer()
      await fs.writeFile(fullPath, optimized)
      rasterForFavicon = optimized
    }

    // Generate favicons if we have a raster buffer
    if (rasterForFavicon) {
      const faviconDir = path.join(process.cwd(), 'public')
      const generatedPngs: string[] = []
      const pngBuffers: Buffer[] = []
      for (const size of FAVICON_SIZES) {
        const resized = await sharp(rasterForFavicon).resize(size, size, { fit: 'contain', background: { r: 0, g:0, b:0, alpha:0 } }).png().toBuffer()
        const outName = `icon-${size}.png`
        await fs.writeFile(path.join(faviconDir, outName), resized)
        generatedPngs.push(outName)
        if (size <= 48) pngBuffers.push(resized)
      }
      try {
        const ico = await pngToIco(pngBuffers)
        await fs.writeFile(path.join(faviconDir, 'favicon.ico'), ico)
      } catch (e) {
        console.warn('[BRANDING][FAVICON] failed generating ico', e)
      }
    }

    finalPublicPath = `/uploads/branding/${fileName}?v=${Date.now()}`
    await upsertSingleSetting({ category: 'branding', settingKey: 'logo', value: finalPublicPath, userId })

    return NextResponse.json({ success: true, path: finalPublicPath, favicon: true, maxHeight: MAX_HEIGHT })
  } catch (e) {
    console.error('[BRANDING][LOGO][POST] error', e)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
