'use client'
import { useEffect, useState, useCallback } from 'react'
import KPICard from '@/components/KPICard'
import { format } from 'date-fns'

interface MailerLiteGroup {
  id: string
  name: string
  color: string
  active_count: number
  unsubscribed_count: number
  unconfirmed_count: number
  bounced_count: number
  open_rate: string
  click_rate: string
  created_at: string
}

interface MailerLiteData {
  groups: MailerLiteGroup[]
  totalActive: number
  fetchedAt: string
}

const COLOR_MAP: Record<string, { card: string; badge: string; dot: string }> = {
  blue:    { card: 'border-blue-500/30',    badge: 'bg-blue-500/10 text-blue-400',    dot: 'bg-blue-400' },
  purple:  { card: 'border-purple-500/30',  badge: 'bg-purple-500/10 text-purple-400', dot: 'bg-purple-400' },
  emerald: { card: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400' },
  slate:   { card: 'border-slate-500/30',   badge: 'bg-slate-500/10 text-slate-400',  dot: 'bg-slate-400' },
}

export default function EmailPage() {
  const [data, setData] = useState<MailerLiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/mailerlite')
    const json = await res.json()
    setData(json)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRefresh = () => { setRefreshing(true); fetchData() }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-slate-400 text-sm animate-pulse">Loading…</div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Email Lists</h1>
          {data?.fetchedAt && (
            <p className="text-xs text-slate-500 mt-0.5">
              Live from MailerLite · {format(new Date(data.fetchedAt), 'MMM d, h:mm a')}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs px-3 py-1.5 rounded border border-[#2a2d3a] text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Active Subs" value={data?.totalActive ?? 0} isNorthStar />
        <KPICard label="Lists" value={data?.groups.length ?? 0} />
        <KPICard
          label="Unsubscribed"
          value={(data?.groups ?? []).reduce((s, g) => s + g.unsubscribed_count, 0)}
        />
        <KPICard
          label="Unconfirmed"
          value={(data?.groups ?? []).reduce((s, g) => s + g.unconfirmed_count, 0)}
        />
      </div>

      {/* Per-group cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(data?.groups ?? []).map(group => {
          const colors = COLOR_MAP[group.color] ?? COLOR_MAP.slate
          return (
            <div key={group.id} className={`card border ${colors.card} space-y-4`}>
              {/* Group header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${colors.dot}`} />
                  <h2 className="text-sm font-semibold text-slate-100 leading-tight">{group.name}</h2>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${colors.badge}`}>
                  {group.active_count} active
                </span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Open Rate</p>
                  <p className="text-lg font-bold text-slate-100">{group.open_rate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Click Rate</p>
                  <p className="text-lg font-bold text-slate-100">{group.click_rate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Unsubscribed</p>
                  <p className="text-base font-semibold text-slate-300">{group.unsubscribed_count}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Unconfirmed</p>
                  <p className="text-base font-semibold text-slate-300">{group.unconfirmed_count}</p>
                </div>
              </div>

              {/* Footer */}
              <p className="text-xs text-slate-600 border-t border-[#2a2d3a] pt-3">
                Created {format(new Date(group.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-600 text-center">
        Data fetched live from MailerLite · no cron needed
      </p>
    </div>
  )
}
