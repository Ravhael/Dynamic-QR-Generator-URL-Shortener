import jsPDF from 'jspdf';

interface ReportData {
  id: string;
  name: string;
  type?: string;
  scans: number;
  clicks?: number; // For short URLs
  created_at: string;
  category_name?: string;
  url?: string;
  content?: string; // For QR codes
  original_url?: string; // For short URLs
  short_code?: string; // For short URLs
}

interface ReportOptions {
  title: string;
  type: string;
  dateRange: string;
  data: ReportData[];
  totalScans: number;
  categoryFilter?: string;
}

export class PDFReportGenerator {
  private doc: jsPDF;
  private margin = 20;
  private pageWidth: number;
  private pageHeight: number;
  private currentY = 20;
  // Design system
  private colors = {
    primary: [79, 70, 229], // indigo-600
    primaryDark: [67, 56, 202], // indigo-700
    headerBg: [63, 81, 181], // indigo legacy
    headerText: [255, 255, 255],
    text: [31, 41, 55], // gray-800
    textMuted: [107, 114, 128], // gray-500
    surface: [255, 255, 255],
    surfaceAlt: [248, 250, 252], // gray-50
    border: [229, 231, 235], // gray-200
  } as const;

  private table = {
    rowHeight: 12,
    headerHeight: 14,
    maxRowsPerPage: 24,
  } as const;

  constructor() {
    // Initialize PDF in landscape orientation
    this.doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  generateReport(options: ReportOptions): Blob {
    this.addHeader(options);
    this.addSummary(options);
    this.addDataTable(options.data, options.type);
    this.addFooter();

    return this.doc.output('blob');
  }

  private addHeader(options: ReportOptions) {
    // Header background
    this.doc.setFillColor(...this.colors.primary);
    this.doc.rect(0, 0, this.pageWidth, 44, 'F');

    // Title
    this.doc.setTextColor(...this.colors.headerText);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    const brand = 'SCANLY ANALYTICS';
    const brandWidth = this.doc.getTextWidth(brand);
    this.doc.text(brand, this.margin, 20);

    // Subtitle
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(14);
    this.doc.text(options.title, this.margin, 33);

    // Meta info (right side)
    const currentDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    this.doc.setFontSize(10);
    const rightX = this.pageWidth - this.margin - 1;
    this.doc.text(`Generated: ${currentDate}`, rightX, 16, { align: 'right' as any });
    this.doc.text(`Report: ${options.type}`, rightX, 26, { align: 'right' as any });
    this.doc.text(`Period: ${options.dateRange}`, rightX, 36, { align: 'right' as any });

    this.currentY = 58;
  }

  private addSummary(options: ReportOptions) {
    const totalItems = options.data.length;
    const totalActivity = options.type === 'QR Codes'
      ? options.data.reduce((sum, item) => sum + (item.scans || 0), 0)
      : options.data.reduce((sum, item) => sum + (item.clicks || item.scans || 0), 0);
    const avgActivity = totalItems > 0 ? Math.round(totalActivity / totalItems) : 0;
    const activeItems = options.type === 'QR Codes'
      ? options.data.filter(item => (item.scans || 0) > 0).length
      : options.data.filter(item => (item.clicks || item.scans || 0) > 0).length;
    const performanceRate = totalItems > 0 ? Math.round((activeItems / totalItems) * 100) : 0;
    const activityLabel = options.type === 'QR Codes' ? 'Scans' : 'Clicks';

    // Section title
    this.doc.setTextColor(...this.colors.text);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text('Executive Summary', this.margin, this.currentY);
    this.currentY += 4;

    // Stat cards
    const cardW = (this.pageWidth - 2 * this.margin - 18) / 4; // 6px gaps
    const cardH = 30;
    const startY = this.currentY + 6;
    const labels = [
      `Total ${options.type}`,
      `Total ${activityLabel}`,
      'Average per Item',
      'Active Items'
    ];
    const values = [
      totalItems.toLocaleString(),
      totalActivity.toLocaleString(),
      String(avgActivity),
      `${activeItems} (${performanceRate}%)`
    ];

    for (let i = 0; i < 4; i++) {
      const x = this.margin + i * (cardW + 6);
      // card background
      this.doc.setFillColor(...this.colors.surfaceAlt);
      this.doc.setDrawColor(...this.colors.border);
      this.doc.roundedRect(x, startY, cardW, cardH, 3, 3, 'FD');
      // label
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...this.colors.textMuted);
      this.doc.setFontSize(9);
      this.doc.text(labels[i], x + 6, startY + 11);
      // value
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.colors.text);
      this.doc.setFontSize(13);
      this.doc.text(values[i], x + 6, startY + 23);
    }

