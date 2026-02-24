"use client";
import QRCode from 'react-qr-code';
import Image from "next/image"
import React, { useState, useEffect } from 'react';
import { QrCode, Download, Copy, Settings, Link, Type, Wifi, Phone, Mail } from 'lucide-react';
import getMenuIconClass from '../../lib/iconColors';
import qrCodeService, { QRCodeCustomization } from '../../lib/api/qrCodeService';

interface QRCodeGeneratorProps {
  onGenerate?: (qrCode: any) => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ onGenerate }) => {
  const [qrType, setQrType] = useState<'url' | 'text' | 'wifi' | 'phone' | 'email'>('url');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isDynamic, setIsDynamic] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- Tambahkan state baru untuk preview hasil backend ---
  const [backendQR, setBackendQR] = useState<string | null>(null);

  const [qrOptions, setQrOptions] = useState<QRCodeCustomization>({
    size: 256,
    margin: 4,
    errorCorrectionLevel: 'M',
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
  });

  const qrTypes = [
    { id: 'url', label: 'Website URL', icon: Link, placeholder: 'https://example.com' },
    { id: 'text', label: 'Plain Text', icon: Type, placeholder: 'Enter your text here' },
    { id: 'wifi', label: 'WiFi Network', icon: Wifi, placeholder: 'WIFI:T:WPA;S:NetworkName;P:Password;;' },
    { id: 'phone', label: 'Phone Number', icon: Phone, placeholder: 'tel:+1234567890' },
    { id: 'email', label: 'Email Address', icon: Mail, placeholder: 'mailto:contact@example.com' }
  ];

  const errorCorrectionLevels = [
    { value: 'L', label: 'Low (~7%)', description: 'Good for clean environments' },
    { value: 'M', label: 'Medium (~15%)', description: 'Balanced option' },
    { value: 'Q', label: 'Quartile (~25%)', description: 'Good for outdoor use' },
    { value: 'H', label: 'High (~30%)', description: 'Best for damaged surfaces' }
  ];

  const sizeOptions = [
    { value: 128, label: '128x128 (Small)' },
    { value: 256, label: '256x256 (Medium)' },
    { value: 512, label: '512x512 (Large)' },
    { value: 1024, label: '1024x1024 (Extra Large)' }
  ];

  useEffect(() => {
    // ✅ Load REAL categories from API instead of hardcode
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/qr-categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
          if (data.categories && data.categories.length > 0) {
            setCategoryId(data.categories[0].id); // Set first category as default
          }
          console.log("✅ QRCodeGenerator loaded categories from API:", data.categories?.length);
        } else {
          // Fallback to default categories if API fails
          const defaultCategories = [
            { id: '1', name: 'Website' },
            { id: '2', name: 'Business' },  
            { id: '3', name: 'Social Media' },
            { id: '4', name: 'Contact' },
            { id: '5', name: 'Other' }
          ];
          setCategories(defaultCategories);
          setCategoryId('1');
          console.warn("⚠️ QRCodeGenerator using fallback categories");
        }
      } catch (error) {
        console.error("❌ Error loading categories:", error);
        // Fallback to default categories
        const defaultCategories = [
          { id: '1', name: 'Website' },
          { id: '2', name: 'Business' },  
          { id: '3', name: 'Social Media' },
          { id: '4', name: 'Contact' },
          { id: '5', name: 'Other' }
        ];
        setCategories(defaultCategories);
        setCategoryId('1');
      }
    };

    loadCategories();
  }, []);

  const formatContentForType = (content: string, type: string): string => {
    if (!content.trim()) return '';
    
    switch (type) {
      case 'url':
        return content.startsWith('http') ? content : `https://${content}`;
      case 'phone':
        return content.startsWith('tel:') ? content : `tel:${content}`;
      case 'email':
        return content.startsWith('mailto:') ? content : `mailto:${content}`;
      case 'wifi':
      case 'text':
      default:
        return content;
    }
  };

  const handleGenerateQRCode = async () => {
    if (!content.trim() || !name.trim() || !categoryId) {
      setError("Please fill all fields and select a category.");
      setSuccess(null);
      return;
    }
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const formattedContent = formatContentForType(content, qrType);
      const payload = {
        name,
        type: qrType,
        content: formattedContent,
        isDynamic,
        categoryId: categoryId,
        tags: [qrType, categories.find(c => c.id === categoryId)?.name?.toLowerCase()].filter(Boolean) as string[],
        customization: qrOptions
      };
      const response = await qrCodeService.createQRCode(payload);
      // Simpan preview sementara (jika masih ingin ditampilkan sebelum reset penuh)
      setBackendQR(response.qrCode.qrCodeData);
      setSuccess("QR Code berhasil dibuat!");
      if (onGenerate) onGenerate(response.qrCode);

      // Scroll ke atas agar user langsung melihat notifikasi sukses / posisi awal
      try {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch {}

      // Reset form setelah sukses (kosongkan semua field & preview sesuai permintaan)
      setTimeout(() => {
        setContent('');
        setName('');
        setCategoryId(categories.length ? categories[0].id : '');
        setQrType('url');
        setIsDynamic(true);
        setQrOptions({
          size: 256,
          margin: 4,
          errorCorrectionLevel: 'M',
          foregroundColor: '#000000',
          backgroundColor: '#FFFFFF'
        });
        setBackendQR(null); // Hilangkan preview supaya benar-benar kosong
      }, 400); // beri sedikit delay agar user sempat melihat preview sekilas
    } catch (catchError: any) {
      console.error('Error generating QR code:', catchError);
      setError(catchError.message || 'Failed to generate QR code');
      setSuccess(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPNGBackend = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename || 'qr-code'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async () => {
    try {
      const formattedContent = formatContentForType(content, qrType);
      await navigator.clipboard.writeText(formattedContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (catchError: any) {
      console.error('Failed to copy to clipboard:', catchError);
    }
  };

  const resetAll = () => {
    setContent('');
    setName('');
    setBackendQR(null);
    setError(null);
    setSuccess(null);
    setCopySuccess(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header simplified */}
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            QR Code Generator
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed px-2">
            Generate & kustomisasi QR Code dengan mudah, lengkap dengan opsi tracking.
          </p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 rounded-lg shadow-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 rounded-lg shadow-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Form Controls */}
          <div className="xl:col-span-1 space-y-6">
            {/* QR Type Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Type className={`w-5 h-5 ${getMenuIconClass('generate-qr')}`} />
                QR Code Type
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {qrTypes.map(({ id, label, icon: Icon, placeholder }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setQrType(id as any);
                      setContent('');
                      const placeholderText = placeholder;
                      setTimeout(() => setContent(placeholderText), 100);
                    }}
                    className={`relative overflow-hidden p-4 rounded-2xl border-2 transition-colors duration-300 md:transition-all md:hover:scale-105 md:active:scale-95 ${
                      qrType === id
                        ? 'border-sky-600 bg-gradient-to-r from-sky-50 to-sky-100 dark:from-sky-900/30 dark:to-sky-900/30 shadow-lg'
                        : 'border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 hover:border-sky-300 dark:hover:border-sky-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${qrType === id ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-600'} dark:bg-gray-600 dark:text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`font-medium ${qrType === id ? 'text-sky-700' : 'text-gray-700'} dark:text-white`}>
                        {label}
                      </span>
                    </div>
                      {qrType === id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-400/10 to-sky-600/10 rounded-2xl"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Input */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Settings className={`w-5 h-5 ${getMenuIconClass('generate-qr')}`} />
                Content & Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={qrTypes.find(t => t.id === qrType)?.placeholder}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-sky-600 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 resize-none backdrop-blur-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    QR Code Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter a name for your QR code"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-sky-600 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-sky-600 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white transition-all duration-300 backdrop-blur-sm"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isDynamic}
                      onChange={(e) => setIsDynamic(e.target.checked)}
                      className="w-5 h-5 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-600 focus:ring-2 transition-all duration-300"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-300">
                      Enable Analytics Tracking
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-8">
                    Track scans and gather analytics data
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Customization */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Settings className={`w-5 h-5 ${getMenuIconClass('generate-qr')}`} />
                  Customization
                </h3>
                <button
                  onClick={() => setShowCustomization(!showCustomization)}
                  className={`${getMenuIconClass('generate-qr')} hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors duration-300`}
                >
                  {showCustomization ? 'Hide' : 'Show'}
                </button>
              </div>

              {showCustomization && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Size
                    </label>
                    <select
                      value={qrOptions.size}
                      onChange={(e) => setQrOptions({...qrOptions, size: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-sky-600 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white transition-all duration-300"
                    >
                      {sizeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Foreground Color
                      </label>
                      <input
                        type="color"
                        value={qrOptions.foregroundColor}
                        onChange={(e) => setQrOptions({...qrOptions, foregroundColor: e.target.value})}
                        className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Background Color
                      </label>
                      <input
                        type="color"
                        value={qrOptions.backgroundColor}
                        onChange={(e) => setQrOptions({...qrOptions, backgroundColor: e.target.value})}
                        className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Error Correction Level
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {errorCorrectionLevels.map(level => (
                        <button
                          key={level.value}
                          onClick={() => setQrOptions({...qrOptions, errorCorrectionLevel: level.value as any})}
                          className={`p-3 rounded-xl border-2 transition-colors duration-300 text-sm ${
                            qrOptions.errorCorrectionLevel === level.value
                              ? 'border-sky-600 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                              : 'border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:border-sky-300'
                          }`}
                        >
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs opacity-75 mt-1">{level.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleGenerateQRCode}
                  disabled={isGenerating || !content.trim() || !name.trim() || !categoryId}
                  className={`flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-xl font-medium transition-colors md:transition-all md:hover:scale-105 md:active:scale-95 disabled:scale-100 shadow disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  <QrCode className={`w-5 h-5 ${getMenuIconClass('generate-qr')}`} />
                  {isGenerating ? 'Generating...' : 'Generate QR'}
                </button>
                <button
                  onClick={resetAll}
                  className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors md:transition-all md:hover:scale-105 md:active:scale-95 shadow"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <QrCode className={`w-5 h-5 ${getMenuIconClass('generate-qr')}`} />
                Live Preview
              </h3>
              
              <div className="flex flex-col items-center space-y-6">
                {/* Backend QR Display (Priority) */}
                {backendQR ? (
                  <div className="relative group">
                    <div className="relative bg-white p-4 rounded-2xl shadow border border-cyan-200/70">
                      <img 
                        src={backendQR} 
                        alt="Generated QR Code" 
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                      ✓ READY
                    </div>
                  </div>
                ) : content ? (
                  /* Live Preview Saat Mengetik */
                  <div className="relative">
                    <div className="relative bg-white p-4 rounded-xl shadow border border-gray-200/70">
                      <QRCode
                        value={formatContentForType(content, qrType)}
                        size={Math.min(qrOptions.size || 256, 200)}
                        bgColor={qrOptions.backgroundColor}
                        fgColor={qrOptions.foregroundColor}
                        level={qrOptions.errorCorrectionLevel}
                        className="transition-all duration-300"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                      PREVIEW
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-center">
                      <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Enter content to see preview</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {(backendQR || content) && (
                  <div className="flex gap-3 w-full">
                    {backendQR && (
                      <button 
                        onClick={() => downloadPNGBackend(backendQR, name)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors md:transition-all md:hover:scale-105 md:active:scale-95 shadow flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    )}
                    {content && (
                      <button 
                        onClick={copyToClipboard} 
                        className={`flex-1 ${copySuccess ? 'bg-green-600' : 'bg-gray-600'} hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-medium transition-colors md:transition-all md:hover:scale-105 md:active:scale-95 shadow flex items-center justify-center gap-2`}
                      >
                        <Copy className="w-4 h-4" />
                        {copySuccess ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                  </div>
                )}

                {/* Status Info */}
                {backendQR && (
                  <div className="w-full p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">QR Code successfully generated and trackable!</span>
                    </div>
                  </div>
                )}
                
                {content && !backendQR && (
                  <div className="w-full p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-xl">
                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Preview only - Click Generate to create trackable QR</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
