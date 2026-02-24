"use client"

import React, { useState } from 'react';
import QRScanner from '../../components/QRCodes/QRScanner';
import { Camera, QrCode, History, TrendingUp } from 'lucide-react';

const QRScannerPage: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scanStats, setScanStats] = useState({
    totalScans: 0,
    todayScans: 0,
    successRate: 100
  });

  const handleScanResult = (result: string) => {
    console.warn('Scan result received:', result);
    setScanStats(prev => ({
      ...prev,
      totalScans: prev.totalScans + 1,
      todayScans: prev.todayScans + 1
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">QR Scanner</h1>
              <p className="text-gray-600">Scan QR codes with real-time analytics tracking</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <QrCode className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Scans</p>
                  <p className="text-2xl font-bold text-gray-900">{scanStats.totalScans}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <History className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Scans</p>
                  <p className="text-2xl font-bold text-gray-900">{scanStats.todayScans}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{scanStats.successRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!showScanner ? (
            // Welcome Screen
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Real-Time QR Code Scanner
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Scan QR codes with your camera and get real-time analytics. 
                  Each scan is automatically tracked with precise device information, 
                  location data, and detailed analytics.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Smart Detection</h3>
                  <p className="text-sm text-gray-600">
                    Automatically detects URLs, WiFi, Email, Phone numbers, and text with appropriate actions
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Real Analytics</h3>
                  <p className="text-sm text-gray-600">
                    Every scan is tracked with device info, location, IP address, and browser details
                  </p>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={() => setShowScanner(true)}
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Camera className="w-6 h-6" />
                <span>Start QR Scanner</span>
              </button>
            </div>
          ) : (
            // Scanner Component
            <div className="flex justify-center">
              <QRScanner 
                onScanResult={handleScanResult}
                onClose={() => setShowScanner(false)}
                className="w-full max-w-lg"
              />
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">How it works:</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <p className="text-sm text-gray-600">Click "Start Scanner" to enable camera</p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <p className="text-sm text-gray-600">Point camera at QR code to scan</p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <p className="text-sm text-gray-600">Get instant results with smart actions</p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <p className="text-sm text-gray-600">Analytics saved to database automatically</p>
              </div>
            </div>
          </div>

          {/* Analytics Info */}
          <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <h4 className="font-semibold text-indigo-900 mb-2">📊 Real-Time Analytics Tracking</h4>
            <p className="text-sm text-indigo-700">
              Every QR scan is automatically tracked with: <strong>Device brand & model</strong> (e.g., iPhone 13 Pro), 
              <strong> precise location</strong> (e.g., Jakarta Selatan, Indonesia), <strong>real IP address</strong>, 
              <strong>browser info</strong>, <strong>operating system</strong>, and <strong>timestamp</strong>. 
              All data is saved to the scan_events database for detailed analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;