    // Filters line under cards
    this.currentY = startY + cardH + 10;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.colors.textMuted);
    this.doc.setFontSize(9);
    const filters = `Period: ${options.dateRange}` + (options.categoryFilter ? `    |    Category: ${options.categoryFilter}` : '');
    this.doc.text(filters, this.margin, this.currentY);
    this.currentY += 10;
  }

  private addDataTable(data: ReportData[], type: string) {
    const tableWidth = this.pageWidth - 2 * this.margin;
    // Column widths (percentages summing to 1)
    const cols = type === 'QR Codes'
      ? [0.18, 0.48, 0.16, 0.08, 0.10] // Name, Content/URL, Category, Scans, Created
      : [0.20, 0.46, 0.16, 0.08, 0.10]; // Name, Original URL, Category, Clicks, Created
    const colX = [this.margin];
    for (let i = 0; i < cols.length; i++) {
      if (i > 0) colX[i] = colX[i - 1] + cols[i - 1] * tableWidth;
    }
    const colW = cols.map(p => p * tableWidth);

    const drawHeader = () => {
      this.doc.setFillColor(...this.colors.primaryDark);
      this.doc.rect(this.margin, this.currentY, tableWidth, this.table.headerHeight, 'F');
      this.doc.setTextColor(...this.colors.headerText);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10.5);
      const labels = type === 'QR Codes'
        ? ['QR Name', 'Content/URL', 'Category', 'Scans', 'Created']
        : ['URL Name', 'Original URL', 'Category', 'Clicks', 'Created'];
      const baseline = this.currentY + this.table.headerHeight - 4;
      for (let i = 0; i < labels.length; i++) {
        this.doc.text(labels[i], colX[i] + 4, baseline);
      }
      this.currentY += this.table.headerHeight + 4;
      // Set default text styles for rows
      this.doc.setTextColor(...this.colors.text);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
    };

    const addPageIfNeeded = (neededHeight: number) => {
      if (this.currentY + neededHeight > this.pageHeight - 25) {
        this.doc.addPage();
        this.currentY = 20;
        drawHeader();
      }
    };

    drawHeader();

    const rows = data.slice(0, 100); // Allow up to 100 rows
    rows.forEach((item, idx) => {
      // Determine wrap-aware cell contents
      const name = item.name || 'N/A';
      const category = item.category_name || 'Uncategorized';
      const created = new Date(item.created_at).toLocaleDateString('id-ID');
      const activity = type === 'QR Codes' ? (item.scans || 0) : (item.clicks || item.scans || 0);
      const urlOrContent = type === 'QR Codes' ? (item.content || item.url || 'N/A') : (item.original_url || item.url || 'N/A');

      const linesName = this.doc.splitTextToSize(name, colW[0] - 8);
      const linesUrl = this.doc.splitTextToSize(urlOrContent, colW[1] - 8);
      const linesCat = this.doc.splitTextToSize(category, colW[2] - 8);
      const linesAct = this.doc.splitTextToSize(String(activity), colW[3] - 8);
      const linesCreated = this.doc.splitTextToSize(created, colW[4] - 8);
      const maxLines = Math.max(linesName.length, linesUrl.length, linesCat.length, linesAct.length, linesCreated.length);
      const rowHeight = Math.max(this.table.rowHeight, maxLines * 5 + 6);

      addPageIfNeeded(rowHeight + 2);

      // Zebra stripe
      if (idx % 2 === 0) {
        this.doc.setFillColor(...this.colors.surfaceAlt);
        this.doc.rect(this.margin, this.currentY - 2, tableWidth, rowHeight, 'F');
      }

      // Draw cell texts
      let baseline = this.currentY + 5;
      this.doc.text(linesName, colX[0] + 4, baseline);
      this.doc.text(linesUrl, colX[1] + 4, baseline);
      this.doc.text(linesCat, colX[2] + 4, baseline);
      this.doc.text(linesAct, colX[3] + 4, baseline);
      this.doc.text(linesCreated, colX[4] + 4, baseline);

      // Optional row separator line
      this.doc.setDrawColor(...this.colors.border);
      this.doc.line(this.margin, this.currentY + rowHeight, this.margin + tableWidth, this.currentY + rowHeight);

      this.currentY += rowHeight + 2;
    });

    // Truncation note
    if (data.length > rows.length) {
      addPageIfNeeded(10);
      this.doc.setFontSize(9);
      this.doc.setTextColor(...this.colors.textMuted);
      this.doc.text(`Note: Showing top ${rows.length} items. Full dataset contains ${data.length} items.`, this.margin, this.currentY + 6);
      this.currentY += 12;
    }
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setDrawColor(...this.colors.border);
      this.doc.line(this.margin, this.pageHeight - 20, this.pageWidth - this.margin, this.pageHeight - 20);
      
      // Footer text
      this.doc.setFontSize(8);
      this.doc.setTextColor(...this.colors.textMuted);
      this.doc.text('Generated by Scanly Analytics Platform', this.margin, this.pageHeight - 10);
      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth - 40, this.pageHeight - 10);
      
      // Contact/website info
      this.doc.text('For support: support@scanly.com', this.pageWidth / 2 - 30, this.pageHeight - 10);
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
