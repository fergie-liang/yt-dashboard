interface KPICardProps {
  label: string
  value: string | number
  delta?: number
  isNorthStar?: boolean
  suffix?: string
}

export default function KPICard({ label, value, delta, isNorthStar, suffix }: KPICardProps) {
  return (
    <div className={`card ${isNorthStar ? 'amber-glow border-amber-500/30' : ''}`}>
      <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isNorthStar ? 'text-amber-400' : 'text-slate-400'}`}>
        {label}
        {isNorthStar && <span className="ml-1">★</span>}
      </p>
      <p className={`text-2xl font-bold ${isNorthStar ? 'text-amber-400' : 'text-slate-100'}`}>
        {value}{suffix}
      </p>
      {delta !== undefined && (
        <p className={`text-xs mt-1 ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toLocaleString()} vs last snapshot
        </p>
      )}
    </div>
  )
}
