'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Overview' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/tagging', label: 'Tagging' },
  { href: '/briefs', label: 'Briefs' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <nav className="border-b border-[#2a2d3a] bg-[#0f1117] sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-14">
        <span className="text-sm font-semibold text-slate-200 mr-2">@ainativepm</span>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm transition-colors ${
              pathname === l.href
                ? 'text-blue-400 border-b-2 border-blue-400 pb-0.5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
