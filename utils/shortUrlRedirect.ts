import React from 'react';
// Short URL redirect utility for demo purposes
// In a real application, this would be handled by a backend server

export interface ShortURLRedirect {
  shortCode: string;
  originalUrl: string;
  clicks: number;
  isActive: boolean;
}

// Simulate a short URL redirect service
export const handleShortURLRedirect = (shortCode: string): string | null => {
  try {
    const savedURLs = localStorage.getItem('shortURLs');
    if (!savedURLs) return null;
    
  const shortURLs: any[] = JSON.parse(savedURLs);
  const foundURL = shortURLs.find((url: any) => url?.shortCode === shortCode);
    
    if (foundURL && foundURL.isActive) {
      // Increment click count
      const updatedURLs = shortURLs.map((url: any) => 
        (url?.id === foundURL.id) ? { ...url, clicks: (url.clicks || 0) + 1 } : url
      );
      localStorage.setItem('shortURLs', JSON.stringify(updatedURLs));
      
      return foundURL.originalUrl;
    }
    
    return null;
  } catch (_error) {
    console.error('Error handling short URL redirect:', _error);
    return null;
  }
};

// Create a demo redirect page that can be used for testing
export const createDemoRedirectPage = (shortCode: string): string => {
  const originalUrl = handleShortURLRedirect(shortCode);
  
  if (!originalUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Short URL Not Found</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #ef4444; }
        </style>
      </head>
      <body>
        <h1 class="error">Short URL Not Found</h1>
        <p>The short URL you're looking for doesn't exist or has been deactivated.</p>
      </body>
      </html>
    `;
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Redirecting...</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
      <script>
        setTimeout(function() {
          window.location.href = '${originalUrl}';
        }, 2000);
      </script>
    </head>
    <body>
      <h1>Redirecting...</h1>
      <div class="spinner"></div>
      <p>You will be redirected to: <a href="${originalUrl}">${originalUrl}</a></p>
      <p><small>If you're not redirected automatically, click the link above.</small></p>
    </body>
    </html>
  `;
};
