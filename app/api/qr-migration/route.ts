import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import QRCode from 'qrcode'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { loadSystemConfig } from '@/lib/systemConfig'

export async function POST(request: NextRequest) {
  try {
    console.warn('[QR MIGRATION API] 🔥 Starting QR migration process...');
    
    // Get authenticated user ID
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }
    
    const contentType = request.headers.get('content-type') || '';
    let description = '';
    let key = '';
    let name = '';
    let categoryId = '';
    let redirectUrl = '';
    let urlUpdate = '';
    let qrImage: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formData = await request.formData()
      
      description = formData.get('description')?.toString() || ''
      key = formData.get('key')?.toString() || ''
      name = formData.get('name')?.toString() || ''
      categoryId = formData.get('categoryId')?.toString() || ''
      redirectUrl = formData.get('redirect_url')?.toString() || ''
      urlUpdate = formData.get('url_update')?.toString() || ''
      qrImage = formData.get('qr_image') as File | null

    } else {
      // Handle JSON data (without file upload)
      const body = await request.json()
      
      description = body.description || ''
      key = body.key || ''
      name = body.name || ''
      categoryId = body.categoryId || ''
      redirectUrl = body.redirect_url || ''
      urlUpdate = body.url_update || ''
      qrImage = null
    }

    console.warn('[QR MIGRATION API] 📦 Processing migration:', {
      description,
      key,
      name,
      categoryId,
      redirectUrl,
      urlUpdate,
      hasImage: !!qrImage
    })

    // Validate required fields (categoryId tidak perlu karena otomatis "Migration QR Code")
    if (!key || !name || !redirectUrl) {
      console.warn('[QR MIGRATION API] ❌ Validation failed - missing required fields');
      return NextResponse.json(
        { _error: 'Key, name, dan redirect URL wajib diisi' },
        { status: 400 }
      )
    }

    // Validate QR image if provided (dynamic limits)
    if (qrImage) {
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif']
      if (!allowedTypes.includes(qrImage.type)) {
        return NextResponse.json(
          { _error: 'Format gambar tidak didukung. Gunakan PNG, JPG, JPEG, atau GIF.' },
          { status: 400 }
        )
      }

      // Load config for dynamic size limit
      const cfg = await loadSystemConfig();
      const maxSize = cfg.maxUploadSizeBytes;
      if (qrImage.size > maxSize) {
        const mb = (maxSize / (1024 * 1024)).toFixed(2);
        return NextResponse.json(
          { _error: `Ukuran gambar terlalu besar. Maksimal ${mb}MB.` },
          { status: 400 }
        )
      }
    }

    // ✅ Clean database operations using shared query function
    console.warn('[QR MIGRATION API][Prisma] Ensuring Migration QR Code category exists...')
    let migrationCategory = await prisma.qr_categories.findFirst({ where: { name: 'Migration QR Code' } });
    if (!migrationCategory) {
      migrationCategory = await prisma.qr_categories.create({
        data: {
          name: 'Migration QR Code',
          description: 'Category for migrated QR codes',
          color: '#3B82F6',
          is_default: true,
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.warn('[QR MIGRATION API][Prisma] ✅ Category created:', migrationCategory.id);
    } else {
      console.warn('[QR MIGRATION API][Prisma] ✅ Category existing:', migrationCategory.id);
    }
    const migrationCategoryId = migrationCategory.id;
    
    // ✅ Clean user authentication
    console.warn('[QR MIGRATION API] ✅ Using authenticated user ID:', userId)
      
    // Cek duplikasi key (per user)
    const existingKey = await prisma.qr_migration.findFirst({ where: { key, user_id: userId } });
    if (existingKey) {
      return NextResponse.json({ _error: 'Key sudah digunakan untuk QR Migration lain.' }, { status: 409 });
    }

    console.warn('[QR MIGRATION API][Prisma] Inserting migration record...');
    const now = new Date();
    const migrationRecord = await prisma.qr_migration.create({
      data: {
        description,
        name,
        category_id: migrationCategoryId,
        user_id: userId,
        key,
        redirect_url: redirectUrl,
        url_update: urlUpdate,
        qr_image: qrImage ? qrImage.name : null,
        status: 'active',
        scans: 0,
        created_at: now,
        updated_at: now
      }
    });
    const migrationId = migrationRecord.id;
    console.warn('[QR MIGRATION API][Prisma] ✅ Migration record created:', migrationId);

    // Create placeholder qr_codes (so scan_events relation resolves). It will be minimal.
    try {
      await prisma.qr_codes.create({
        data: {
          id: migrationId, // force same id for simplified linkage
          name,
          // reusing same category & user
          category_id: migrationCategoryId,
          user_id: userId,
          type: 'dynamic',
          is_dynamic: true,
          content: redirectUrl,
          qr_code_data: redirectUrl,
          is_active: true,
          scans: 0,
          created_at: now,
          updated_at: now
        }
      });
      console.warn('[QR MIGRATION API][Prisma] ✅ Placeholder qr_codes created with same id');
    } catch (placeholderErr) {
      console.warn('[QR MIGRATION API][Prisma] ⚠️ Failed to create placeholder qr_codes (may already exist):', placeholderErr);
    }

      // ✅ NO INITIAL SCAN EVENTS - Let real usage create events organically
      // Removed hardcoded initial scan event creation

      // ✅ NO INITIAL ANALYTICS ENTRIES - Let real usage create analytics organically  
      // Removed hardcoded initial analytics creation

      // ✅ Generate QR Code image setelah data tersimpan
      console.warn('[QR MIGRATION API] 🔄 Generating QR Code image...');
      
      try {
        // URL yang akan di-encode ke QR Code (URL redirect)
        const qrUrl = redirectUrl;
        
        // Generate QR Code as base64 string
        const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          width: 256
        });

        // Extract base64 data (remove data:image/png;base64, prefix)
        const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
        
        // Create directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'qr-codes');
        await mkdir(uploadsDir, { recursive: true });
        
        // Save QR Code image to file
        const fileName = `migration-${migrationId}.png`;
        const filePath = path.join(uploadsDir, fileName);
        await writeFile(filePath, base64Data, 'base64');
        
        // ✅ Update qr_migration table dengan path gambar
        await prisma.qr_migration.update({ where: { id: migrationId }, data: { qr_image: `/uploads/qr-codes/${fileName}` } });

        console.warn('[QR MIGRATION API] ✅ QR Code image generated:', fileName)
        
      } catch (qrError) {
        console.warn('[QR MIGRATION API] ⚠️ QR Code generation failed:', qrError)
        // Don't fail the whole process if QR generation fails
      }

      // Ambil record final setelah kemungkinan update gambar
      const finalRecord = await prisma.qr_migration.findUnique({ where: { id: migrationId } });
      const responseData = {
        id: finalRecord?.id,
        migrationId: migrationId,
        description: finalRecord?.description,
        key: finalRecord?.key,
        name: finalRecord?.name,
        categoryId: finalRecord?.category_id,
        categoryName: 'Migration QR Code',
        redirectUrl: finalRecord?.redirect_url,
        urlUpdate: finalRecord?.url_update,
        imageUploaded: !!qrImage,
        imageName: qrImage?.name || null,
        imageSize: qrImage?.size || 0,
        status: finalRecord?.status,
        scans: finalRecord?.scans,
        createdAt: finalRecord?.created_at,
        updatedAt: finalRecord?.updated_at,
        qrCodeImage: `/uploads/qr-codes/migration-${migrationId}.png`,
        qrCodeImagePath: `/uploads/qr-codes/migration-${migrationId}.png`
      };

      console.warn('[QR MIGRATION API] ✅ Migration successful:', responseData)

      return NextResponse.json({
        success: true,
        message: 'QR Code berhasil dimigrasi ke kategori Migration QR Code!',
        data: responseData
      }, {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      })

  } catch (_error) {
    console.error('[QR MIGRATION API] ❌ Error:', _error)
    return NextResponse.json(
      { 
        error: 'Gagal memproses migrasi QR Code',
        details: _error instanceof Error ? _error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  try {
    console.warn('[QR MIGRATION API][Prisma] 🔍 Fetching migrated QR codes...');
    const records = await prisma.qr_migration.findMany({
      include: { qr_categories: true, users: true },
      orderBy: { created_at: 'desc' },
      take: 50
    });
    const migratedQRs = records.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      key: r.key,
      redirectUrl: r.redirect_url,
      urlUpdate: r.url_update,
      status: r.status,
      scans: r.scans,
      qrImage: r.qr_image,
      categoryId: r.category_id,
      categoryName: r.qr_categories?.name || null,
      categoryColor: r.qr_categories?.color || null,
      userId: r.user_id,
      userName: r.users?.name || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    console.warn(`[QR MIGRATION API][Prisma] ✅ Found ${migratedQRs.length} migrated QR codes`);
    return NextResponse.json({ success: true, data: migratedQRs, total: migratedQRs.length }, { status: 200 });
  } catch (_error) {
    console.error('[QR MIGRATION API][Prisma] ❌ Error:', _error);
    return NextResponse.json({ error: 'Gagal mengambil data migrasi QR Code', details: _error instanceof Error ? _error.message : 'Unknown error' }, { status: 500 });
  }
}
