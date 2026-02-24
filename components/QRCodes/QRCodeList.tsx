"use client"

import Image from "next/image"
import React, { useState, useEffect, Suspense } from "react"
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  QrCodeIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  TagIcon,
  XMarkIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline"
import { formatDistance } from "date-fns"
import { clsx } from "clsx"
import qrCodeService, { type QRCode } from "../../lib/api/qrCodeService"
import { useRouter, useSearchParams } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import QRCodeSVG from "react-qr-code"

// Layout and PerPage options
const layoutOptions = [
  { value: "grid", label: "Grid View", icon: Squares2X2Icon },
  { value: "list", label: "List View", icon: ListBulletIcon },
  { value: "details", label: "Detailed View", icon: EyeIcon },
]

const perPageOptions = [6, 12, 18, 24, 30]

// Sorting options with Indonesian labels
const sortingOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "most_scanned", label: "Paling Banyak Discan" },
  { value: "least_scanned", label: "Paling Sedikit Discan" },
  { value: "name_asc", label: "Nama A-Z" },
  { value: "name_desc", label: "Nama Z-A" },
]

// Defensive tag parser
const parseTags = (tags: any): string[] => {
  if (Array.isArray(tags)) return tags
  if (typeof tags === "string") {
    try {
      return JSON.parse(tags)
    } catch {
      return []
    }
  }
  return []
}

// Safe date parser
const safeDate = (dateValue: any): Date | null => {
  if (!dateValue) return null
  const date = new Date(dateValue)
  return isNaN(date.getTime()) ? null : date
}

// Safe date formatting
const formatSafeDate = (dateValue: any): string => {
  const date = safeDate(dateValue)
  if (!date) return "Invalid date"
  return formatDistance(date, new Date(), { addSuffix: true })
}

// Safe locale date formatting
const formatSafeLocaleDate = (dateValue: any): string => {
  const date = safeDate(dateValue)
  if (!date) return "Invalid date"
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
}

// Safe ISO date formatting for inputs
const formatSafeISODate = (dateValue: any): string => {
  const date = safeDate(dateValue)
  if (!date) return ""
  return date.toISOString().split("T")[0]
}

