"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline"
import { formatDistance } from "date-fns"
import { clsx } from "clsx"
// PERBAIKAN: Import urlCategoryService
import { shortUrlService, urlCategoryService } from "@/lib/api"
import toast, { Toaster } from 'react-hot-toast'

// Define URLCategory interface locally
interface URLCategory {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define ShortURL type locally if not exported from API
interface ShortURL {
  id: string;
  title: string;
  shortUrl: string;
  originalUrl: string;
  userId: string;
  categoryId?: string;
  category?: URLCategory;
  tags?: string[];
  isActive: boolean;
  clicks?: number;
  maxClicks?: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
import { useShortURLPermissions } from "@/hooks/useResourcePermissions"
import { useAuth } from "@/components/contexts/AuthContext"

// URL Action Buttons with Permission Checks
const URLActionButtons: React.FC<{ 
  shortURL: ShortURL; 
  onEdit: () => void; 
  onDelete: () => void; 
  onCopy: () => void; 
  onView: () => void; 
  onVisit: () => void;
  copySuccess: boolean;
}> = ({ shortURL, onEdit, onDelete, onCopy, onView, onVisit, copySuccess }) => {
  const { canUpdate, canDelete, canRead } = useShortURLPermissions(
    undefined,
    undefined,
    undefined
  );
  const { user, isAdmin, canModifyResource } = useAuth();
  const effectiveCanUpdate = canUpdate || isAdmin() || (user && canModifyResource(shortURL.userId));
  const effectiveCanDelete = canDelete || isAdmin() || (user && canModifyResource(shortURL.userId));
  const effectiveCanRead = canRead || isAdmin() || (user && user.id === shortURL.userId);

  return (
    <div className="flex gap-2 justify-end">
  {effectiveCanRead && (
        <button
          onClick={onView}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-2 px-2 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center"
          title="View Details"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
      )}
      
      <button
        onClick={onVisit}
        className="bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white py-2 px-2 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center"
        title="Visit Original URL"
      >
        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
      </button>
      
      <button
        onClick={onCopy}
        className={`bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-2 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center ${copySuccess ? "ring-2 ring-green-400" : ""}`}
        title={copySuccess ? "Copied!" : "Copy Short URL"}
      >
        <ClipboardDocumentIcon className="w-4 h-4" />
      </button>
      
  {effectiveCanUpdate && (
        <button
          onClick={onEdit}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2 px-2 rounded-xl text-xs font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center"
          title="Edit URL"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
      )}
      
  {effectiveCanDelete && (
        <button
          onClick={onDelete}
          className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-2 px-2 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center"
          title="Delete URL"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};


// Create Short URL Button with Permission Check
const CreateShortURLButton: React.FC = () => {
  const { canCreate, loading } = useShortURLPermissions();
  const router = useRouter();

  if (loading) {
    return (
      <div className="inline-flex items-center px-4 py-2 text-sm bg-gray-200 text-gray-400 rounded-xl animate-pulse">
        <LinkIcon className="h-5 w-5 mr-2" />
        Loading...
      </div>
    );
  }

  if (!canCreate) {
    return null; // Hide button if user doesn't have create permission
  }

  return (
    <button
      onClick={() => router.push("/generate-url")}
      className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
    >
      <LinkIcon className="h-5 w-5 mr-2" />
      Create Short URL
    </button>
  );
};

const URLListContent: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [shortURLs, setShortURLs] = useState<ShortURL[]>([])
  const [categories, setCategories] = useState<URLCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedURL, setSelectedURL] = useState<ShortURL | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editFormData, setEditFormData] = useState({
    title: "",
    originalUrl: "",
    categoryId: "",
    tags: "",
    isActive: true,
    expiresAt: "",
    maxClicks: "",
  })
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [selectedURLs, setSelectedURLs] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [perPage, setPerPage] = useState(12)
  const [layout, setLayout] = useState("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 12 })
  // URL statistics
  const [urlStats, setUrlStats] = useState({ total: 0, active: 0, inactive: 0, totalClicks: 0 })
  const layoutOptions = [
    { value: "grid", label: "Grid View" },
    { value: "list", label: "List View" },
    { value: "details", label: "Detailed View" },
  ]
  const perPageOptions = [6, 12, 18, 24, 30]

  // Load short URLs and categories on component mount
  // Handle URL search params
  useEffect(() => {
    const categoryParam = searchParams.get("category")
    if (categoryParam && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchData = async (page = currentPage, limit = perPage, category = selectedCategory) => {
      setIsLoading(true)
      setError(null)
      try {
        const categoriesResponse = await urlCategoryService.getURLCategories()
        let categoriesData = categoriesResponse.categories
        if (!Array.isArray(categoriesData)) categoriesData = []
        setCategories(categoriesData)

        const shortUrlsResponse: any = await shortUrlService.getShortURLs({
          page,
          limit,
          category: category !== "all" ? category : undefined,
        })
        // Handle multiple possible shapes (shortUrls vs shorturls, nested data)
        const rawList = shortUrlsResponse?.shortUrls
          || shortUrlsResponse?.shorturls
          || shortUrlsResponse?.data?.shortUrls
          || shortUrlsResponse?.data?.shorturls
          || []
        const urlList = Array.isArray(rawList) ? rawList : []
        if (urlList.length === 0) {
          // Debug log (will not break UI)
          // eslint-disable-next-line no-console
          console.warn('[URL LIST] Empty list after fetch. Response keys:', Object.keys(shortUrlsResponse || {}))
        }
        setShortURLs(urlList)
        const paginationData = shortUrlsResponse.pagination
          || shortUrlsResponse.data?.pagination
          || { total: urlList.length, page: page, pages: 1, limit }
        setPagination(paginationData)
        // Compute statistics after we know pagination total
        try {
          if (Array.isArray(urlList)) {
            const total = (paginationData as any)?.total ?? urlList.length
            const active = urlList.filter((u: any) => u.isActive).length
            const inactive = urlList.filter((u: any) => !u.isActive).length
            const totalClicks = urlList.reduce((sum: number, u: any) => sum + (u.clicks || 0), 0)
            setUrlStats({ total, active, inactive, totalClicks })
          } else {
            setUrlStats({ total: 0, active: 0, inactive: 0, totalClicks: 0 })
          }
        } catch {
          setUrlStats({ total: 0, active: 0, inactive: 0, totalClicks: 0 })
        }
      } catch (_error: any) {
        setError(_error?.response?.data?.error || "Failed to load data. Please try again.")
        setShortURLs([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [currentPage, perPage, selectedCategory])

  useEffect(() => {
    setCurrentPage(1)
    // eslint-disable-next-line
  }, [selectedCategory, perPage])

  // Refresh short URLs when needed (e.g., after operations)
  const refreshShortURLs = async () => {
    try {
      setIsLoading(true)
      const response = await shortUrlService.getShortURLs()
      const list = (response as any)?.shortUrls || (response as any)?.shorturls || []
      setShortURLs(Array.isArray(list) ? list : [])
      setIsLoading(false)
    } catch (_error: any) {
      console.error("Error refreshing short URLs:", _error)
      setError(_error?.response?.data?.error || "Failed to refresh short URLs.")
      setIsLoading(false)
    }
  }

  const filteredURLs = shortURLs.filter(
    (url) =>
      url.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(url.tags) ? url.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())) : false),
  )

  // Selection handlers
  const handleSelectURL = (id: string) => {
    const next = new Set(selectedURLs)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedURLs(next)
  }

  const handleSelectAll = () => {
    if (selectedURLs.size === filteredURLs.length) {
      setSelectedURLs(new Set())
    } else {
      setSelectedURLs(new Set(filteredURLs.map(u => u.id)))
    }
  }

  const clearSelection = () => setSelectedURLs(new Set())

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedURLs.size === 0) return
    try {
      const ids = Array.from(selectedURLs)
      await shortUrlService.bulkDeleteShortURLs(ids)
      await refreshShortURLs()
      clearSelection()
      toast.success(`${ids.length} URL(s) deleted`)      
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Bulk delete failed')
    }
  }

  const handleBulkStatusUpdate = async (status: boolean) => {
    if (selectedURLs.size === 0) return
    try {
      const ids = Array.from(selectedURLs)
      await shortUrlService.bulkUpdateStatus(ids, status)
      await refreshShortURLs()
      clearSelection()
      toast.success(`${ids.length} URL(s) ${status ? 'activated' : 'deactivated'}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Bulk status update failed')
    }
  }

  const handleCopyLink = (shortURL: ShortURL) => {
    navigator.clipboard.writeText(shortURL.shortUrl)
    setCopySuccess(shortURL.id)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  const handleView = (shortURL: ShortURL) => {
    setSelectedURL(shortURL)
    setShowViewModal(true)
  }

  const handleEdit = (shortURL: ShortURL) => {
    setSelectedURL(shortURL)
    setEditFormData({
      title: shortURL.title,
      originalUrl: shortURL.originalUrl,
      categoryId: shortURL.categoryId || "",
      tags: Array.isArray(shortURL.tags) ? shortURL.tags.join(", ") : "",
      isActive: shortURL.isActive,
      expiresAt: shortURL.expiresAt ? new Date(shortURL.expiresAt).toISOString().split("T")[0] : "",
      maxClicks: shortURL.maxClicks?.toString() || "",
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedURL) return

    try {
      const updateData = {
        title: editFormData.title,
        originalUrl: editFormData.originalUrl,
        categoryId: editFormData.categoryId || undefined,
        tags: editFormData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        isActive: editFormData.isActive,
        expiresAt: editFormData.expiresAt || undefined,
        maxClicks: editFormData.maxClicks ? Number.parseInt(editFormData.maxClicks) : undefined,
      }

      await shortUrlService.updateShortURL(selectedURL.id, updateData)

      // Refresh short URLs from the API
      await refreshShortURLs()

      setShowEditModal(false)
      setSelectedURL(null)
    } catch (_error: any) {
      console.error("Error updating short URL:", _error)
      setError(_error?.response?.data?.error || "Failed to update short URL. Please try again.")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedURL) return

    try {
      await shortUrlService.deleteShortURL(selectedURL.id)

      // Refresh short URLs from the API
      await refreshShortURLs()

      setShowDeleteModal(false)
      setSelectedURL(null)
    } catch (_error: any) {
      console.error("Error deleting short URL:", _error)
      setError(_error?.response?.data?.error || "Failed to delete short URL. Please try again.")
    }
  }

  const handleDelete = (shortURL: ShortURL) => {
    setSelectedURL(shortURL)
    setShowDeleteModal(true)
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await shortUrlService.updateShortURL(id, { isActive: !currentStatus })
      await refreshShortURLs()
    } catch (_error: any) {
      console.error("Error updating short URL status:", _error)
      setError(_error?.response?.data?.error || "Failed to update short URL status. Please try again.")
    }
  }

  const handleVisitURL = (shortURL: ShortURL) => {
    // Open original URL in new tab
    window.open(shortURL.originalUrl, "_blank")
  }

  const categoryOptions = ["all", ...(categories || []).map((cat) => cat.name)]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Short URL Gallery</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl">Manage and organize your short URLs efficiently.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Short URL</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{urlStats.total}</p>
              <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <QrCodeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">{urlStats.active}</p>
              <div className="w-9 h-9 rounded-md bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Inactive</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xl font-semibold text-red-600 dark:text-red-400">{urlStats.inactive}</p>
              <div className="w-9 h-9 rounded-md bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Clicks</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">{urlStats.totalClicks}</p>
              <div className="w-9 h-9 rounded-md bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <EyeIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <Toaster position="top-right" />

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-8 shadow-sm space-y-4">
          {selectedURLs.size > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{selectedURLs.size} URL(s) selected</span>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handleBulkStatusUpdate(true)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md">Activate</button>
                <button onClick={() => handleBulkStatusUpdate(false)} className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-md">Deactivate</button>
                <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md">Delete</button>
                <button onClick={clearSelection} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-md">Clear</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search short URLs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-3 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white appearance-none"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Layout Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              {layoutOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLayout(option.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                    layout === option.value
                      ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  }`}
                >
                  <span className="hidden sm:inline">{option.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {/* Per Page */}
            <div className="relative">
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number.parseInt(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white appearance-none"
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

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-800 rounded-full border-t-indigo-600 animate-spin" />
          </div>
        ) : filteredURLs.length === 0 ? (
          <div className="text-center py-16">
            <LinkIcon className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">No short URLs found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{searchTerm ? "Adjust your search terms." : "Create your first short URL to begin."}</p>
            <div className="mt-4"><CreateShortURLButton /></div>
          </div>
        ) : (
          <>
            {/* Short URLs Grid */}
            <div
              className={clsx("grid gap-6 mb-8", {
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4": layout === "grid",
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3": layout === "list",
                "grid-cols-1 lg:grid-cols-2": layout === "details",
              })}
            >
              {filteredURLs.map((shortURL) => (
                <div
                  key={shortURL.id}
                  className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm transition-colors"
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedURLs.has(shortURL.id)}
                      onChange={() => handleSelectURL(shortURL.id)}
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </div>
                  {/* Header with Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          shortURL.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                      >
                        {shortURL.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        {shortURL.category?.name}
                      </span>
                    </div>
                  </div>

                  {/* Link Preview */}
                  <div className="relative mb-4 flex justify-center">
                    <div className="w-20 h-20 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                      <LinkIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">
                        {shortURL.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{shortURL.originalUrl}</p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(shortURL.tags) && shortURL.tags.length > 0 ? (
                        shortURL.tags.map((tag: string, idx: number) => (
                          <span key={`item-${idx}`} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">No tags</span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <EyeIcon className="w-4 h-4" />
                        <span>{shortURL.clicks || 0} clicks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>
                          Updated {formatDistance(new Date(shortURL.updatedAt), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons (QR style replicated) */}
                    <div className="grid grid-cols-5 gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {/* View */}
                      <button
                        onClick={() => handleView(shortURL)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded-md text-[11px] font-medium flex items-center justify-center"
                        title="View Short URL"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => handleEdit(shortURL)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-2 rounded-md text-[11px] font-medium flex items-center justify-center"
                        title="Edit Short URL"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      {/* Copy */}
                      <button
                        onClick={() => handleCopyLink(shortURL)}
                        className={clsx("bg-purple-600 hover:bg-purple-700 text-white py-2 px-2 rounded-md text-[11px] font-medium flex items-center justify-center", copySuccess === shortURL.id && "ring-2 ring-green-400")}
                        title={copySuccess === shortURL.id ? 'Copied!' : 'Copy Short URL'}
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </button>
                      {/* Visit (open original) */}
                      <button
                        onClick={() => window.open(shortURL.originalUrl, '_blank')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-2 rounded-md text-[11px] font-medium flex items-center justify-center"
                        title="Open Original URL"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(shortURL)}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-2 rounded-md text-[11px] font-medium flex items-center justify-center"
                        title="Delete Short URL"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Select All Toggle (only if results) */}
            {filteredURLs.length > 0 && (
              <div className="flex items-center mb-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-300">
                  <input type="checkbox" onChange={handleSelectAll} checked={selectedURLs.size === filteredURLs.length && filteredURLs.length > 0} className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded" />
                  <span>Select All</span>
                </label>
              </div>
            )}
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
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
                          "w-8 h-8 rounded-md text-xs font-medium border",
                          isActive
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
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
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* View Modal */}
        {showViewModal && selectedURL && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Short URL Details</h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    aria-label="Close"
                  >✕</button>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedURL.title}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Short URL</label>
                    <p className="text-blue-600 font-mono break-all text-xs">{selectedURL.shortUrl}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Original URL</label>
                    <p className="text-gray-900 dark:text-white break-all bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {selectedURL.originalUrl}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                    <p className="text-gray-900 dark:text-white text-sm">{selectedURL.category?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tags</label>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(selectedURL.tags) && selectedURL.tags.length > 0 ? (
                        selectedURL.tags.map((tag: string, idx: number) => (
                          <span key={`item-${idx}`} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-xs">No tags</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Clicks</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedURL.clicks || 0}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer hover:opacity-80 ${
                        selectedURL.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      {selectedURL.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created</label>
                    <p className="text-gray-900 dark:text-white text-sm">
                      {new Date(selectedURL.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedURL.expiresAt && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Expires</label>
                      <p className="text-gray-900 dark:text-white text-sm">
                        {new Date(selectedURL.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedURL && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Short URL</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    aria-label="Close"
                  >✕</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Original URL</label>
                    <input
                      type="url"
                      value={editFormData.originalUrl}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, originalUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Category</label>
                    <select
                      value={editFormData.categoryId}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    >
                      <option value="">Pilih Kategori</option>
                      {(categories || []).map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Tags</label>
                    <input
                      type="text"
                      value={editFormData.tags}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, tags: e.target.value }))}
                      placeholder="tag1, tag2, tag3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Expiration Date</label>
                      <input
                        type="date"
                        value={editFormData.expiresAt}
                        onChange={(e) => setEditFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Max Clicks</label>
                      <input
                        type="number"
                        value={editFormData.maxClicks}
                        onChange={(e) => setEditFormData((prev) => ({ ...prev, maxClicks: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editFormData.isActive}
                        onChange={(e) => setEditFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleSaveEdit} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-md text-sm font-medium">Save</button>
                    <button onClick={() => setShowEditModal(false)} className="px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedURL && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Delete Short URL</h3>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    aria-label="Close"
                  >✕</button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete <span className="font-medium">{selectedURL.title}</span>? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={handleDeleteConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-md text-sm font-medium">Delete</button>
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2.5 px-4 rounded-md text-sm font-medium">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const URLList: React.FC = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <URLListContent />
    </Suspense>
  )
}
