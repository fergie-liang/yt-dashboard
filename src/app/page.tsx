'use client'
import { useEffect, useState, useCallback } from 'react'
import { getKPIs, getVideosWithMetrics, getPreviousWeekMetrics, getAllMetricsSnapshots } from '@/lib/data'
import type { KPIs, VideoWithLatestMetrics, VideoMetrics } from '@/lib/types'
import KPICard from '@/components/KPICard'
import PerformanceChart from '@/components/PerformanceChart'
import TopPerformersTable from '@/components/TopPerformersTable'
import ContentMixChart from '@/components/ContentMixChart'
import { format } from 'date-fns'

export default function OverviewPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [videos, setVideos] = useState<VideoWithLatestMetrics[]>([])
  const [snapshots, setSnapshots] = useState<VideoMetrics[]>([])
  const [prevMetrics, setPrevMetrics] = useState<VideoMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    const [k, v, s, p] = await Promise.all([
      getKPIs(),
      getVideosWithMetrics(),
      getAllMetricsSnapshots(),
      getPreviousWeekMetrics(),
    ])
    setKpis(k)
    setVideos(v)
    setSnapshots(s)
    setPrevMetrics(p)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const prevTotals = prevMetrics.reduce((acc, m) => ({
    views: acc.views + (m.views || 0),
    saves: acc.saves + (m.saves || 0),
    watchThrough: acc.watchThrough + (m.avg_percentage_viewed || 0),
    watchCount: acc.watchCount + (m.avg_percentage_viewed != null ? 1 : 0),
    subscribers: acc.subscribers + (m.subscribers_gained || 0) - (m.subscribers_lost || 0),
  }), { views: 0, saves: 0, watchThrough: 0, watchCount: 0, subscribers: 0 })

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-slate-400 text-sm animate-pulse">Loading…</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Content Performance</h1>
          {kpis?.lastSynced && (
            <p className="text-xs text-slate-500 mt-0.5">
              Last synced: {format(new Date(kpis.lastSynced), 'MMM d, yyyy')}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard
          label="Total Videos"
          value={kpis?.totalVideos ?? 0}
        />
        <KPICard
          label="Total Views"
          value={(kpis?.totalViews ?? 0).toLocaleString()}
          delta={kpis && prevTotals.views ? kpis.totalViews - prevTotals.views : undefined}
        />
        <KPICard
          label="Total Saves"
          value={(kpis?.totalSaves ?? 0).toLocaleString()}
          delta={kpis && prevTotals.saves !== undefined ? kpis.totalSaves - prevTotals.saves : undefined}
          isNorthStar
        />
        <KPICard
          label="Avg Watch-Through"
          value={`${(kpis?.avgWatchThrough ?? 0).toFixed(1)}`}
          suffix="%"
        />
        <KPICard
          label="Net Subscribers"
          value={kpis?.netSubscribers ?? 0}
          delta={kpis ? kpis.netSubscribers - prevTotals.subscribers : undefined}
        />
      </div>

      {/* Performance Chart */}
      <PerformanceChart snapshots={snapshots} />

      {/* Top Performers */}
      <TopPerformersTable videos={videos} />

      {/* Content Mix */}
      <ContentMixChart videos={videos} />
    </div>
  )
}
