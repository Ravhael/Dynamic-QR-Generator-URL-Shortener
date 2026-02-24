"use client"

import React, { useState, useEffect } from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline'

// Import analyzer functions
import { 
  analyzeMenuConsistency, 
  generateMenuConfigFix, 
  validateMenuIntegrity,
  ACTUAL_SIDEBAR_NAVIGATION,
  type MenuAnalysisResult
} from '../../lib/menuAnalyzer'

// Import konfigurasi menu yang ada
import { MENU_STRUCTURE, MENU_PERMISSIONS } from '@/menuConfig'

interface ValidationResult {
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  details?: string
  menuItem?: string
  suggestion?: string
}

interface MenuValidatorProps {
  userRole?: string
}

const MenuValidator: React.FC<MenuValidatorProps> = ({ userRole = 'admin' }) => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [analysisResult, setAnalysisResult] = useState<MenuAnalysisResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showFixScript, setShowFixScript] = useState(false)
  const [fixScript, setFixScript] = useState('')

  // Fungsi validasi utama menggunakan analyzer
  const validateMenuConsistency = async () => {
    setIsValidating(true)
    const results: ValidationResult[] = []

    // Jalankan analisis
  const analysis = await analyzeMenuConsistency()
  setAnalysisResult(analysis)

    // Convert analysis results to validation results
  analysis.missingInConfig.forEach(menuId => {
      results.push({
        type: 'error',
        message: `Menu "${menuId}" ada di sidebar tapi tidak di MENU_STRUCTURE`,
        details: `Menu ID: ${menuId}`,
        menuItem: menuId,
        suggestion: `Tambahkan menu ini ke MENU_STRUCTURE di menuConfig.ts`
      })
    })

  analysis.missingPermissions?.forEach(menuId => {
      const permissionKey = menuId.toUpperCase().replace(/-/g, '_')
      results.push({
        type: 'error',
        message: `Menu "${menuId}" tidak memiliki konfigurasi permission`,
        details: `Missing permission: ${permissionKey}`,
        menuItem: menuId,
        suggestion: `Tambahkan ${permissionKey} ke MENU_PERMISSIONS di menuConfig.ts`
      })
    })

  analysis.inconsistentPaths.forEach(({ menuId, sidebarPath, configPath }) => {
      results.push({
        type: 'warning',
        message: `Path tidak konsisten untuk menu "${menuId}"`,
        details: `Sidebar: ${sidebarPath}, Config: ${configPath}`,
        menuItem: menuId,
        suggestion: `Seragamkan path di sidebar dan config`
      })
    })

  analysis.permissionIssues?.forEach(({ menuId, issue, suggestion }) => {
      results.push({
        type: 'warning',
        message: issue,
        menuItem: menuId,
        suggestion: suggestion
      })
    })

  analysis.missingInSidebar.forEach(menuId => {
      results.push({
        type: 'info',
        message: `Menu "${menuId}" ada di config tapi tidak di sidebar`,
        details: `Menu ID: ${menuId}`,
        menuItem: menuId,
        suggestion: `Pertimbangkan untuk menambahkan ke sidebar atau hapus dari config`
      })
    })

    // Summary
    if (results.length === 0) {
      results.push({
        type: 'success',
        message: 'Semua menu sudah tersinkronisasi dengan baik!',
        details: `Total menu valid dan konsisten`
      })
    }

    // Generate fix script
    const fixScript = generateMenuConfigFix()
    setFixScript(fixScript)

    setValidationResults(results)
    setIsValidating(false)
  }

  // Auto-validate saat component dimount
  useEffect(() => {
    validateMenuConsistency()
  }, [])

  const getIcon = (type: ValidationResult['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
    }
  }

  const getBgColor = (type: ValidationResult['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
    }
  }

  const copyFixScript = () => {
    navigator.clipboard.writeText(fixScript)
    // Could add toast notification here
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white dark:text-gray-100 flex items-center space-x-2">
            <ClipboardDocumentListIcon className="h-6 w-6" />
            <span>Menu Validation & Synchronization</span>
          </h2>
          <p className="text-white/70 dark:text-gray-400 mt-1">
            Validasi konsistensi antara sidebar menu dan menu settings configuration
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {fixScript && (
            <button
              onClick={() => setShowFixScript(!showFixScript)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            >
              <CodeBracketIcon className="h-4 w-4" />
              <span>Show Fix Script</span>
            </button>
          )}
          <button
            onClick={validateMenuConsistency}
            disabled={isValidating}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            <span>{isValidating ? 'Validating...' : 'Re-validate'}</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <div className="text-2xl font-bold text-white">
            {ACTUAL_SIDEBAR_NAVIGATION.reduce((count, item) => {
              return count + 1 + (item.children?.length || 0)
            }, 0)}
          </div>
          <div className="text-white/70 text-sm">Sidebar Menus</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <div className="text-2xl font-bold text-white">
            {MENU_STRUCTURE.reduce((count, item) => {
              return count + 1 + (item.children?.length || 0)
            }, 0)}
          </div>
          <div className="text-white/70 text-sm">Config Menus</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <div className="text-2xl font-bold text-white">
            {Object.keys(MENU_PERMISSIONS).length}
          </div>
          <div className="text-white/70 text-sm">Permissions</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <div className="text-2xl font-bold text-red-400">
            {validationResults.filter(r => r.type === 'error').length}
          </div>
          <div className="text-white/70 text-sm">Critical Issues</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <div className="text-2xl font-bold text-yellow-400">
            {validationResults.filter(r => r.type === 'warning').length}
          </div>
          <div className="text-white/70 text-sm">Warnings</div>
        </div>
      </div>

      {/* Analysis Summary */}
      {analysisResult && (
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-medium text-white mb-4">Analysis Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-red-400">{analysisResult.missingInConfig.length}</div>
              <div className="text-sm text-white/70">Missing in Config</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">{analysisResult.missingInSidebar.length}</div>
              <div className="text-sm text-white/70">Missing in Sidebar</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-400">{analysisResult.missingPermissions.length}</div>
              <div className="text-sm text-white/70">Missing Permissions</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-400">{analysisResult.inconsistentPaths.length}</div>
              <div className="text-sm text-white/70">Path Inconsistencies</div>
            </div>
          </div>
        </div>
      )}

      {/* Fix Script Modal */}
      {showFixScript && (
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Auto-Generated Fix Script</span>
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={copyFixScript}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowFixScript(false)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
            {fixScript || 'No fixes needed - all menus are properly configured!'}
          </pre>
        </div>
      )}

      {/* Validation Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white dark:text-gray-100">
          Validation Results ({validationResults.length})
        </h3>
        
        {validationResults.length === 0 && (
          <div className="text-center py-8 text-white/70">
            <Cog6ToothIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No validation results yet. Click "Re-validate" to start.</p>
          </div>
        )}

        {validationResults.map((result, index) => (
          <div
            key={`item-${index}`}
            className={`border rounded-lg p-4 ${getBgColor(result.type)} backdrop-blur-sm`}
          >
            <div className="flex items-start space-x-3">
              {getIcon(result.type)}
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {result.message}
                </div>
                {result.details && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {result.details}
                  </div>
                )}
                {result.suggestion && (
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 font-medium">
                    💡 Saran: {result.suggestion}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Menu Structure Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sidebar Structure */}
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <h4 className="font-medium text-white mb-4">Struktur Sidebar Saat Ini</h4>
          <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
            {ACTUAL_SIDEBAR_NAVIGATION.map(item => (
              <div key={item.id} className="text-white/80">
                <div className="font-medium">{(item as any).name || (item as any).label || item.id} ({item.id})</div>
                {item.children && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map(child => (
                      <div key={child.id} className="text-white/60">
                        └ {(child as any).name || (child as any).label || child.id} ({child.id})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Config Structure */}
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <h4 className="font-medium text-white mb-4">Struktur Menu Config</h4>
          <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
            {MENU_STRUCTURE.map(item => (
              <div key={item.id} className="text-white/80">
                <div className="font-medium">{item.label} ({item.id})</div>
                {item.children && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map(child => (
                      <div key={child.id} className="text-white/60">
                        └ {child.label} ({child.id})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MenuValidator
