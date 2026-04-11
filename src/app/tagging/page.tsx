'use client'
import { useEffect, useState } from 'react'
import { getVideos, batchUpdateVideoTags } from '@/lib/data'
import type { Video } from '@/lib/types'

const SERIES_OPTIONS = ['Eval Framework', 'BAN Series', 'Think Like an AI PM', 'HHH', 'Model Limitation Debt', 'Standalone']
const HOOK_OPTIONS = ['paradox', 'question', 'stat', 'contrarian', 'story', 'direct']
const PILLAR_OPTIONS = ['AI-Native Thinking', 'AI for Life Goals', 'Minimum Viable AI']

export default function TaggingPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [edits, setEdits] = useState<Record<string, Partial<Video>>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [filter, setFilter] = useState<'untagged' | 'all'>('untagged')

  useEffect(() => { getVideos().then(setVideos) }, [])

  const filtered = filter === 'untagged'
    ? videos.filter(v => !v.series_name || !v.hook_type)
    : videos

  const tagged = videos.filter(v => v.series_name && v.hook_type).length
  const total = videos.length

  const update = (id: string, field: string, value: string) => {
    setEdits(e => ({ ...e, [id]: { ...e[id], [field]: value || null } }))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    const updates = Object.entries(edits).map(([youtube_video_id, fields]) => ({
      youtube_video_id,
      ...fields,
      topic_tags: typeof (fields as Record<string, string>).topic_tags === 'string'
        ? ((fields as Record<string, string>).topic_tags as string).split(',').map((t: string) => t.trim()).filter(Boolean)
        : undefined,
    }))
    await batchUpdateVideoTags(updates)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    getVideos().then(setVideos)
    setEdits({})
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Tag Backfill</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            <span className={tagged === total ? 'text-emerald-400' : 'text-amber-400'}>{tagged}</span>
            <span className="text-slate-500"> / {total} videos tagged</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(['untagged', 'all'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded border transition-colors ${filter === f ? 'border-blue-500 text-blue-400' : 'border-[#2a2d3a] text-slate-400'}`}>
                {f === 'untagged' ? `Untagged (${total - tagged})` : `All (${total})`}
              </button>
            ))}
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving || Object.keys(edits).length === 0}
            className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : `Save ${Object.keys(edits).length > 0 ? `(${Object.keys(edits).length})` : 'All'}`}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#2a2d3a] rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all rounded-full" style={{ width: `${(tagged / total) * 100}%` }} />
      </div>

      <div className="space-y-2">
        {filtered.map(v => {
          const e = edits[v.youtube_video_id] || {}
          return (
            <div key={v.youtube_video_id} className="card">
              <p className="text-sm text-slate-200 mb-3 font-medium leading-tight">{v.title}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Series</label>
                  <select
                    value={(e.series_name as string) ?? (v.series_name || '')}
                    onChange={ev => update(v.youtube_video_id, 'series_name', ev.target.value)}
                    className="w-full text-xs bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-slate-200"
                  >
                    <option value="">—</option>
                    {SERIES_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Hook</label>
                  <select
                    value={(e.hook_type as string) ?? (v.hook_type || '')}
                    onChange={ev => update(v.youtube_video_id, 'hook_type', ev.target.value)}
                    className="w-full text-xs bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-slate-200"
                  >
                    <option value="">—</option>
                    {HOOK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Pillar</label>
                  <select
                    value={(e.content_pillar as string) ?? (v.content_pillar || '')}
                    onChange={ev => update(v.youtube_video_id, 'content_pillar', ev.target.value)}
                    className="w-full text-xs bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-slate-200"
                  >
                    <option value="">—</option>
                    {PILLAR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Topic Tags</label>
                  <input
                    value={(e.topic_tags as unknown as string) ?? (v.topic_tags?.join(', ') || '')}
                    onChange={ev => update(v.youtube_video_id, 'topic_tags', ev.target.value)}
                    placeholder="ai-pm, evals"
                    className="w-full text-xs bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-slate-200 placeholder-slate-600"
                  />
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">
            {filter === 'untagged' ? '✓ All videos are tagged!' : 'No videos yet.'}
          </p>
        )}
      </div>
    </div>
  )
}