const QRCodeListContent: React.FC = () => {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedSort, setSelectedSort] = useState<string>("newest")
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedQRCodes, setSelectedQRCodes] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [statistics, setStatistics] = useState({ total: 0, activeCount: 0, inactiveCount: 0, totalScans: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [editFormData, setEditFormData] = useState({
    name: "",
    content: "",
    categoryId: "",
    tags: "",
    isActive: true,
    expiresAt: "",
    maxScans: "",
    url_update: "",
  })
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [_error, setError] = useState<string | null>(null)

  // Pagination & Layout state - ✅ ADMINISTRATOR SEES ALL DATA!
  const [perPage, setPerPage] = useState(100) // ✅ Increased from 12 to 100
  const [layout, setLayout] = useState("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 100 }) // ✅ Increased from 12

  const router = useRouter()
  const searchParams = useSearchParams()

  // Ambil kategori dari URL jika ada
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category")
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl)
    }
  }, [searchParams])

  // ✅ INITIAL LOAD STATISTICS ON COMPONENT MOUNT
  useEffect(() => {
    loadStatistics()
  }, [])

  // Load statistics
  const loadStatistics = async () => {
    try {
      console.warn("🔍 QRCodeList: Loading REAL statistics from API...")
      const stats = await qrCodeService.getStatistics()
      console.warn("✅ QRCodeList: REAL DATABASE statistics loaded:", stats)
      console.warn("📊 DATABASE STATS: Total:", stats.total, "Active:", stats.activeCount, "Inactive:", stats.inactiveCount, "Scans:", stats.totalScans)
      setStatistics(stats)
    } catch (error) {
      console.error("❌ QRCodeList: CRITICAL - API statistics failed, BLOCKING fallback!")
      console.error("❌ This means authentication or API is broken - MUST be fixed!")
      console.error("Error details:", error)
      
      // ❌ DISABLED FALLBACK - Force proper API usage!
      // calculateLocalStatistics()
      
      // Show error state instead
      setStatistics({ 
        total: -1, 
        activeCount: -1, 
        inactiveCount: -1, 
        totalScans: -1 
      })
    }
  }

  // ✅ REMOVED LOCAL CALCULATION - ONLY USE API STATS FOR ACCURATE DATA!

  // Ambil data dari backend
  const fetchData = async (page = currentPage, limit = perPage, category = selectedCategory, status = selectedStatus, sortBy = selectedSort) => {
    setIsLoading(true)
    setError(null)
    try {
      // Load categories if not loaded yet
      if (categories.length === 0) {
        try {
          const categoriesResponse = await fetch('/api/qr-categories')
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json()
            console.warn("[QR CODE LIST] ✅ GOT CATEGORIES:", categoriesData)
            setCategories(categoriesData.categories || [])
          }
        } catch (_err) {
          console.warn("[QR CODE LIST] ⚠️ Failed to load categories:", _err)
          // Continue without categories
        }
      }

      const qrCodesResponse = await qrCodeService.getQRCodes({
        page,
        limit,
        category: category !== "all" ? category : undefined,
        status: status !== "all" ? status : undefined,
        search: searchTerm || undefined,
        sortBy: sortBy || "newest",
      })

      console.warn("[QR CODE LIST] ✅ GOT QR CODES:", qrCodesResponse)

      const qrList = Array.isArray(qrCodesResponse.qrCodes) ? qrCodesResponse.qrCodes : []
      setQrCodes(qrList)
      setPagination(qrCodesResponse.pagination ?? { total: 0, page: 1, pages: 1, limit: limit })
      
      // ✅ DO NOT CALCULATE STATISTICS FROM LOCAL DATA!
      // Use API stats for accurate database totals - statistics will be loaded from loadStatistics()
      console.warn("🎯 QRCodeList: QR codes loaded. Statistics will come from API /api/qr-codes/stats")
    } catch (_error: any) {
      setError(_error?.response?.data?.error || _error?.message || "Failed to load data.")
      setQrCodes([])
    } finally {
      setIsLoading(false)
    }
  }

  // Reset ke page 1 jika kategori/perPage/search/status/sort berubah
  useEffect(() => {
    setCurrentPage(1)
    fetchData(1, perPage, selectedCategory, selectedStatus, selectedSort)
    // ✅ LOAD STATISTICS FROM API - REAL DATABASE DATA!
    loadStatistics()
    // eslint-disable-next-line
  }, [selectedCategory, selectedStatus, selectedSort, perPage, searchTerm])

  // Fetch data ketika page berubah (tanpa reset search)
  useEffect(() => {
    if (currentPage > 1) {
      fetchData(currentPage, perPage, selectedCategory, selectedStatus, selectedSort)
      // ✅ RELOAD STATISTICS WHEN PAGE CHANGES
      loadStatistics()
    }
    // eslint-disable-next-line
  }, [currentPage])

  // Refresh QR codes
  const refreshQRCodes = async () => {
    fetchData(currentPage, perPage, selectedCategory, selectedStatus, selectedSort)
    // ✅ REFRESH STATISTICS TOO!
    loadStatistics()
  }

  // Use server-filtered data directly
  const filteredQRCodes = qrCodes || []

  // Handler functions
  const handleDownload = (qrCode: QRCode) => {
    if (qrCode.qrCodeData) {
      const link = document.createElement("a")
      link.href = qrCode.qrCodeData
      link.download = `${qrCode.name.replace(/\s+/g, "-").toLowerCase()}-qr-code.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("QR code downloaded!", {
        icon: "⬇️",
        style: {
          borderRadius: "12px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
        },
      })
    }
  }

  const handleCopyLink = (qrCode: QRCode) => {
    navigator.clipboard.writeText(qrCode.content)
    setCopySuccess(qrCode.id)
    toast.success("Link copied to clipboard!", {
      icon: "📋",
      style: {
        borderRadius: "12px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
      },
    })
    setTimeout(() => setCopySuccess(null), 2000)
  }

  const handleView = (qrCode: QRCode) => {
    setSelectedQR(qrCode)
    setShowViewModal(true)
  }

  const handleEdit = (qrCode: QRCode) => {
    setSelectedQR(qrCode)
    setEditFormData({
      name: qrCode.name,
      content: qrCode.content,
      categoryId: qrCode.categoryId || "",
      tags: Array.isArray(qrCode.tags)
        ? qrCode.tags.join(", ")
        : typeof qrCode.tags === "string"
          ? parseTags(qrCode.tags).join(", ")
          : "",
      isActive: qrCode.isActive,
      expiresAt: formatSafeISODate(qrCode.expiresAt),
      maxScans: qrCode.maxScans?.toString() || "",
      url_update: "",
    })
    setShowEditModal(true)
  }

  const handleDelete = (qrCode: QRCode) => {
    setSelectedQR(qrCode)
    setShowDeleteModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedQR) return
    try {
      const updateData: any = {
        name: editFormData.name,
        content: editFormData.content,
        categoryId: editFormData.categoryId || undefined,
        tags: editFormData.tags
          ? editFormData.tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t)
          : [],
        isActive: editFormData.isActive,
        expiresAt: editFormData.expiresAt || undefined,
        maxScans: editFormData.maxScans ? Number.parseInt(editFormData.maxScans) : undefined,
      }
      await qrCodeService.updateQRCode(selectedQR.id, updateData)

      await refreshQRCodes()
      setShowEditModal(false)
      setSelectedQR(null)
      toast.success("QR code updated!", {
        icon: "✨",
        style: {
          borderRadius: "12px",
          background: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
          color: "#fff",
        },
      })
    } catch (_error: any) {
      toast.error(_error?.response?.data?.error || _error?.message || "Failed to update QR code.")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedQR) return
    try {
      await qrCodeService.deleteQRCode(selectedQR.id)
      await refreshQRCodes()
      setShowDeleteModal(false)
      setSelectedQR(null)
      toast.success("QR code deleted!", {
        icon: "🗑️",
        style: {
          borderRadius: "12px",
          background: "linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)",
          color: "#fff",
        },
      })
    } catch (_error: any) {
      toast.error(_error?.response?.data?.error || _error?.message || "Failed to delete QR code.")
    }
  }

  // Bulk operations
  const handleSelectQR = (qrId: string) => {
    const newSelected = new Set(selectedQRCodes)
    if (newSelected.has(qrId)) {
      newSelected.delete(qrId)
    } else {
      newSelected.add(qrId)
    }
    setSelectedQRCodes(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedQRCodes.size === qrCodes.length) {
      setSelectedQRCodes(new Set())
    } else {
      setSelectedQRCodes(new Set(qrCodes.map(qr => qr.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedQRCodes.size === 0) return
    
    try {
      const idsArray = Array.from(selectedQRCodes)
      await qrCodeService.bulkDeleteQRCodes(idsArray)
      await refreshQRCodes()
      setSelectedQRCodes(new Set())
      setShowBulkActions(false)
      toast.success(`${idsArray.length} QR codes deleted!`, {
        icon: "🗑️",
        style: {
          borderRadius: "12px",
          background: "linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)",
          color: "#fff",
        },
      })
    } catch (_error: any) {
      toast.error(_error?.response?.data?.error || _error?.message || "Failed to delete QR codes.")
    }
  }

  const handleBulkStatusUpdate = async (status: boolean) => {
    if (selectedQRCodes.size === 0) return
    
    try {
      const idsArray = Array.from(selectedQRCodes)
      await qrCodeService.bulkUpdateStatus(idsArray, status)
      await refreshQRCodes()
      setSelectedQRCodes(new Set())
      setShowBulkActions(false)
      toast.success(`${idsArray.length} QR codes ${status ? 'activated' : 'deactivated'}!`, {
        icon: status ? "✅" : "❌",
        style: {
          borderRadius: "12px",
          background: status 
            ? "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)"
            : "linear-gradient(135deg, #ffa726 0%, #ff7043 100%)",
          color: "#fff",
        },
      })
    } catch (_error: any) {
      toast.error(_error?.response?.data?.error || _error?.message || "Failed to update QR codes.")
    }
  }

  const renderQRCard = (qrCode: QRCode) => {
    // Safety check for qrCode
    if (!qrCode || typeof qrCode !== 'object') {
      console.warn('Invalid QR code data:', qrCode)
      return null
    }
    
    const tags = parseTags(qrCode.tags) || []
    const category = categories.find((c) => c.id === qrCode.categoryId)

    return (
      <div
        key={qrCode.id}
  className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-gray-700/20 transition-all duration-500 md:hover:scale-105 md:hover:shadow-4xl md:hover:-translate-y-2"
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Header with Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Checkbox for selection */}
            <input
              type="checkbox"
              checked={selectedQRCodes.has(qrCode.id)}
              onChange={() => handleSelectQR(qrCode.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            
            {/* Dynamic/Static Badge */}
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${
                qrCode.isDynamic
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {qrCode.isDynamic ? "Dynamic" : "Static"}
            </span>

            {/* QR Type Badge */}
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              {qrCode.type?.toUpperCase() || "URL"}
            </span>
          </div>

          {/* Active/Inactive Status - Clickable */}
          <button
            onClick={async (e) => {
              e.stopPropagation()
              try {
                const newStatus = !qrCode.isActive
                await qrCodeService.updateQRCode(qrCode.id, { isActive: newStatus })
                await refreshQRCodes()
                toast.success(`QR code ${newStatus ? "activated" : "deactivated"}!`)
              } catch (_error) {
                toast.error("Failed to update status")
              }
            }}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-all duration-300 md:hover:scale-105 cursor-pointer ${
              qrCode.isActive
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${qrCode.isActive ? "bg-green-400" : "bg-red-400"} animate-pulse`}
            ></div>
            {qrCode.isActive ? "Active" : "Inactive"}
          </button>
        </div>

        {/* QR Code Preview */}
        <div className="relative mb-6 flex justify-center">
          <div className="relative group/qr">
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-400/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-white p-4 rounded-2xl shadow-xl">
              {qrCode.qrCodeData && qrCode.qrCodeData.startsWith('data:') ? (
                <img
                  src={qrCode.qrCodeData}
                  alt={qrCode.name}
                  className="w-24 h-24 object-contain transition-transform duration-300 group-hover/qr:scale-110"
                  onError={() => {
                    console.warn(`[QR IMAGE ERROR] Data URL failed for: ${qrCode.name}`);
                  }}
                />
              ) : qrCode.qrCodeData && qrCode.qrCodeData.includes('<svg') ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: qrCode.qrCodeData }}
                  className="w-24 h-24 transition-transform duration-300 group-hover/qr:scale-110 [&>svg]:w-full [&>svg]:h-full"
                />
              ) : qrCode.qrCodeData && (qrCode.qrCodeData.startsWith('/uploads/') || qrCode.qrCodeData.startsWith('/public/')) ? (
                <img
                  src={qrCode.qrCodeData}
                  alt={qrCode.name}
                  className="w-24 h-24 object-contain transition-transform duration-300 group-hover/qr:scale-110"
                  onError={() => {
                    console.warn(`[QR IMAGE ERROR] File path failed for: ${qrCode.name}, path: ${qrCode.qrCodeData}`);
                  }}
                />
              ) : (
                <QRCodeSVG
                  value={qrCode.content || ""}
                  size={96}
                  className="transition-transform duration-300 group-hover/qr:scale-110"
                />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
              {qrCode.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{qrCode.content}</p>
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <UserIcon className="w-4 h-4" />
            <span>By {(qrCode as any).userName || (qrCode as any).User?.name || (qrCode as any).createdBy || "Unknown User"}</span>
          </div>

          {/* Category & Tags */}
          <div className="space-y-2">
            {category && (
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
                  {category.name}
                </span>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">+{tags.length - 3} more</span>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <ChartBarIcon className="w-4 h-4" />
              <span>{qrCode.scans || 0} scans</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarDaysIcon className="w-4 h-4" />
              <span>{formatSafeDate(qrCode.createdAt)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={() => handleView(qrCode)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-2 px-2 rounded-xl text-xs font-medium transition-all duration-300 transform md:hover:scale-105 active:scale-95 shadow-lg md:hover:shadow-xl flex items-center justify-center"
              title="View QR Code"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleEdit(qrCode)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2 px-2 rounded-xl text-xs font-medium transition-all duration-300 transform md:hover:scale-105 active:scale-95 shadow-lg md:hover:shadow-xl flex items-center justify-center"
              title="Edit QR Code"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDownload(qrCode)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-2 rounded-xl transition-all duration-300 transform md:hover:scale-105 active:scale-95 shadow-lg md:hover:shadow-xl flex items-center justify-center"
              title="Download QR Code"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(qrCode)}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-2 px-2 rounded-xl transition-all duration-300 transform md:hover:scale-105 active:scale-95 shadow-lg md:hover:shadow-xl flex items-center justify-center"
              title="Delete QR Code"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-3 sm:p-5 lg:p-8 transition-colors">
      <Toaster position="top-right" />

      <div className="relative max-w-7xl mx-auto">
        {/* Enhanced Header */}
  <div className="text-center mb-6 sm:mb-10">
          <div className="relative inline-block mb-6">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent mb-3">
              QR Code Gallery
            </h1>
            {/* decorative outline removed for cleaner look */}
          </div>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed px-2">
            Manage and organize your QR codes with style and efficiency
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total QR Codes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                <QrCodeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.activeCount}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.inactiveCount}</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl">
                <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Scans</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{statistics.totalScans}</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                <EyeIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        {/* Mobile Filters Toggle */}
        <div className="sm:hidden mb-4 flex justify-end">
          <button
            onClick={() => setShowBulkActions(prev => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 active:scale-[.97] transition"
          >
            <FunnelIcon className="w-4 h-4" />
            {showBulkActions ? 'Tutup Filter' : 'Filter'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow border border-gray-100 dark:border-gray-700 mb-6 sm:mb-8">{selectedQRCodes.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {selectedQRCodes.size} QR code(s) selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkStatusUpdate(true)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate(false)}
                    className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedQRCodes(new Set())}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className={clsx(
            "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
            {
              'hidden sm:grid': !showBulkActions, // on mobile hide when toggle off
              'grid': showBulkActions
            }
          )}>
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search QR codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 backdrop-blur-sm shadow-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white transition-all duration-300 backdrop-blur-sm appearance-none shadow-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <ChartBarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white transition-all duration-300 backdrop-blur-sm appearance-none shadow-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <ArrowsUpDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white transition-all duration-300 backdrop-blur-sm appearance-none shadow-sm"
              >
                {sortingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Layout Selector */}
            <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-1 shadow-sm overflow-hidden">
              {layoutOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => setLayout(option.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-sm font-medium transition-all duration-300 min-w-0 ${
                      layout === option.value
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-md border border-indigo-200 dark:border-indigo-700"
                        : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                    title={option.label}
                  >
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden xl:inline text-xs truncate">{option.label.split(" ")[0]}</span>
                  </button>
                )
              })}
            </div>

            {/* Per Page */}
            <div className="relative">
              <CogIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number.parseInt(e.target.value))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white transition-all duration-300 backdrop-blur-sm appearance-none shadow-sm"
              >
                {perPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} per page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {_error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 rounded-lg shadow-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{_error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
              <SparklesIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-600 animate-pulse" />
            </div>
          </div>
        ) : filteredQRCodes.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <QrCodeIcon className="w-24 h-24 text-gray-400 dark:text-gray-600 mx-auto animate-pulse" />
              <div className="absolute -inset-4 bg-gradient-to-r from-gray-400/10 to-gray-600/10 rounded-full blur-xl"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No QR codes found</h3>
            <p className="text-gray-500 dark:text-gray-500">
              {searchTerm ? "Try adjusting your search terms" : "Create your first QR code to get started"}
            </p>
          </div>
        ) : (
          <>
            {/* Select All Button */}
            <div className="mb-4 flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedQRCodes.size === qrCodes.length && qrCodes.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                  Select All ({qrCodes.length})
                </span>
              </label>
              {selectedQRCodes.size > 0 && (
                <span className="text-sm text-indigo-600 dark:text-indigo-400">
                  {selectedQRCodes.size} selected
                </span>
              )}
            </div>

            {/* QR Codes Grid */}
            <div
              className={clsx("grid gap-4 sm:gap-6 mb-8", {
                "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4": layout === "grid",
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3": layout === "list",
                "grid-cols-1 lg:grid-cols-2": layout === "details",
              })}
            >
              {filteredQRCodes.map(renderQRCard).filter(Boolean)}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/20 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300"
                >
                  Previous
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1
                    const isActive = page === currentPage
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={clsx(
                          "w-10 h-10 rounded-xl font-medium transition-all duration-300 transform hover:scale-110",
                          isActive
                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                            : "bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
                        )}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage === pagination.pages}
                  className="px-4 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/20 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* View Modal */}
        {showViewModal && selectedQR && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">QR Code Details</h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* QR Code Display */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-100">
                      {selectedQR.qrCodeData && selectedQR.qrCodeData.startsWith('data:') ? (
                        <img
                          src={selectedQR.qrCodeData}
                          alt={selectedQR.name}
                          className="w-64 h-64 object-contain"
                          onError={() => {
                            console.warn(`[MODAL QR IMAGE ERROR] Data URL failed for: ${selectedQR.name}`);
                          }}
                        />
                      ) : selectedQR.qrCodeData && selectedQR.qrCodeData.includes('<svg') ? (
                        <div 
                          dangerouslySetInnerHTML={{ __html: selectedQR.qrCodeData }}
                          className="w-64 h-64 flex items-center justify-center"
                        />
                      ) : selectedQR.qrCodeData && (selectedQR.qrCodeData.startsWith('/uploads/') || selectedQR.qrCodeData.startsWith('/public/')) ? (
                        <img
                          src={selectedQR.qrCodeData}
                          alt={selectedQR.name}
                          className="w-64 h-64 object-contain"
                          onError={() => {
                            console.warn(`[MODAL QR IMAGE ERROR] File path failed for: ${selectedQR.name}, path: ${selectedQR.qrCodeData}`);
                          }}
                        />
                      ) : (
                        <QRCodeSVG value={selectedQR.content} size={256} />
                      )}
                    </div>

                    {/* Download Buttons */}
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => {
                          // Download SVG
                          const svg = document.querySelector("svg")
                          if (svg) {
                            const svgData = new XMLSerializer().serializeToString(svg)
                            const canvas = document.createElement("canvas")
                            const ctx = canvas.getContext("2d")
                            const img = new window.Image()
                            img.onload = () => {
                              canvas.width = img.width
                              canvas.height = img.height
                              ctx?.drawImage(img, 0, 0)
                              const link = document.createElement("a")
                              link.download = `${selectedQR.name}.svg`
                              link.href = "data:image/svg+xml;base64," + btoa(svgData)
                              link.click()
                            }
                            img.src = "data:image/svg+xml;base64," + btoa(svgData)
                          }
                        }}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Download SVG
                      </button>
                      <button
                        onClick={() => handleDownload(selectedQR)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Download PNG
                      </button>
                    </div>
                  </div>

                  {/* QR Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedQR.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
                      <p className="text-gray-900 dark:text-white capitalize">{selectedQR.type || "Url"}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Content</label>
                      <p className="text-gray-900 dark:text-white break-all bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        {selectedQR.content}
                      </p>
                    </div>

                    {/* Migration Specific URLs */}
                    { (selectedQR as any).source_type === 'migration' && selectedQR.customization && (
                      (() => {
                        let meta: any = null
                        try {
                          if (typeof selectedQR.customization === 'string') meta = JSON.parse(selectedQR.customization)
                          else meta = selectedQR.customization
                        } catch { meta = selectedQR.customization }
                        const key = meta?.key
                        const updateUrl = meta?.url_update || (key ? `${typeof window !== 'undefined' ? window.location.origin : ''}/qr-redirect/${key}` : null)
                        const redirectUrl = key ? `${typeof window !== 'undefined' ? window.location.origin : ''}/qr-redirect/${key}` : null
                        if (!key) return null
                        const copy = (value: string, label: string) => {
                          try { navigator.clipboard.writeText(value); toast.success(`${label} copied`) } catch { toast.error('Copy failed') }
                        }
                        return (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                                Migration Key
                                <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200">Migration</span>
                              </label>
                              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                                <code className="text-sm text-gray-800 dark:text-gray-100 break-all flex-1">{key}</code>
                                <button onClick={() => copy(key, 'Key')} className="text-xs px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Copy</button>
                              </div>
                            </div>
                            {redirectUrl && (
                              <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Scan Redirect URL</label>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg relative group">
                                  <a href={redirectUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 underline break-all flex-1 pr-10">{redirectUrl}</a>
                                  <button onClick={() => copy(redirectUrl, 'Redirect URL')} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
                                </div>
                              </div>
                            )}
                            {updateUrl && updateUrl !== redirectUrl && (
                              <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Update URL</label>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg relative group">
                                  <a href={updateUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 underline break-all flex-1 pr-10">{updateUrl}</a>
                                  <button onClick={() => copy(updateUrl, 'Update URL')} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Category
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {categories.find((c) => c.id === selectedQR.categoryId)?.name || "Uncategorized"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tags</label>
                      <div className="flex flex-wrap gap-1">
                        {parseTags(selectedQR.tags).length > 0 ? (
                          parseTags(selectedQR.tags).map((tag, index) => (
                            <span key={`item-${index}`} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-sm">No tags</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Scans</label>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(selectedQR as any).scans || 0}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                      <button
                        onClick={async () => {
                          try {
                            const newStatus = !selectedQR.isActive
                            await qrCodeService.updateQRCode(selectedQR.id, { isActive: newStatus })
                            await refreshQRCodes()
                            setSelectedQR({ ...selectedQR, isActive: newStatus })
                            toast.success(`QR code ${newStatus ? "activated" : "deactivated"}!`)
                          } catch (_error) {
                            toast.error("Failed to update status")
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer hover:opacity-80 ${
                          selectedQR.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${selectedQR.isActive ? "bg-green-400" : "bg-red-400"}`}
                        ></div>
                        {selectedQR.isActive ? "Active" : "Inactive"}
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Created</label>
                      <p className="text-gray-900 dark:text-white">
                        {formatSafeLocaleDate(selectedQR.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedQR && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Edit QR Code</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
                    <textarea
                      value={editFormData.content}
                      onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      value={editFormData.categoryId}
                      onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editFormData.isActive}
                        onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform md:hover:scale-105 active:scale-95 shadow-lg md:hover:shadow-xl"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 transform md:hover:scale-105 active:scale-95 shadow-lg md:hover:shadow-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedQR && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete QR Code</h3>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Are you sure you want to delete "<strong>{selectedQR.name}</strong>"? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform md:hover:scale-105 active:scale-95 shadow-lg md:hover:shadow-xl"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform md:hover:scale-105 active:scale-95 shadow-lg md:hover:shadow-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals would go here - keeping the existing modal logic */}
        {/* View Modal, Edit Modal, Delete Modal - unchanged from original */}
      </div>
    </div>
  )
}

export const QRCodeList: React.FC = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center p-8">Loading QR codes...</div>}>
      <QRCodeListContent />
    </Suspense>
  )
}

export default QRCodeList
