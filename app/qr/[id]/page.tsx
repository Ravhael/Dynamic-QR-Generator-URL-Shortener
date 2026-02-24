"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QrCode, ExternalLink, Shield, Clock, User, Globe } from 'lucide-react'

interface QRCodeData {
  id: string
  name: string
  type: string
  content: string
  scans: number
  created_at: string
}

export default function QRRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const [qrCode, setQRCode] = useState<QRCodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [_error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const response = await fetch(`/api/qr-codes/${params.id}`)
        if (!response.ok) {
          throw new Error('QR Code not found')
        }
        const data = await response.json()
        setQRCode(data.qrCode)
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          setRedirecting(true)
          const countdownInterval = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval)
                // Trigger scan tracking and redirect
                window.location.href = `/api/qr/${params.id}`
                return 0
              }
              return prev - 1
            })
          }, 1000)
        }, 1000)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load QR code')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchQRCode()
    }
  }, [params.id])

  const handleManualRedirect = () => {
    setRedirecting(true)
    window.location.href = `/api/qr/${params.id}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading QR Code...</p>
        </div>
      </div>
    )
  }

  if (_error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">QR Code Not Found</h1>
          <p className="text-gray-600 mb-4">{_error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (!qrCode) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">QR Code Redirect</h1>
              <p className="text-blue-100">Redirecting you safely...</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* QR Info */}
          <div className="mb-6">
            <h2 className="font-bold text-gray-900 text-lg mb-4">{qrCode.name}</h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="break-all">{qrCode.content}</span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <User className="w-4 h-4 text-green-500" />
                <span>{qrCode.scans} total scans</span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>Created {new Date(qrCode.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Verified QR Code</h3>
                <p className="text-sm text-green-700">
                  This QR code is verified and safe. Your scan has been recorded for analytics.
                </p>
              </div>
            </div>
          </div>

          {/* Redirect Status */}
          {redirecting ? (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="text-2xl font-bold text-blue-600">{countdown}</div>
                </div>
                <p className="text-gray-600">Redirecting in {countdown} seconds...</p>
              </div>
              
              <button
                onClick={handleManualRedirect}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Go Now</span>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Click below to continue to the destination</p>
              <button
                onClick={handleManualRedirect}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Continue to Website</span>
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Powered by Scanly QR Analytics System
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
