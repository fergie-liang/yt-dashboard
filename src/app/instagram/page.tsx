'use client'
import { useEffect, useState, useCallback } from 'react'
import { getInstagramKPIs, getInstagramReelsWithMetrics, getInstagramReelComments } from '@/lib/data'
import type { InstagramKPIs, InstagramReelWithLatestMetrics, InstagramReelComment } from '@/lib/types'
import KPICard from '@/components/KPICard'
import { format } from 'date-fns'

type SortKey = 'reach' | 'saved' | 'total_interactions' | 'avg_watch_time_ms'

export default function InstagramPage() {
  const [kpis, setKpis] = useState<InstagramKPIs | null>(null)
  const [reels, setReels] = useState<InstagramReelWithLatestMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('reach')

  // Comments state
  const [expandedReel, setExpandedReel] = useState<string | null>(null)
  const [commentsMap, setCommentsMap] = useState<Record<string, InstagramReelComment[]>>({})
  const [loadingComments, setLoadingComments] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const [k, r] = await Promise.all([
      getInstagramKPIs(),
      getInstagramReelsWithMetrics(),
    ])
    setKpis(k)
    setReels(r)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleToggleComments = async (mediaId: string) => {
    if (expandedReel === mediaId) {
      setExpandedReel(null)
      return
    }
    setExpandedReel(mediaId)
    if (!commentsMap[mediaId]) {
      setLoadingComments(mediaId)
      const comments = await getInstagramReelComments(mediaId)
      setCommentsMap(prev => ({ ...prev, [mediaId]: comments }))
      setLoadingComments(null)
    }
  }

  const sorted = [...reels].sort((a, b) => {
    const aVal = a.latest_metrics?.[sortBy] ?? 0
    const bVal = b.latest_metrics?.[sortBy] ?? 0
    return (bVal as number) - (aVal as number)
  })

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
          <h1 className="text-lg font-semibold text-slate-100">Instagram Reels</h1>
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
        <KPICard label="Total Reels" value={kpis?.totalReels ?? 0} />
        <KPICard label="Total Reach" value={(kpis?.totalReach ?? 0).toLocaleString()} />
        <KPICard
          label="Total Saved"
          value={(kpis?.totalSaved ?? 0).toLocaleString()}
          isNorthStar
        />
        <KPICard
          label="Avg Watch Time"
          value={(kpis?.avgWatchTimeSeconds ?? 0).toFixed(1)}
          suffix="s"
        />
        <KPICard label="Total Interactions" value={(kpis?.totalInteractions ?? 0).toLocaleString()} />
      </div>

      {/* Reels Table */}
      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200">All Reels</h2>
          <div className="flex gap-2">
            {(['reach', 'saved', 'total_interactions', 'avg_watch_time_ms'] as SortKey[]).map(k => (
              <button
                key={k}
                onClick={() => setSortBy(k)}
                className={`text-xs px-2 py-1 rounded ${sortBy === k ? 'bg-pink-500/20 text-pink-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {k === 'avg_watch_time_ms' ? 'Watch Time' :
                 k === 'total_interactions' ? 'Interactions' :
                 k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {reels.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            No Instagram Reels data yet. Run <code className="text-pink-400">pull_instagram_metrics.py</code> to sync.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-[#2a2d3a]">
                <th className="text-left pb-2 font-medium">Reel</th>
                <th className="text-right pb-2 font-medium">Reach</th>
                <th className="text-right pb-2 font-medium text-pink-400">Saved</th>
                <th className="text-right pb-2 font-medium">Likes</th>
                <th className="text-right pb-2 font-medium hidden md:table-cell">Interactions</th>
                <th className="text-right pb-2 font-medium hidden md:table-cell">Avg Watch</th>
                <th className="text-right pb-2 font-medium hidden md:table-cell">Published</th>
                <th className="text-right pb-2 font-medium hidden md:table-cell">Comments</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <>
                  <tr
                    key={r.instagram_media_id}
                    className={`border-b border-[#2a2d3a] transition-colors ${expandedReel === r.instagram_media_id ? 'bg-white/5' : 'hover:bg-white/5'}`}
                  >
                    <td className="py-3 pr-4">
                      <a
                        href={r.permalink ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 group"
                      >
                        {r.thumbnail_url && (
                          <img src={r.thumbnail_url} alt="" className="w-10 h-14 object-cover rounded flex-shrink-0" />
                        )}
                        <span className="text-slate-200 group-hover:text-pink-400 transition-colors line-clamp-3 text-xs leading-tight">
                          {r.caption || r.instagram_media_id}
                        </span>
                      </a>
                    </td>
                    <td className="text-right text-slate-300 text-xs">{(r.latest_metrics?.reach ?? 0).toLocaleString()}</td>
                    <td className="text-right text-pink-400 font-medium text-xs">{(r.latest_metrics?.saved ?? 0).toLocaleString()}</td>
                    <td className="text-right text-slate-300 text-xs">{(r.latest_metrics?.likes ?? 0).toLocaleString()}</td>
                    <td className="text-right text-slate-300 text-xs hidden md:table-cell">
                      {(r.latest_metrics?.total_interactions ?? 0).toLocaleString()}
                    </td>
                    <td className="text-right text-slate-300 text-xs hidden md:table-cell">
                      {r.latest_metrics?.avg_watch_time_ms
                        ? `${(r.latest_metrics.avg_watch_time_ms / 1000).toFixed(1)}s`
                        : '—'}
                    </td>
                    <td className="text-right text-slate-400 text-xs hidden md:table-cell">
                      {r.published_at ? format(new Date(r.published_at), 'MMM d') : '—'}
                    </td>
                    <td className="text-right hidden md:table-cell">
                      <button
                        onClick={() => handleToggleComments(r.instagram_media_id)}
                        className={`text-xs px-2 py-0.5 rounded transition-colors ${
                          expandedReel === r.instagram_media_id
                            ? 'text-pink-400 hover:text-pink-300'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {expandedReel === r.instagram_media_id ? '▲ hide' : `💬 ${r.latest_metrics?.comments ?? 0}`}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded comments row */}
                  {expandedReel === r.instagram_media_id && (
                    <tr key={`comments-${r.instagram_media_id}`} className="border-b border-[#2a2d3a] bg-[#0f1117]">
                      <td colSpan={8} className="px-4 py-4">
                        {loadingComments === r.instagram_media_id ? (
                          <p className="text-xs text-slate-500 animate-pulse">Loading comments…</p>
                        ) : (commentsMap[r.instagram_media_id] || []).length === 0 ? (
                          <p className="text-xs text-slate-500">
                            No comments synced yet — run <code className="text-pink-400">pull_instagram_metrics.py --comments</code>
                          </p>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {(commentsMap[r.instagram_media_id] || []).map(c => (
                              <div key={c.comment_id} className="flex gap-2 items-start">
                                <div className="w-6 h-6 rounded-full bg-[#2a2d3a] flex-shrink-0 flex items-center justify-center mt-0.5">
                                  <span className="text-xs text-slate-400">{(c.username || '?')[0].toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-medium text-slate-300">@{c.username || 'user'}</span>
                                    {c.timestamp && (
                                      <span className="text-xs text-slate-600">{format(new Date(c.timestamp), 'MMM d')}</span>
                                    )}
                                    {c.like_count > 0 && (
                                      <span className="text-xs text-slate-500 ml-auto">♥ {c.like_count}</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-300 leading-relaxed">{c.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Token expiry reminder */}
      <p className="text-xs text-slate-600 text-center">
        Instagram token expires ~2026-06-10 · run <code>pull_instagram_metrics.py</code> weekly via cron
      </p>
    </div>
  )
}
