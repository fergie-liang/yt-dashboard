'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { VideoWithLatestMetrics } from '@/lib/types'
import { format } from 'date-fns'

type SortKey = 'saves' | 'views' | 'avg_percentage_viewed'

export default function TopPerformersTable({ videos }: { videos: VideoWithLatestMetrics[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('saves')

  const sorted = [...videos].sort((a, b) => {
    const aVal = a.latest_metrics?.[sortBy] ?? 0
    const bVal = b.latest_metrics?.[sortBy] ?? 0
    return (bVal as number) - (aVal as number)
  }).slice(0, 10)

  return (
    <div className="card overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-200">Top Performers</h2>
        <div className="flex gap-2">
          {(['saves', 'views', 'avg_percentage_viewed'] as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => setSortBy(k)}
              className={`text-xs px-2 py-1 rounded ${sortBy === k ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {k === 'avg_percentage_viewed' ? 'Watch-Through' : k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-400 border-b border-[#2a2d3a]">
            <th className="text-left pb-2 font-medium">Video</th>
            <th className="text-right pb-2 font-medium">Views</th>
            <th className="text-right pb-2 font-medium text-amber-400">Saves</th>
            <th className="text-right pb-2 font-medium">Likes</th>
            <th className="text-right pb-2 font-medium hidden md:table-cell">Watch %</th>
            <th className="text-right pb-2 font-medium hidden md:table-cell">Published</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(v => (
            <tr key={v.youtube_video_id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-white/5 transition-colors">
              <td className="py-3 pr-4">
                <Link href={`/video/${v.youtube_video_id}`} className="flex items-center gap-3 group">
                  {v.thumbnail_url && (
                    <img src={v.thumbnail_url} alt="" className="w-14 h-9 object-cover rounded flex-shrink-0" />
                  )}
                  <span className="text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-2 text-xs leading-tight">
                    {v.title}
                  </span>
                </Link>
              </td>
              <td className="text-right text-slate-300 text-xs">{(v.latest_metrics?.views ?? 0).toLocaleString()}</td>
              <td className="text-right text-amber-400 font-medium text-xs">{(v.latest_metrics?.saves ?? 0).toLocaleString()}</td>
              <td className="text-right text-slate-300 text-xs">{(v.latest_metrics?.likes ?? 0).toLocaleString()}</td>
              <td className="text-right text-slate-300 text-xs hidden md:table-cell">
                {v.latest_metrics?.avg_percentage_viewed != null ? `${v.latest_metrics.avg_percentage_viewed.toFixed(1)}%` : '—'}
              </td>
              <td className="text-right text-slate-400 text-xs hidden md:table-cell">
                {format(new Date(v.published_at), 'MMM d')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
