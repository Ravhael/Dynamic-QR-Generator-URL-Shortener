import apiClient from './apiClient';

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  format?: 'pdf' | 'csv';
}

class ReportService {
  // Generate QR code report
  public async generateQRCodeReport(params: ReportParams = {}): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.format) queryParams.append('format', params.format);
    
    const url = `/reports/qr-codes?${queryParams.toString()}`;
    
    const response = await apiClient.getBlob(url);
    
    return response;
  }

  // Generate short URL report
  public async generateShortURLReport(params: ReportParams = {}): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.format) queryParams.append('format', params.format);
    
    const url = `/reports/short-urls?${queryParams.toString()}`;
    
    const response = await apiClient.getBlob(url);
    
    return response;
  }

  // Helper method to download a blob as a file
  public downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

const instance = new ReportService();

export default instance