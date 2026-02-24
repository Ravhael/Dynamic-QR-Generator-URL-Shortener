"use client"

import React, { useState, useMemo, useCallback, memo } from 'react'
import { debounce } from 'lodash-es'
import { Search, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Column<T> {
  key: keyof T
  label: string
  width?: number | string
  render?: (value: any, item: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
}

interface VirtualizedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  height?: number
  itemHeight?: number
  loading?: boolean
  onItemClick?: ((item: T) => void) | undefined
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  pagination?: {
    page: number
    pageSize: number
    totalItems: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
}

// Memoized row component for better performance
const TableRow = memo(<T extends Record<string, any>>({
  item,
  columns,
  onItemClick,
  index,
}: {
  item: T
  columns: Column<T>[]
  onItemClick?: ((item: T) => void) | undefined
  index: number
}) => {
  return (
    <div
      className={`
        flex items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700
        hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
        ${onItemClick ? 'cursor-pointer' : ''}
        ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
      `}
      onClick={() => onItemClick?.(item)}
    >
      {columns.map((column) => (
        <div
          key={String(column.key)}
          className="flex-shrink-0 px-2"
          style={{ width: column.width || 'auto' }}
        >
          {column.render
            ? column.render(item[column.key], item)
            : String(item[column.key] || '')
          }
          </div>
        ))}
    </div>
  )
}) as <T extends Record<string, any>>(_props: {
  item: T
  columns: Column<T>[]
  onItemClick?: ((item: T) => void) | undefined
  index: number
}) => React.ReactElement

// Optimized search and filter hook
function useTableFiltering<T>(
  data: T[],
  searchTerm: string,
  filters: Record<string, any>,
  sortConfig: { key: keyof T; direction: 'asc' | 'desc' } | null
) {
  return useMemo(() => {
    let filtered = [...data]

    // Apply search
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase()
      filtered = filtered.filter((item) =>
        Object.values(item as Record<string, any>).some((value) =>
          String(value).toLowerCase().includes(lowercaseSearch)
        )
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        filtered = filtered.filter((item) => {
          const itemValue = (item as any)[key]
          return String(itemValue).toLowerCase().includes(String(value).toLowerCase())
        })
      }
    })

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchTerm, filters, sortConfig])
}

// Virtual scrolling hook
function useVirtualScrolling<T>(
  data: T[],
  containerHeight: number,
  itemHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const containerTop = scrollTop
    const containerBottom = scrollTop + containerHeight

    const startIndex = Math.max(0, Math.floor(containerTop / itemHeight) - overscan)
    const endIndex = Math.min(
      data.length,
      Math.ceil(containerBottom / itemHeight) + overscan
    )

    return { startIndex, endIndex }
  }, [scrollTop, containerHeight, itemHeight, data.length, overscan])

  return {
    visibleRange,
    setScrollTop,
    totalHeight: data.length * itemHeight,
  }
}

export function VirtualizedTable<T extends Record<string, any>>({
  data,
  columns,
  height = 600,
  itemHeight = 50,
  loading = false,
  onItemClick,
  searchable = true,
  filterable = true,
  sortable = true,
  pagination,
}: VirtualizedTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T
    direction: 'asc' | 'desc'
  } | null>(null)

  // Debounced search to improve performance
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value)
    }, 300),
    []
  )

  // Filtered and sorted data
  const processedData = useTableFiltering(data, searchTerm, filters, sortConfig)

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData
    
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return processedData.slice(start, end)
  }, [processedData, pagination])

  // Virtual scrolling for large datasets
  const containerHeight = height - 100
  const { visibleRange, setScrollTop, totalHeight } = useVirtualScrolling(
    paginatedData,
    containerHeight,
    itemHeight
  )

  const handleSort = useCallback((key: keyof T) => {
    if (!sortable) return
    
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null
      }
      return { key, direction: 'asc' }
    })
  }, [sortable])

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [setScrollTop])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const visibleItems = paginatedData.slice(visibleRange.startIndex, visibleRange.endIndex)

  return (
    <div className="w-full">
      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className="mb-4 space-y-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                className="pl-10"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
          )}
          
          {filterable && (
            <div className="flex gap-2 flex-wrap">
              {columns
                .filter((col) => col.filterable)
                .map((column) => (
                  <Select
                    key={String(column.key)}
                    value={filters[String(column.key)] || ''}
                    onValueChange={(value) =>
                      handleFilterChange(String(column.key), value)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={`Filter ${column.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All {column.label}</SelectItem>
                      {Array.from(
                        new Set(
                          data.map((item) => String(item[column.key] || ''))
                        )
                      )
                        .filter(Boolean)
                        .map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-medium text-sm text-gray-700 dark:text-gray-300">
        {columns.map((column) => (
          <div
            key={String(column.key)}
            className={`flex-shrink-0 px-2 flex items-center ${
              sortable && column.sortable !== false ? 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100' : ''
            }`}
            style={{ width: column.width || 'auto' }}
            onClick={() => column.sortable !== false && handleSort(column.key)}
          >
            {column.label}
            {sortable && column.sortable !== false && sortConfig?.key === column.key && (
              <ChevronDown
                className={`ml-1 h-3 w-3 transition-transform ${
                  sortConfig.direction === 'asc' ? 'rotate-180' : ''
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Virtual Scrolling Table Body */}
      <div 
        style={{ height: containerHeight, overflowY: 'auto' }}
        onScroll={handleScroll}
        className="relative"
      >
        {paginatedData.length > 50 ? (
          /* Use virtual scrolling for large datasets */
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div
              style={{
                transform: `translateY(${visibleRange.startIndex * itemHeight}px)`,
                position: 'absolute',
                width: '100%',
              }}
            >
              {visibleItems.map((item, index) => (
                <TableRow
                  key={`${visibleRange.startIndex + index}`}
                  item={item}
                  columns={columns}
                  onItemClick={onItemClick}
                  index={visibleRange.startIndex + index}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Regular rendering for smaller datasets */
          <div>
            {paginatedData.map((item, index) => (
              <TableRow
                key={`item-${index}`}
                item={item}
                columns={columns}
                onItemClick={onItemClick}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Show
            </span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => pagination.onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {pagination.page} of{' '}
              {Math.ceil(pagination.totalItems / pagination.pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={
                pagination.page >= Math.ceil(pagination.totalItems / pagination.pageSize)
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* No data message */}
      {paginatedData.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}
    </div>
  )
}

// Hook for infinite scrolling
export function useInfiniteScroll<T>(
  fetchMore: () => Promise<T[]>,
  hasMore: boolean
) {
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    try {
      await fetchMore()
    } finally {
      setLoading(false)
    }
  }, [fetchMore, hasMore, loading])

  return { loadMore, loading }
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    componentCount: 0,
    memoryUsage: 0,
  })

  const measureRender = useCallback(() => {
    const start = performance.now()
    return () => {
      const end = performance.now()
      setMetrics(prev => ({
        ...prev,
        renderTime: end - start,
      }))
    }
  }, [])

  return { metrics, measureRender }
}

export default VirtualizedTable
