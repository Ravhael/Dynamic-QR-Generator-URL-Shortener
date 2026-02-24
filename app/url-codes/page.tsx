"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  LinkIcon,
  EyeIcon,
  ClockIcon,
  TagIcon 
} from '@heroicons/react/24/outline'
import { toast } from "sonner"

interface URLItem {
  id: string
  original_url: string
  short_code: string
  short_url: string
  title: string
  description?: string
  tags: string[]
  clicks: number
  is_active: boolean
  expires_at?: string
  max_clicks?: number
  custom_domain?: string
  created_at: string
  updated_at: string
  category_name?: string
  category_color?: string
}

function URLCodesContent() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  
  const [urls, setUrls] = useState<URLItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState<string>('')

  useEffect(() => {
    if (categoryId) {
      fetchURLsByCategory(categoryId)
    } else {
      setError('No category specified')
      setLoading(false)
    }
  }, [categoryId])

  const fetchURLsByCategory = async (catId: string) => {
    try {
      console.warn('🔍 Fetching URLs for category:', catId)
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/urls-by-category?category=${catId}`)
      const data = await response.json()
      
      if (data.success) {
        setUrls(data.urls)
        if (data.urls.length > 0) {
          setCategoryName(data.urls[0].category_name || 'Category')
        }
        console.warn('✅ Successfully loaded', data.count, 'URLs')
      } else {
        setError(data.error || 'Failed to load URLs')
        toast.error(data.error || 'Failed to load URLs')
      }
    } catch (err: any) {
      console.error('❌ Error fetching URLs:', err)
      setError('Failed to load URLs. Please try again.')
      toast.error('Failed to load URLs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL copied to clipboard!')
    } catch {
      toast.error('Failed to copy URL')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white text-lg">Loading URLs...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-red-400 text-lg">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/url-categories"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Categories
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            URLs in {categoryName || 'Category'}
          </h1>
          <p className="text-gray-400">
            {urls.length} URL{urls.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* URLs List */}
        {urls.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center">
            <LinkIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No URLs Found</h3>
            <p className="text-gray-400">
              There are no URLs in this category yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {urls.map((url) => (
              <div
                key={url.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {url.title}
                      </h3>
                      {url.category_name && (
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: url.category_color || '#6B7280' }}
                        >
                          {url.category_name}
                        </span>
                      )}
                    </div>
                    
                    {url.description && (
                      <p className="text-gray-400 mb-3">{url.description}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Short URL:</span>
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/u/${url.short_code}`)}
                          className="text-purple-400 hover:text-purple-300 font-mono bg-slate-700 px-2 py-1 rounded"
                        >
                          {`${typeof window !== 'undefined' ? window.location.origin : ''}/u/${url.short_code}`}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Original:</span>
                        <a
                          href={url.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 truncate max-w-md"
                        >
                          {url.original_url}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <EyeIcon className="h-4 w-4" />
                        <span>{url.clicks} clicks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>Created {formatDate(url.created_at)}</span>
                      </div>
                      {url.tags && url.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <TagIcon className="h-4 w-4" />
                          <span>{url.tags.join(', ')}</span>
                        </div>
                      )}
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

export default function URLCodesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <URLCodesContent />
    </Suspense>
  )
}
