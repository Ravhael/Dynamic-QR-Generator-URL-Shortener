import QRCode from 'qrcode';

interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
}

// Generate a real QR code that can be scanned by smartphones
export const generateQRCode = async (content: string, type: string, customOptions?: QRCodeOptions): Promise<string> => {
  try {
    // QR code generation options
    const options = {
      errorCorrectionLevel: customOptions?.errorCorrectionLevel || 'M',
      type: 'image/png' as const,
      quality: 0.92,
      margin: customOptions?.margin || 4,
      color: {
        dark: customOptions?.color?.dark || '#000000',
        light: customOptions?.color?.light || '#FFFFFF'
      },
      width: customOptions?.width || 256
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(content, options);
    return qrCodeDataURL;
  } catch (_error) {
    console.error('Error generating QR code:', _error);
    throw new Error('Failed to generate QR code');
  }
};

// Generate QR code synchronously for immediate display
export const generateQRCodeSync = (content: string): string => {
  // This is a fallback - we'll update the component to use async version
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    canvas.width = 256;
    canvas.height = 256;
    
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add loading text
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Generating QR Code...', 128, 128);
    
    return canvas.toDataURL();
  } catch (_error) {
    console.error('Error generating placeholder:', _error);
    return '';
  }
};

export const downloadQRCode = (qrCodeData: string, filename: string) => {
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = qrCodeData;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Validate QR code content based on type
export const validateQRContent = (content: string, type: string): boolean => {
  switch (type) {
    case 'url':
      try {
        new URL(content);
        return true;
      } catch {
        return false;
      }
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(content.replace('mailto:', '').split('?')[0]);
    case 'phone':
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(content.replace('tel:', ''));
    case 'text':
      return content.length > 0;
    case 'wifi':
      return content.startsWith('WIFI:');
    case 'location':
      return content.startsWith('geo:');
    default:
      return content.length > 0;
  }
};
