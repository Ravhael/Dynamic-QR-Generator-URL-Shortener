import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, isAdministrator } from '@/lib/auth';
import { PDFReportGenerator } from '@/lib/pdfGenerator';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/ensurePermission';
import { getUserFromRequest } from '@/lib/api-permissions';

interface ReportData {
  id: string;
  name: string;
  type?: string;
  scans: number;
  created_at: string;
  category_name?: string;
  url?: string;
  content?: string;
}

// Generate CSV content
function generateCSVContent(data: ReportData[], type: string): string {
  const headers = type === 'qr-codes' 
    ? ['Name', 'Type', 'Content', 'Category', 'Scans', 'Created Date']
    : ['Name', 'URL', 'Category', 'Scans', 'Created Date'];
    
  const csvRows = [headers.join(',')];
  
  data.forEach(item => {
    const row = type === 'qr-codes' 
      ? [
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.type || '').replace(/"/g, '""')}"`, 
          `"${(item.content || '').replace(/"/g, '""')}"`,
          `"${(item.category_name || '').replace(/"/g, '""')}"`,
          item.scans || 0,
          `"${new Date(item.created_at).toLocaleDateString()}"`
        ]
      : [
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.url || '').replace(/"/g, '""')}"`,
          `"${(item.category_name || '').replace(/"/g, '""')}"`,
          item.scans || 0,
          `"${new Date(item.created_at).toLocaleDateString()}"`
        ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

export const POST = withPermission({ resource: 'analytics', action: 'export' }, async (request: NextRequest) => {
  try {
    // Authentication
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isAdministrator(request);
    const body = await request.json();
    const { startDate, endDate, categoryId, format, type } = body;

    console.log('[REPORTS GENERATE] ✅ Generating report (Prisma):', { startDate, endDate, categoryId, format, type, userId, isAdmin });

    if (!type || !['qr-codes', 'short-urls'].includes(type)) {
      console.error('[REPORTS GENERATE] ❌ Invalid type:', type);
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    const REPORT_LIMIT = parseInt(process.env.REPORT_MAX_RECORDS || '10000');

    // Build date filter
    const dateFilter = (startDate || endDate)
      ? {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate + 'T23:59:59') : undefined
        }
      : undefined;

    // Common where fragments
    const userFilter = !isAdmin ? { user_id: userId } : {};
    const categoryFilter = (categoryId && categoryId !== 'all') ? { category_id: categoryId } : {};

    let data: any[] = [];

    if (type === 'qr-codes') {
      console.log('[REPORTS GENERATE] � Fetching QR Codes data via Prisma...');
      const qrCodes = await prisma.qr_codes.findMany({
        where: {
          ...userFilter,
          ...categoryFilter,
          created_at: dateFilter,
        },
        include: {
          qr_categories: { select: { name: true } }
        },
        orderBy: { created_at: 'desc' },
        take: REPORT_LIMIT
      });

      data = qrCodes.map(q => ({
        id: q.id,
        name: q.name,
        type: q.type,
        content: q.content,
        scans: q.scans ?? 0,
        created_at: q.created_at as any, // retain Date for later formatting
        category_name: q.qr_categories?.name || ''
      }));
    } else if (type === 'short-urls') {
      console.log('[REPORTS GENERATE] 🔗 Fetching Short URLs data via Prisma...');
      const shortUrls = await prisma.short_urls.findMany({
        where: {
          ...userFilter,
          ...categoryFilter,
          created_at: dateFilter,
        },
        include: {
          url_categories: { select: { name: true } }
        },
        orderBy: { created_at: 'desc' },
        take: REPORT_LIMIT
      });

      data = shortUrls.map(s => ({
        id: s.id,
        name: s.title,
        url: s.original_url,
        scans: s.clicks ?? 0,
        created_at: s.created_at as any,
        category_name: s.url_categories?.name || ''
      }));
    }

    console.log(`[REPORTS GENERATE] ✅ Found ${data.length} records for ${type} report (Prisma)`);

    if (data.length > 0) {
      console.log('[REPORTS GENERATE] 📄 Sample data (Prisma):', {
        type,
        firstRecord: data[0],
        fieldsPresent: Object.keys(data[0]),
        hasCorrectFields: type === 'qr-codes'
          ? ('content' in data[0] && 'scans' in data[0])
          : ('url' in data[0] && 'scans' in data[0])
      });
    }

    const fileName = `${type}-report-${new Date().toISOString().split('T')[0]}.${format}`;
    const dateRange = startDate && endDate ? `${startDate} to ${endDate}` : 'All Time';
    const totalScans = data.reduce((sum, item) => sum + (item.scans || 0), 0);

    // Normalize created_at to ISO string for downstream serialization (keeping local formatting when building CSV)
    const normalizedData = data.map(d => ({ ...d, created_at: d.created_at instanceof Date ? d.created_at.toISOString() : d.created_at }));

    switch (format) {
      case 'pdf': {
        const pdfGenerator = new PDFReportGenerator();
        const reportTitle = type === 'qr-codes' ? 'QR Code Analytics Report' : 'Short URL Analytics Report';
        const reportType = type === 'qr-codes' ? 'QR Codes' : 'Short URLs';
        console.log(`[REPORTS GENERATE] 📄 Generating PDF for type: ${reportType} (Prisma)`);
        const pdfBlob = pdfGenerator.generateReport({
          title: reportTitle,
          type: reportType,
            dateRange,
          data: data, // keep original structure (with Date) for any formatting in generator
          totalScans,
          categoryFilter: categoryId && categoryId !== 'all' ? categoryId : undefined
        });
        const pdfBuffer = await pdfBlob.arrayBuffer();
        console.log(`[REPORTS GENERATE] ✅ Generated PDF report with ${pdfBuffer.byteLength} bytes (Prisma)`);
        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': pdfBuffer.byteLength.toString()
          }
        });
      }
      case 'csv': {
        const csvContent = generateCSVContent(data as any, type);
        console.log(`[REPORTS GENERATE] ✅ Generated CSV report with ${csvContent.length} characters (Prisma)`);
        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': csvContent.length.toString()
          }
        });
      }
      default: {
        const defaultContent = generateCSVContent(data as any, type);
        return new NextResponse(defaultContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${fileName.replace('.', '-default.')}"`,
            'Content-Length': defaultContent.length.toString()
          }
        });
      }
    }
  } catch (error: any) {
    console.error('[REPORTS GENERATE] ❌ ERROR (Prisma):', error);
    return NextResponse.json({ error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
})
