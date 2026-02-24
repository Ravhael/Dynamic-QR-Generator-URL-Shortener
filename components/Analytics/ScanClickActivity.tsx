"use client"

import React from 'react'
import { format } from 'date-fns'
import { VirtualizedTable } from '@/components/VirtualizedTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type ActivityItem = {
  id: string
  type: 'scan' | 'click'
  source_id: string
  item_name: string | null
  item_type: string | null
  timestamp: string
  ip_address?: string | null
  device_type?: string | null
  country?: string | null
  city?: string | null
}

export default function ScanClickActivity() {
  const [type, setType] = React.useState<'all' | 'scan' | 'click'>('all')
  const [q, setQ] = React.useState('')
  const [from, setFrom] = React.useState<string>('')
  const [to, setTo] = React.useState<string>('')
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(25)
  const [items, setItems] = React.useState<ActivityItem[]>([])
  const [totalItems, setTotalItems] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const buildUrl = React.useCallback(() => {
    const qs = new URLSearchParams()
    qs.set('page', String(page))
    qs.set('limit', String(limit))
    if (type !== 'all') qs.set('type', type)
    if (q.trim()) qs.set('q', q.trim())
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    return `/api/scan-click-activity?${qs.toString()}`
  }, [page, limit, type, q, from, to])

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildUrl(), { cache: 'no-store' })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(`Request failed: ${res.status} ${t}`)
      }
      const json = await res.json()
      setItems(json?.data?.items ?? [])
      setTotalItems(json?.data?.pagination?.total ?? 0)
    } catch (e: any) {
      setError(e?.message || 'Failed to load activity')
      setItems([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [buildUrl])

  React.useEffect(() => {
    // initial load
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch when page or limit changes
  React.useEffect(() => {
    loadData()
  }, [page, limit, loadData])

  const columns = React.useMemo(
    () => [
      {
        key: 'type',
        label: 'Type',
        width: 100,
        render: (_value: any, row: ActivityItem) => (row.type === 'scan' ? 'Scan QR' : 'URL Click'),
      },
      {
        key: 'item_name',
        label: 'Item',
        width: 260,
        render: (value: any) => value || '-',
      },
      {
        key: 'item_type',
        label: 'Item Type',
        width: 120,
        render: (value: any) => value || '-',
      },
      {
        key: 'timestamp',
        label: 'Timestamp',
        width: 200,
        render: (value: any) => {
          try {
            return format(new Date(value), 'yyyy-MM-dd HH:mm:ss')
          } catch {
            return String(value)
          }
        },
      },
      {
        key: 'device_type',
        label: 'Device',
        width: 120,
        render: (value: any) => value || '-',
      },
      {
        key: 'country',
        label: 'Location',
        width: 160,
        render: (_value: any, row: ActivityItem) => [row.city, row.country].filter(Boolean).join(', ') || '-',
      },
      {
        key: 'ip_address',
        label: 'IP',
        width: 140,
        render: (value: any) => value || '-',
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-full sm:w-40 min-w-0">
          <label className="block text-xs text-muted-foreground mb-1">Type</label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="scan">Scan</SelectItem>
              <SelectItem value="click">Click</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-56 min-w-0">
          <label className="block text-xs text-muted-foreground mb-1">Search</label>
          <Input className="w-full" value={q} onChange={(e) => setQ(e.target.value)} placeholder="QR name or URL" />
        </div>

        <div className="w-full sm:w-auto min-w-0 flex-1 sm:flex-none">
          <label className="block text-xs text-muted-foreground mb-1">From</label>
          <Input className="w-full" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="w-full sm:w-auto min-w-0 flex-1 sm:flex-none">
          <label className="block text-xs text-muted-foreground mb-1">To</label>
          <Input className="w-full" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        <div className="ml-auto flex gap-2 flex-wrap">
          <Button className="px-3 py-1.5 text-sm" onClick={() => { setPage(1); loadData() }} disabled={loading}>Apply</Button>
          <Button className="px-3 py-1.5 text-sm" variant="outline" onClick={() => { setType('all'); setQ(''); setFrom(''); setTo(''); setPage(1); setLimit(25); loadData() }}>Reset</Button>
        </div>
      </div>

      <div className="w-full overflow-auto">
        <VirtualizedTable
          data={items}
          columns={columns as any}
          loading={loading}
          pagination={{
            page,
            pageSize: limit,
            totalItems: totalItems,
            onPageChange: (p: number) => setPage(p),
            onPageSizeChange: (s: number) => { setLimit(s); setPage(1) },
          }}
        />
      </div>

      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}
    </div>
  )
}
