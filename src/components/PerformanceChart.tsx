'use client'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { VideoMetrics } from '@/lib/types'
import { format } from 'date-fns'

type Metric = 'views' | 'saves' | 'likes' | 'avg_percentage_viewed'
type Range = '7d' | '30d' | '90d' | 'all'

interface Props {
  snapshots: VideoMetrics[]
}

const metricColors: Record<Metric, string> = {
  views: '#3b82f6',
  saves: '#f59e0b',
  likes: '#a78bfa',
  avg_percentage_viewed: '#34d399',
}

const metricLabels: Record<Metric, string> = {
  views: 'Views',
  saves: 'Saves',
  likes: 'Likes',
  avg_percentage_viewed: 'Watch-Through %',
}

export default function PerformanceChart({ snapshots }: Props) {
  const [activeMetrics, setActiveMetrics] = useState<Metric[]>(['views', 'saves'])
  const [range, setRange] = useState<Range>('all')

  // Aggregate by date
  const byDate = new Map<string, Record<string, number>>()
  snapshots.forEach(s => {
    const existing = byDate.get(s.snapshot_date) || {}
    byDate.set(s.snapshot_date, {
      views: (existing.views || 0) + (s.views || 0),
      saves: (existing.saves || 0) + (s.saves || 0),
      likes: (existing.likes || 0) + (s.likes || 0),
      avg_percentage_viewed: s.avg_percentage_viewed || 0,
    })
  })

  let chartData = Array.from(byDate.entries())
    .map(([date, metrics]) => ({ date, ...metrics }))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (range !== 'all') {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    chartData = chartData.filter(d => new Date(d.date) >= cutoff)
  }

  const toggleMetric = (m: Metric) => {
    setActiveMetrics(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(metricColors) as Metric[]).map(m => (
            <button
              key={m}
              onClick={() => toggleMetric(m)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                activeMetrics.includes(m)
                  ? 'border-transparent text-white'
                  : 'border-slate-600 text-slate-400'
              }`}
              style={activeMetrics.includes(m) ? { backgroundColor: metricColors[m] + '33', borderColor: metricColors[m], color: metricColors[m] } : {}}
            >
              {metricLabels[m]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['7d', '30d', '90d', 'all'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                range === r ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={d => format(new Date(d), 'MMM d')} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }} labelStyle={{ color: '#e2e8f0' }} />
          {activeMetrics.map(m => (
            <Line key={m} type="monotone" dataKey={m} stroke={metricColors[m]} strokeWidth={2} dot={false} name={metricLabels[m]} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
