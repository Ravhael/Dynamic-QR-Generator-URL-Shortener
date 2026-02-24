"use client"

import React, { useState, useEffect } from "react"
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  SparklesIcon,
  LinkIcon,
  TagIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  FunnelIcon,
  CheckIcon
} from "@heroicons/react/24/outline"
import { FolderIcon as FolderSolidIcon } from "@heroicons/react/24/solid"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { urlCategoryService } from "@/lib/api"
import type { URLCategory } from "../../app/api/urlCategoryService"

interface CategoriesProps {
  type?: "url"
}

export const URLCategories: React.FC<CategoriesProps> = () => {
  const [categories, setCategories] = useState<URLCategory[]>([])
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<URLCategory | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  
  // Bulk delete state  
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  })

  const router = useRouter()

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCategories = categories.slice(startIndex, endIndex)
  const totalItems = categories.length

  useEffect(() => {
    setTotalPages(Math.ceil(totalItems / itemsPerPage))
  }, [totalItems, itemsPerPage])

  // Fetch category data and counts
  const fetchCategories = async () => {
    try {
      console.warn("🔍 urlCategories: Starting to fetch categories...")
      setLoading(true)
      setError(null)
      
      // Fetch categories from database
      const categoryRes = await urlCategoryService.getURLCategories();
      
      console.warn("📝 urlCategories: Category response:", categoryRes)
      
      setCategories(categoryRes?.categories || [])
      
      // Fetch category counts from database
      console.warn("🔢 urlCategories: Fetching category counts...")
      const countRes = await urlCategoryService.getCategoryCounts();
      console.warn("📊 urlCategories: Count response:", countRes)
      
      setCategoryCounts(countRes?.counts || {})
      
      console.warn("✅ urlCategories: Categories and counts loaded successfully")
    } catch (err) {
      console.error("❌ urlCategories: Error fetching categories:", err)
      setError("Failed to load categories. Please try again.")
      toast.error("Failed to load categories. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.warn("🚀 urlCategories: Component mounted, fetching categories...")
    fetchCategories()
  }, [])

  // Get url count for a specific category from the fetched counts
  const getTotalurl = (catId: string) => categoryCounts[catId] || 0

  // Bulk delete functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleIds = paginatedCategories.map((category: URLCategory) => category.id)
      setSelectedItems(visibleIds)
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedItems.length} categories? All URLs in these categories will become uncategorized. This action cannot be undone.`
    )
    
    if (!confirmDelete) return

    try {
      setBulkDeleteLoading(true)
      
      // Call bulk delete API
      const response = await fetch('/api/url-categories/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedItems
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete categories')
      }
      
      toast.success(`Successfully deleted ${result.deletedCount} categories`)
      if (result.updatedUrls > 0) {
        toast.info(`${result.updatedUrls} URLs were moved to uncategorized`)
      }
      
      // Refresh data
      await fetchCategories()
      setSelectedItems([])
      
      // Adjust current page if needed
      const newTotalPages = Math.ceil((categories.length - selectedItems.length) / itemsPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }
      
    } catch (error: any) {
      console.error('Bulk delete failed:', error)
      toast.error(error.message || 'Failed to delete selected categories. Please try again.')
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  // Pagination functions
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setSelectedItems([]) // Clear selection when changing pages
    }
  }

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1)
    setSelectedItems([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await urlCategoryService.updateURLCategory(editingCategory.id, formData)
        toast.success("Category updated successfully!")
        setEditingCategory(null)
      } else {
        await urlCategoryService.createURLCategory(formData)
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

  const handleEdit = (category: URLCategory) => {
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
        await urlCategoryService.deleteURLCategory(id)
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

  const handleCategoryClick = (category: URLCategory) => {
    console.warn('🔍 Redirecting to URL list for category:', category.id, category.name)
    router.push(`/url-list?category=${category.id}`)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Modern Header with Shadow */}
        <div className="relative">
          <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start md:items-center space-x-4">
                <div className="flex-shrink-0 bg-gray-500 p-3 rounded-lg">
                  <TagIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
                    URL Categories
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base mt-1">
                    Organize and manage your URL codes with beautiful categories
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <FolderIcon className="h-4 w-4" />
                      <span>{categories.length} Categories</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="h-4 w-4" />
                      <span>Categories Management</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <div className="flex items-center space-x-2"><PlusIcon className="h-4 w-4" /><span>Create Category</span></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedItems.length > 0 && (
          <div className="relative">
            <div className="relative bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={() => setSelectedItems([])}
                    className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
                  >
                    Clear selection
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteLoading}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>{bulkDeleteLoading ? 'Deleting...' : 'Delete Selected'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination and Stats Bar */}
        {!loading && categories.length > 0 && (
          <div className="relative">
            <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                {/* Stats */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <FolderIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} categories
                    </span>
                  </div>
                  {selectedItems.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {selectedItems.length} selected
                      </span>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-4">
                  {/* Items per page */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value={6}>6</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                  </div>

                  {/* Select All */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={selectedItems.length === paginatedCategories.length && paginatedCategories.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="selectAll" className="text-sm text-gray-600 dark:text-gray-400">
                      Select all on page
                    </label>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first page, last page, current page, and pages around current
                            return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                          })
                          .map((page, index, array) => (
                            <React.Fragment key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                              <button
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 text-sm rounded transition-colors ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          ))}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Error Display */}
        {error && (
          <div className="relative">
            <div className="relative bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-xl shadow-sm">
              <div className="flex items-center space-x-3">
                <XMarkIcon className="h-5 w-5 text-red-500" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modern Add/Edit Form */}
        {showAddForm && (
          <div className="relative">
            <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-500 rounded-xl">
                    {editingCategory ? (
                      <PencilIcon className="h-6 w-6 text-white" />
                    ) : (
                      <PlusIcon className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {editingCategory ? "Edit Category" : "Create New Category"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {editingCategory
                        ? "Update your category details"
                        : "Add a new category to organize your url codes"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
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
                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <TagIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Category Color
                    </label>
                    <div className="relative">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                        className="w-full h-12 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded cursor-pointer focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                      />
                      <div
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg"
                        style={{ backgroundColor: formData.color }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Describe what this category will contain..."
                    className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gray-700 text-white rounded font-semibold shadow-sm"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>{editingCategory ? "Update Category" : "Create Category"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-medium"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={`skeleton-${i}`} className="relative">
                <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-6"><FolderIcon className="h-8 w-8 text-gray-400" /></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Categories Yet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">Start organizing your url codes by creating your first category.</p>
            <button onClick={() => setShowAddForm(true)} className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"><PlusIcon className="h-5 w-5" /><span>Create Your First Category</span></button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedCategories.map((category) => (
              <div key={category.id} className="group relative">
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <div className={`transition-all duration-200 ${
                    selectedItems.includes(category.id) 
                      ? 'scale-100 opacity-100' 
                      : 'scale-95 opacity-60 group-hover:scale-100 group-hover:opacity-100'
                  }`}>
                    <label className="relative flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(category.id)}
                        onChange={(e) => handleSelectItem(category.id, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                        selectedItems.includes(category.id)
                          ? 'bg-indigo-600 border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                      }`}>
                        {selectedItems.includes(category.id) && (
                          <CheckIcon className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Card */}
                <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm transition-all duration-200">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start md:items-center justify-between mb-4">
                      <div
                        className="flex items-center space-x-4 cursor-pointer flex-1"
                        onClick={() => handleCategoryClick(category)}
                        title={`View all url codes in ${category.name}`}
                      >
                        <div className="relative w-12 h-12 rounded-lg flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 shadow-sm" style={{ backgroundColor: `${category.color}22` }}>
                          <FolderSolidIcon
                            className="h-6 w-6"
                            style={{ color: category.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                            {category.name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                              <LinkIcon className="h-3 w-3" />
                              <span>
                                {getTotalurl(category.id)} url Code{getTotalurl(category.id) !== 1 ? "s" : ""}
                              </span>
                            </div>
                            {getTotalurl(category.id) > 0 && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded transition-all duration-200"
                          title="Edit Category"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded transition-all duration-200"
                          title="Delete Category"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed min-h-[3rem] line-clamp-3">
                        {category.description || ''}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleCategoryClick(category)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>
                          View url Codes
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default URLCategories
