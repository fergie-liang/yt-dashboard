'use client'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { getWeeklyBriefs } from '@/lib/data'
import type { WeeklyBrief } from '@/lib/types'
import { format } from 'date-fns'

export default function BriefsPage() {
  const [briefs, setBriefs] = useState<WeeklyBrief[]>([])
  const [selected, setSelected] = useState<WeeklyBrief | null>(null)

  useEffect(() => {
    getWeeklyBriefs().then(b => {
      setBriefs(b)
      if (b.length) setSelected(b[0])
    })
  }, [])

  const hypotheses = selected?.hypotheses
    ? (Array.isArray(selected.hypotheses)
        ? selected.hypotheses
        : Object.values(selected.hypotheses))
    : []

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-100">Weekly Briefs</h1>
      <div className="grid md:grid-cols-[220px,1fr] gap-4 items-start">
        {/* Brief list */}
        <div className="space-y-2">
          {briefs.map(b => (
            <button
              key={b.id}
              onClick={() => setSelected(b)}
              className={`w-full text-left card transition-colors ${selected?.id === b.id ? 'border-blue-500/50 bg-blue-500/5' : 'hover:border-slate-500'}`}
            >
              <p className="text-xs font-medium text-slate-200">
                {format(new Date(b.week_start), 'MMM d')} – {format(new Date(b.week_end), 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {Array.isArray(b.hypotheses) ? b.hypotheses.length : Object.keys(b.hypotheses || {}).length} hypotheses
              </p>
            </button>
          ))}
          {briefs.length === 0 && (
            <p className="text-xs text-slate-500 p-4">No briefs yet. Run Mika to generate the first one.</p>
          )}
        </div>

        {/* Brief detail */}
        {selected && (
          <div className="space-y-4">
            {hypotheses.length > 0 && (
              <div className="card">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Hypotheses</h3>
                <ul className="space-y-2">
                  {hypotheses.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <input type="checkbox" className="mt-0.5 accent-amber-400" />
                      <span className="text-sm text-slate-300">{typeof h === 'string' ? h : JSON.stringify(h)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selected.brief_markdown && (
              <div className="card prose prose-invert prose-sm max-w-none prose-headings:text-slate-200 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-100">
                <ReactMarkdown>{selected.brief_markdown}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
