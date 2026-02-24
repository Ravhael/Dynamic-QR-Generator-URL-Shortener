"use client"

import React, { useState, useEffect } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  SparklesIcon,
  QrCodeIcon,
  TagIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline"
import { FolderIcon as FolderSolidIcon } from "@heroicons/react/24/solid"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { qrCategoryService } from "../../services/api"
import type { QRCategory } from "../../app/api/qrCategoryService"

interface CategoriesProps {
  type?: "qr"
}

export const QRCategories: React.FC<CategoriesProps> = () => {
  const [categories, setCategories] = useState<QRCategory[]>([])
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<QRCategory | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  })

  const router = useRouter()

  // Fetch category data and counts
  const fetchCategories = async (page: number = 1) => {
    try {
      console.warn("🔍 QRCategories: Starting to fetch categories...")
      setLoading(true)
      setError(null)
      
      // Fetch categories and their QR codes count in parallel
      const [categoryRes, countRes] = await Promise.all([
        qrCategoryService.getQRCategories(page, pagination.itemsPerPage),
        qrCategoryService.getQRCategoriesCount()
      ]);
      
      console.warn("📝 QRCategories: Category response:", categoryRes)
      console.warn("📊 QRCategories: Count response:", countRes)
      
      setCategories(categoryRes?.categories || [])
      setCategoryCounts(countRes?.counts || {})
      
      if (categoryRes?.pagination) {
        setPagination(categoryRes.pagination)
      }
      
      console.warn("✅ QRCategories: Categories and counts loaded successfully")
    } catch (err) {
      console.error("❌ QRCategories: Error fetching categories:", err)
      setError("Failed to load categories. Please try again.")
      toast.error("Failed to load categories. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.warn("🚀 QRCategories: Component mounted, fetching categories...")
    fetchCategories()
  }, [])

  // Get QR count for a specific category from the fetched counts
  const getTotalQR = (catId: string) => categoryCounts[catId] || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await qrCategoryService.updateQRCategory(editingCategory.id, formData)
        toast.success("Category updated successfully!")
        setEditingCategory(null)
      } else {
        await qrCategoryService.createQRCategory(formData)
        toast.success("Category created successfully!")
      }
      fetchCategories()
      setFormData({ name: "", description: "", color: "#3B82F6" })
      setShowAddForm(false)
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save category.")
      setError(err.response?.data?.error || "Failed to save category.")
    }
  }

  const handleEdit = (category: QRCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#3B82F6",
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? All items in this category will become uncategorized.",
      )
    ) {
      try {
        await qrCategoryService.deleteQRCategory(id)
        toast.success("Category deleted!")
        fetchCategories()
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to delete category.")
        setError(err.response?.data?.error || "Failed to delete category.")
      }
    } else {
      toast.info("Delete cancelled")
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingCategory(null)
    setFormData({ name: "", description: "", color: "#3B82F6" })
    toast.info("Action cancelled")
  }

  const handleCategoryClick = (category: QRCategory) => {
    router.push(`/qr-codes?category=${encodeURIComponent(category.id)}`)
  }

  // Bulk operations
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(categories.map(cat => cat.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select categories to delete")
      return
    }

    const hasQRCodes = selectedCategories.some(catId => getTotalQR(catId) > 0)
    
    if (hasQRCodes) {
      toast.error("Cannot delete categories that contain QR codes. Please move or delete the QR codes first.")
      return
    }

    const confirmMessage = `Are you sure you want to delete ${selectedCategories.length} selected categories? This action cannot be undone.`
    
    if (!window.confirm(confirmMessage)) {
      toast.info("Bulk delete cancelled")
      return
    }

    try {
      setBulkLoading(true)
      await qrCategoryService.bulkDeleteCategories(selectedCategories)
      toast.success(`Successfully deleted ${selectedCategories.length} categories`)
      setSelectedCategories([])
      fetchCategories(pagination.currentPage)
    } catch (err: any) {
      console.error("Bulk delete error:", err)
      toast.error(err.response?.data?.error || "Failed to delete categories")
    } finally {
      setBulkLoading(false)
    }
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    fetchCategories(page)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Header with Glassmorphism */}
        <div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-gray-700 text-white"><TagIcon className="h-7 w-7" /></div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100">QR Categories</h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2">Organize and manage your QR codes efficiently</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <FolderIcon className="h-4 w-4" />
                      <span>{categories.length} Categories</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <QrCodeIcon className="h-4 w-4" />
                      <span>Categories Management</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <div className="flex items-center space-x-2"><PlusIcon className="h-5 w-5" /><span>Create Category</span></div>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Error Display */}
        {error && (
          <div>
            <div className="bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-center space-x-3">
                <XMarkIcon className="h-5 w-5 text-red-500" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modern Add/Edit Form */}
        {showAddForm && (
          <div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-indigo-600 text-white">
                    {editingCategory ? (
                      <PencilIcon className="h-6 w-6 text-white" />
                    ) : (
                      <PlusIcon className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {editingCategory ? "Edit Category" : "Create New Category"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {editingCategory
                        ? "Update your category details"
                        : "Add a new category to organize your QR codes"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Category Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="Enter category name..."
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <TagIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Category Color
                    </label>
                    <div className="relative">
                      <input type="color" value={formData.color} onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))} className="w-full h-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer" />
                      <div
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: formData.color }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={4} placeholder="Describe what this category will contain..." className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none" />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>{editingCategory ? "Update Category" : "Create Category"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Enhanced Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={`item-${i}`}>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 animate-pulse shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded" />
                      <div className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-6"><FolderIcon className="h-8 w-8 text-gray-400" /></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Categories Yet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">Start organizing your QR codes by creating your first category.</p>
            <button onClick={() => setShowAddForm(true)} className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"><PlusIcon className="h-5 w-5" /><span>Create Your First Category</span></button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bulk Operations Controls */}
            {categories.length > 0 && (
              <div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md text-xs sm:text-sm font-medium transition-colors"
                      >
                        <Squares2X2Icon className="h-4 w-4" />
                        <span>
                          {selectedCategories.length === categories.length ? 'Deselect All' : 'Select All'}
                        </span>
                      </button>
                      
                      {selectedCategories.length > 0 && (
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedCategories.length} selected
                          </span>
                          <button
                            onClick={handleBulkDelete}
                            disabled={bulkLoading}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span>{bulkLoading ? 'Deleting...' : 'Delete Selected'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Pagination Info */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        Showing {categories.length} of {pagination.totalItems} categories
                      </span>
                      <span>
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div key={category.id} className="group">
                  {/* Selection Checkbox */}
                  <div className="absolute mt-4 ml-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleSelectCategory(category.id)}
                      className="w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-colors">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className="flex items-center space-x-4 cursor-pointer flex-1"
                        onClick={() => handleCategoryClick(category)}
                        title={`View all QR codes in ${category.name}`}
                      >
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600" style={{ backgroundColor: `${category.color}15` }}>
                          <FolderSolidIcon className="h-6 w-6" style={{ color: category.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {category.name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="flex items-center space-x-1 px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-[11px] font-medium text-gray-600 dark:text-gray-300">
                              <QrCodeIcon className="h-3 w-3" />
                              <span>
                                {getTotalQR(category.id)} QR Code{getTotalQR(category.id) !== 1 ? "s" : ""}
                              </span>
                            </div>
                            {getTotalQR(category.id) > 0 && (<div className="w-2 h-2 bg-green-500 rounded-full" />)}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button onClick={() => handleEdit(category)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-md transition-colors" title="Edit Category"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(category.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-md transition-colors" title="Delete Category"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed min-h-[3rem]">
                        {category.description || "No description provided for this category."}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button onClick={() => handleCategoryClick(category)} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"><EyeIcon className="h-4 w-4" /><span>View QR Codes</span></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} categories
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.hasPreviousPage} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const startPage = Math.max(1, pagination.currentPage - 2)
                          const pageNumber = startPage + i
                          
                          if (pageNumber > pagination.totalPages) return null
                          
                          return (
                            <button key={pageNumber} onClick={() => handlePageChange(pageNumber)} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${pageNumber === pagination.currentPage ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>{pageNumber}</button>
                          )
                        })}
                      </div>
                      
                      <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.hasNextPage} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
