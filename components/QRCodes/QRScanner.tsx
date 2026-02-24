"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { trackQRScan } from '../../utils/enhancedQRTracker';
import { Camera, X, CheckCircle, AlertCircle, Wifi, Globe, Mail, Phone, MessageSquare } from 'lucide-react';

interface QRScannerProps {
  onScanResult?: (result: string) => void;
  onClose?: () => void;
  className?: string;
}

interface ScanResult {
  id: string;
  text: string;
  type: 'url' | 'wifi' | 'email' | 'phone' | 'text' | 'unknown';
  timestamp: string;
  processed: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ 
  onScanResult, 
  onClose,
  className = '' 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [_error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);

  // Check camera permission
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setPermissionGranted(true);
        } else {
          setPermissionGranted(false);
          setError('Camera not supported in this browser');
        }
      } catch (_err) {
        setPermissionGranted(false);
        setError('Camera permission denied');
      }
    };

    checkCameraPermission();
  }, []);

  // Detect QR code type
  const detectQRType = (text: string): ScanResult['type'] => {
    // URL detection
    if (text.match(/^https?:\/\//i)) return 'url';
    
    // WiFi detection (WIFI:T:WPA;S:NetworkName;P:Password;;)
    if (text.startsWith('WIFI:')) return 'wifi';
    
    // Email detection
    if (text.match(/^mailto:/i) || text.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'email';
    
    // Phone detection
    if (text.match(/^tel:/i) || text.match(/^\+?[\d\-\(\)\s]+$/)) return 'phone';
    
    // SMS detection
    if (text.match(/^sms:/i)) return 'phone';
    
    return 'text';
  };

  // Get icon for QR type
  const getQRIcon = (type: ScanResult['type']) => {
    switch (type) {
      case 'url': return <Globe className="w-5 h-5 text-blue-500" />;
      case 'wifi': return <Wifi className="w-5 h-5 text-green-500" />;
      case 'email': return <Mail className="w-5 h-5 text-red-500" />;
      case 'phone': return <Phone className="w-5 h-5 text-purple-500" />;
      case 'text': return <MessageSquare className="w-5 h-5 text-gray-500" />;
      default: return <CheckCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  // Start scanning
  const startScanning = async () => {
    if (!permissionGranted) {
      setError('Camera permission is required for scanning');
      return;
    }

    try {
      setIsScanning(true);
      setError(null);

      // Configure scanner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: 'environment' // Use back camera
        }
      };

      if (scannerElementRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          "qr-scanner-container",
          config,
          false
        );

        scannerRef.current.render(
          async (decodedText: string) => {
            console.warn('📱 [QR SCANNER] QR Code detected:', decodedText);
            
            // Stop scanning
            if (scannerRef.current) {
              await scannerRef.current.clear();
              scannerRef.current = null;
            }
            
            // Create scan result
            const result: ScanResult = {
              id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              text: decodedText,
              type: detectQRType(decodedText),
              timestamp: new Date().toISOString(),
              processed: false
            };
            
            setScanResult(result);
            setIsScanning(false);
            
            // Add to scan history
            setScanHistory(prev => [result, ...prev.slice(0, 9)]);
            
            try {
              // Track scan with enhanced analytics
              console.warn('📊 [QR SCANNER] Tracking scan with enhanced analytics...');
              
              // Try to find existing QR code in database or create a generic one
              const qrCodeId = `qr_scanned_${Date.now()}`;
              const qrCodeTitle = `QR: ${result.type.toUpperCase()}`;
              
              await trackQRScan(qrCodeId, qrCodeTitle, {
                scannedText: decodedText,
                detectedType: result.type,
                scanMethod: 'camera_scanner',
                scanLocation: 'qr_scanner_component'
              });
              
              result.processed = true;
              setScanResult(result);
              
              console.warn('✅ [QR SCANNER] Scan tracked successfully');
              
            } catch (trackError) {
              console.warn('⚠️ [QR SCANNER] Failed to track scan:', trackError);
              // Still show result even if tracking fails
            }
            
            // Callback to parent component
            if (onScanResult) {
              onScanResult(decodedText);
            }
          },
          (errorMessage: string) => {
            // Ignore frequent scanning errors
            if (!errorMessage.includes('NotFoundException')) {
              console.warn('QR Scanner _error:', errorMessage);
            }
          }
        );
      }
    } catch (_err) {
      console.error('Failed to start QR scanner:', _err);
      setError('Failed to start camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  // Stop scanning
  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (_err) {
        console.warn('Error stopping scanner:', _err);
      }
    }
    setIsScanning(false);
  };

  // Handle action for scanned result
  const handleAction = (result: ScanResult) => {
    switch (result.type) {
      case 'url':
        window.open(result.text, '_blank');
        break;
      case 'email':
        const emailUrl = result.text.startsWith('mailto:') 
          ? result.text 
          : `mailto:${result.text}`;
        window.open(emailUrl);
        break;
      case 'phone':
        const phoneUrl = result.text.startsWith('tel:') 
          ? result.text 
          : `tel:${result.text}`;
        window.open(phoneUrl);
        break;
      case 'text':
      default:
        navigator.clipboard.writeText(result.text);
        alert('Text copied to clipboard!');
        break;
    }
  };

  // Component cleanup
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.warn);
      }
    };
  }, []);

  return (
    <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Camera className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">QR Scanner</h3>
            <p className="text-sm text-gray-500">Scan QR codes with camera</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Scanner Area */}
      <div className="p-6">
        {_error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{_error}</p>
          </div>
        )}

        {!permissionGranted && !_error && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <Camera className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-yellow-700">Requesting camera permission...</p>
          </div>
        )}

        {permissionGranted && !isScanning && !scanResult && (
          <div className="text-center">
            <div className="mb-6 p-8 border-2 border-dashed border-gray-300 rounded-xl">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Ready to Scan</h4>
              <p className="text-sm text-gray-500 mb-4">
                Point your camera at a QR code to scan it
              </p>
              <button
                onClick={startScanning}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Start Scanning
              </button>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="space-y-4">
            <div id="qr-scanner-container" ref={scannerElementRef}></div>
            <div className="text-center">
              <button
                onClick={stopScanning}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Stop Scanning
              </button>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start space-x-3">
                {getQRIcon(scanResult.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-900 capitalize">
                      {scanResult.type} QR Code
                    </h4>
                    {scanResult.processed && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-green-800 break-all mb-3">
                    {scanResult.text}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAction(scanResult)}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {scanResult.type === 'url' ? 'Open' : 
                       scanResult.type === 'email' ? 'Send Email' :
                       scanResult.type === 'phone' ? 'Call' : 'Copy'}
                    </button>
                    <button
                      onClick={() => setScanResult(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Scan Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Recent Scans</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {scanHistory.slice(0, 3).map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleAction(scan)}
                >
                  {getQRIcon(scan.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {scan.text}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(scan.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {scan.processed && (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
