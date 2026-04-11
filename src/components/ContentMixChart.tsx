'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { VideoWithLatestMetrics } from '@/lib/types'

export default function ContentMixChart({ videos }: { videos: VideoWithLatestMetrics[] }) {
  const seriesData = Object.entries(
    videos.reduce((acc, v) => {
      const key = v.series_name || 'Untagged'
      acc[key] = (acc[key] || 0) + (v.latest_metrics?.views || 0)
      return acc
    }, {} as Record<string, number>)
  ).map(([name, views]) => ({ name, views })).sort((a, b) => b.views - a.views)

  const hookData = Object.entries(
    videos.reduce((acc, v) => {
      const key = v.hook_type || 'Untagged'
      acc[key] = (acc[key] || 0) + (v.latest_metrics?.views || 0)
      return acc
    }, {} as Record<string, number>)
  ).map(([name, views]) => ({ name, views }))

  const tooltipStyle = { backgroundColor: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Views by Series</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={seriesData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Views by Hook Type</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={hookData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="views" fill="#a78bfa" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
