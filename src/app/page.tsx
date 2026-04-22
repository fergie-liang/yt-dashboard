'use client'
import { useEffect, useState, useCallback } from 'react'
import { getKPIs, getVideosWithMetrics, getPreviousWeekMetrics, getAllMetricsSnapshots } from '@/lib/data'
import type { KPIs, VideoWithLatestMetrics, VideoMetrics, YoutubeChannel } from '@/lib/types'
import KPICard from '@/components/KPICard'
import PerformanceChart from '@/components/PerformanceChart'
import TopPerformersTable from '@/components/TopPerformersTable'
import ContentMixChart from '@/components/ContentMixChart'
import { format } from 'date-fns'

const CHANNELS: { key: YoutubeChannel; label: string; handle: string; color: string }[] = [
  { key: 'aipm',   label: 'AI Native PM',     handle: '@ainativepm',      color: 'text-blue-400 border-blue-500/50 bg-blue-500/10' },
  { key: 'fergie', label: 'AI Native Fergie',  handle: '@ainative-fergie', color: 'text-purple-400 border-purple-500/50 bg-purple-500/10' },
]

export default function YouTubePage() {
  const [channel, setChannel] = useState<YoutubeChannel>('aipm')
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [videos, setVideos] = useState<VideoWithLatestMetrics[]>([])
  const [snapshots, setSnapshots] = useState<VideoMetrics[]>([])
  const [prevMetrics, setPrevMetrics] = useState<VideoMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (ch: YoutubeChannel) => {
    const [k, v, s, p] = await Promise.all([
      getKPIs(ch),
      getVideosWithMetrics(ch),
      getAllMetricsSnapshots(ch),
      getPreviousWeekMetrics(),
    ])
    setKpis(k)
    setVideos(v)
    setSnapshots(s)
    setPrevMetrics(p)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchData(channel)
  }, [channel, fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData(channel)
  }

  const prevTotals = prevMetrics.reduce((acc, m) => ({
    views: acc.views + (m.views || 0),
    saves: acc.saves + (m.saves || 0),
    watchThrough: acc.watchThrough + (m.avg_percentage_viewed || 0),
    watchCount: acc.watchCount + (m.avg_percentage_viewed != null ? 1 : 0),
    subscribers: acc.subscribers + (m.subscribers_gained || 0) - (m.subscribers_lost || 0),
  }), { views: 0, saves: 0, watchThrough: 0, watchCount: 0, subscribers: 0 })

  const activeChannel = CHANNELS.find(c => c.key === channel)!

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
          <h1 className="text-lg font-semibold text-slate-100">YouTube Shorts</h1>
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

      {/* Channel Toggle */}
      <div className="flex gap-2">
        {CHANNELS.map(ch => (
          <button
            key={ch.key}
            onClick={() => setChannel(ch.key)}
            className={`flex flex-col px-4 py-2.5 rounded-lg border transition-all text-left ${
              channel === ch.key
                ? ch.color
                : 'border-[#2a2d3a] text-slate-500 hover:text-slate-300 hover:border-slate-500'
            }`}
          >
            <span className="text-xs font-semibold">{ch.label}</span>
            <span className="text-xs opacity-60">{ch.handle}</span>
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard label="Total Videos" value={kpis?.totalVideos ?? 0} />
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

      {/* No data state for new channel */}
      {videos.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-slate-400 text-sm mb-1">No data yet for {activeChannel.label}</p>
          <p className="text-slate-600 text-xs">
            Run <code className="text-blue-400">pull_youtube_metrics.py --channel {channel} --backfill</code> to sync
          </p>
        </div>
      )}

      {videos.length > 0 && (
        <>
          <PerformanceChart snapshots={snapshots} />
          <TopPerformersTable videos={videos} />
          <ContentMixChart videos={videos} />
        </>
      )}
    </div>
  )
}
