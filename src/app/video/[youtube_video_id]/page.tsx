'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { getVideo, getVideoMetricsHistory, getLatestMetricsPerVideo, getVideoComments } from '@/lib/data'
import { updateVideoTags } from '@/lib/data'
import type { Video, VideoMetrics, VideoComment } from '@/lib/types'
import { format } from 'date-fns'

const SERIES_OPTIONS = ['Eval Framework', 'BAN Series', 'Think Like an AI PM', 'HHH', 'Model Limitation Debt', 'Standalone']
const HOOK_OPTIONS = ['paradox', 'question', 'stat', 'contrarian', 'story', 'direct']
const PILLAR_OPTIONS = ['AI-Native Thinking', 'AI for Life Goals', 'Minimum Viable AI']

export default function VideoDetailPage() {
  const { youtube_video_id } = useParams<{ youtube_video_id: string }>()
  const [video, setVideo] = useState<Video | null>(null)
  const [history, setHistory] = useState<VideoMetrics[]>([])
  const [allLatest, setAllLatest] = useState<VideoMetrics[]>([])
  const [comments, setComments] = useState<VideoComment[]>([])
  const [tags, setTags] = useState({ series_name: '', hook_type: '', content_pillar: '', topic_tags: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      getVideo(youtube_video_id),
      getVideoMetricsHistory(youtube_video_id),
      getLatestMetricsPerVideo(),
      getVideoComments(youtube_video_id),
    ]).then(([v, h, all, c]) => {
      setVideo(v)
      setHistory(h)
      setAllLatest(all)
      setComments(c)
      if (v) setTags({
        series_name: v.series_name || '',
        hook_type: v.hook_type || '',
        content_pillar: v.content_pillar || '',
        topic_tags: (v.topic_tags || []).join(', '),
      })
    })
  }, [youtube_video_id])

  const handleSave = async () => {
    setSaving(true)
    await updateVideoTags(youtube_video_id, {
      series_name: tags.series_name || null,
      hook_type: tags.hook_type || null,
      content_pillar: tags.content_pillar || null,
      topic_tags: tags.topic_tags ? tags.topic_tags.split(',').map(t => t.trim()).filter(Boolean) : null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const latest = history[history.length - 1]
  const avgViews = allLatest.length ? allLatest.reduce((s, m) => s + m.views, 0) / allLatest.length : 0
  const avgSaves = allLatest.length ? allLatest.reduce((s, m) => s + m.saves, 0) / allLatest.length : 0
  const avgWatchThrough = allLatest.filter(m => m.avg_percentage_viewed != null).length
    ? allLatest.filter(m => m.avg_percentage_viewed != null).reduce((s, m) => s + m.avg_percentage_viewed!, 0) /
      allLatest.filter(m => m.avg_percentage_viewed != null).length
    : 0

  const comparisonData = [
    { metric: 'Views', this: latest?.views ?? 0, avg: Math.round(avgViews) },
    { metric: 'Saves', this: latest?.saves ?? 0, avg: Math.round(avgSaves) },
    { metric: 'Watch %', this: latest?.avg_percentage_viewed ?? 0, avg: Math.round(avgWatchThrough * 10) / 10 },
  ]

  const tooltipStyle = { backgroundColor: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }

  if (!video) return <div className="text-slate-400 text-sm p-8 animate-pulse">Loading…</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start gap-4">
        {video.thumbnail_url && (
          <img src={video.thumbnail_url} alt="" className="w-32 h-20 object-cover rounded-lg flex-shrink-0" />
        )}
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-100 leading-tight">{video.title}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Published {format(new Date(video.published_at), 'MMM d, yyyy')}
            {video.duration_seconds && ` · ${video.duration_seconds}s`}
          </p>
          <a
            href={`https://youtube.com/shorts/${youtube_video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
          >
            Watch on YouTube ↗
          </a>
        </div>
      </div>

      {/* Tags */}
      <div className="card space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Series</label>
            <select
              value={tags.series_name}
              onChange={e => setTags(t => ({ ...t, series_name: e.target.value }))}
              className="w-full text-xs bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-slate-200"
            >
              <option value="">—</option>
              {SERIES_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Hook Type</label>
            <select
              value={tags.hook_type}
              onChange={e => setTags(t => ({ ...t, hook_type: e.target.value }))}
              className="w-full text-xs bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-slate-200"
            >
              <option value="">—</option>
              {HOOK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Content Pillar</label>
            <select
              value={tags.content_pillar}
              onChange={e => setTags(t => ({ ...t, content_pillar: e.target.value }))}
              className="w-full text-xs bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-slate-200"
            >
              <option value="">—</option>
              {PILLAR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Topic Tags</label>
            <input
              value={tags.topic_tags}
              onChange={e => setTags(t => ({ ...t, topic_tags: e.target.value }))}
              placeholder="ai-pm, evals, career"
              className="w-full text-xs bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-slate-200 placeholder-slate-600"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Tags'}
        </button>
      </div>

      {/* Metrics Timeline */}
      {history.length > 1 && (
        <div className="card">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Metrics Over Time</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="snapshot_date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={d => format(new Date(d), 'MMM d')} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} name="Views" />
              <Line type="monotone" dataKey="saves" stroke="#f59e0b" strokeWidth={2} dot={false} name="Saves" />
              <Line type="monotone" dataKey="likes" stroke="#a78bfa" strokeWidth={2} dot={false} name="Likes" />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* vs Channel Average */}
      <div className="card">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">vs Channel Average</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
            <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="this" fill="#3b82f6" name="This video" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avg" fill="#2a2d3a" name="Channel avg" radius={[4, 4, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Audience Comments */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audience Comments</h2>
          {comments.length > 0 && (
            <span className="text-xs text-slate-500">{comments.length} comments · sorted by likes</span>
          )}
        </div>
        {comments.length === 0 ? (
          <p className="text-slate-500 text-xs py-4 text-center">
            No comments synced yet — run <code className="text-blue-400">pull_youtube_metrics.py --comments</code> to pull them.
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.comment_id} className="flex gap-3 items-start">
                {c.author_profile_image ? (
                  <img src={c.author_profile_image} alt="" className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#2a2d3a] flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-slate-300">{c.author_display_name || 'Anonymous'}</span>
                    {c.published_at && (
                      <span className="text-xs text-slate-600">{format(new Date(c.published_at), 'MMM d, yyyy')}</span>
                    )}
                    {c.like_count > 0 && (
                      <span className="text-xs text-slate-500 ml-auto">♥ {c.like_count.toLocaleString()}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{c.text_display}</p>
                  {c.reply_count > 0 && (
                    <p className="text-xs text-slate-600 mt-0.5">{c.reply_count} {c.reply_count === 1 ? 'reply' : 'replies'}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
