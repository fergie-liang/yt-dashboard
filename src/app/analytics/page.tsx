'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Legend, LineChart, Line } from 'recharts'
import { getVideosWithMetrics, getAllMetricsSnapshots } from '@/lib/data'
import type { VideoWithLatestMetrics, VideoMetrics } from '@/lib/types'

export default function AnalyticsPage() {
  const [videos, setVideos] = useState<VideoWithLatestMetrics[]>([])
  const [snapshots, setSnapshots] = useState<VideoMetrics[]>([])

  useEffect(() => {
    Promise.all([getVideosWithMetrics(), getAllMetricsSnapshots()]).then(([v, s]) => {
      setVideos(v)
      setSnapshots(s)
    })
  }, [])

  const tooltipStyle = { backgroundColor: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }

  // Series comparison
  const seriesGroups: Record<string, VideoWithLatestMetrics[]> = {}
  videos.forEach(v => {
    const k = v.series_name || 'Untagged'
    seriesGroups[k] = [...(seriesGroups[k] || []), v]
  })
  const seriesData = Object.entries(seriesGroups).map(([name, vids]) => ({
    name,
    avgViews: Math.round(vids.reduce((s, v) => s + (v.latest_metrics?.views || 0), 0) / vids.length),
    avgSaves: Math.round(vids.reduce((s, v) => s + (v.latest_metrics?.saves || 0), 0) / vids.length),
    avgWatch: Math.round(vids.filter(v => v.latest_metrics?.avg_percentage_viewed != null)
      .reduce((s, v) => s + (v.latest_metrics!.avg_percentage_viewed!), 0) /
      (vids.filter(v => v.latest_metrics?.avg_percentage_viewed != null).length || 1) * 10) / 10,
  }))

  // Hook type analysis — saves per view ratio
  const hookGroups: Record<string, VideoWithLatestMetrics[]> = {}
  videos.forEach(v => {
    const k = v.hook_type || 'Untagged'
    hookGroups[k] = [...(hookGroups[k] || []), v]
  })
  const hookData = Object.entries(hookGroups).map(([hook, vids]) => {
    const totalViews = vids.reduce((s, v) => s + (v.latest_metrics?.views || 0), 0)
    const totalSaves = vids.reduce((s, v) => s + (v.latest_metrics?.saves || 0), 0)
    return { hook, savesPerView: totalViews > 0 ? Math.round((totalSaves / totalViews) * 1000) / 10 : 0 }
  }).sort((a, b) => b.savesPerView - a.savesPerView)

  // Duration vs watch-through scatter
  const durationData = videos
    .filter(v => v.duration_seconds && v.latest_metrics?.avg_percentage_viewed != null)
    .map(v => ({ duration: v.duration_seconds!, watchThrough: v.latest_metrics!.avg_percentage_viewed!, title: v.title }))

  // Velocity (day 1, 7, 30 approximation from snapshots)
  const velocityData = videos.slice(0, 6).map(v => {
    const vh = snapshots.filter(s => s.youtube_video_id === v.youtube_video_id).sort((a, b) => a.days_since_publish! - b.days_since_publish!)
    const d1 = vh.find(s => (s.days_since_publish || 0) <= 1)
    const d7 = vh.find(s => (s.days_since_publish || 0) <= 7)
    const d30 = vh.find(s => (s.days_since_publish || 0) <= 30)
    return {
      title: v.title.substring(0, 25) + '…',
      'Day 1': d1?.views || 0,
      'Day 7': d7?.views || 0,
      'Day 30': d30?.views || 0,
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-slate-100">Analytics</h1>

      {/* Series Comparison */}
      <div className="card">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Series Comparison</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={seriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="avgViews" fill="#3b82f6" name="Avg Views" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avgSaves" fill="#f59e0b" name="Avg Saves" radius={[4, 4, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hook Type Analysis */}
      <div className="card">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Hook Type — Saves per View (%)</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hookData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} unit="%" />
            <YAxis dataKey="hook" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="savesPerView" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Saves/View %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Duration vs Watch-Through */}
      {durationData.length > 0 && (
        <div className="card">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Duration vs Watch-Through</h2>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="duration" name="Duration (s)" unit="s" tick={{ fill: '#64748b', fontSize: 10 }} label={{ value: 'Duration (s)', fill: '#64748b', fontSize: 10, position: 'insideBottom', offset: -5 }} />
              <YAxis dataKey="watchThrough" name="Watch-Through" unit="%" tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={durationData} fill="#34d399" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Velocity */}
      {velocityData.some(v => v['Day 1'] > 0) && (
        <div className="card">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Views Velocity — Day 1 / 7 / 30</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="title" tick={{ fill: '#94a3b8', fontSize: 9 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="Day 1" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Day 7" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Day 30" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
