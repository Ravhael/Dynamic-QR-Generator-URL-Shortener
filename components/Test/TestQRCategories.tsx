import React, { useEffect, useState } from 'react';
import { qrCategoryService } from '@/lib/api';

export const TestQRCategories: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown>>(null);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.warn('🧪 TestQRCategories: Component mounted');
    
    const testAPI = async () => {
      try {
        console.warn('🧪 TestQRCategories: Testing qrCategoryService...');
        console.warn('🧪 TestQRCategories: qrCategoryService object:', qrCategoryService);
        console.warn('🧪 TestQRCategories: getQRCategories method:', qrCategoryService.getQRCategories);
        
        const result = await qrCategoryService.getQRCategories();
        console.warn('🧪 TestQRCategories: Success:', result);
        setResult(result);
      } catch (_err) {
        console.error('🧪 TestQRCategories: Error:', _err);
        setError(_err instanceof Error ? _err.message : 'Unknown error');
      }
    };

    testAPI();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">QR Categories Test</h1>
      
      {_error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {_error}
        </div>
      )}
      
      {result ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          <h2 className="font-semibold mb-2">Success!</h2>
          <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          Loading...
        </div>
      )}
    </div>
  );
};
