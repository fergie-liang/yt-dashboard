'use client'
import { useEffect, useState, useCallback } from 'react'
import KPICard from '@/components/KPICard'
import { format } from 'date-fns'

interface Product {
  id: string
  name: string
  permalink: string
  price: string
  sales_count: number
  revenue_cents: number
  published: boolean
  thumbnail_url: string | null
}

interface Sale {
  id: string
  created_at: string
  product_name: string
  price: string
  currency: string
  country: string
  refunded: boolean
  chargebacked: boolean
}

interface KPIs {
  totalSales: number
  totalRevenue: string
  netRevenue: string
  avgOrderValue: string
  refunds: number
}

interface GumroadData {
  products: Product[]
  kpis: KPIs
  recentSales: Sale[]
  fetchedAt: string
}

export default function SalesPage() {
  const [data, setData] = useState<GumroadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/gumroad')
    const json = await res.json()
    setData(json)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRefresh = () => { setRefreshing(true); fetchData() }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-slate-400 text-sm animate-pulse">Loading…</div>
    </div>
  )

  const { products, kpis, recentSales, fetchedAt } = data!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Gumroad Sales</h1>
          {fetchedAt && (
            <p className="text-xs text-slate-500 mt-0.5">
              Live from Gumroad · {format(new Date(fetchedAt), 'MMM d, h:mm a')}
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
        <KPICard label="Total Sales" value={kpis.totalSales} />
        <KPICard
          label="Gross Revenue"
          value={`$${Number(kpis.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          isNorthStar
        />
        <KPICard
          label="Net Revenue"
          value={`$${Number(kpis.netRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        />
        <KPICard
          label="Avg Order"
          value={`$${kpis.avgOrderValue}`}
        />
        <KPICard label="Refunds" value={kpis.refunds} />
      </div>

      {/* Products */}
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(p => (
            <a
              key={p.id}
              href={p.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="card border border-[#2a2d3a] hover:border-slate-500 transition-colors group flex gap-4"
            >
              {p.thumbnail_url && (
                <img
                  src={p.thumbnail_url}
                  alt=""
                  className="w-16 h-16 object-cover rounded flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-slate-100 group-hover:text-emerald-400 transition-colors leading-tight">
                    {p.name}
                  </p>
                  <span className="text-sm font-bold text-emerald-400 flex-shrink-0">${p.price}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Sales</p>
                    <p className="text-base font-bold text-slate-100">{p.sales_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Revenue</p>
                    <p className="text-base font-bold text-slate-100">
                      ${(p.revenue_cents / 100).toFixed(2)}
                    </p>
                  </div>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    p.published
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {p.published ? 'Live' : 'Draft'}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="card overflow-x-auto">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Recent Sales</h2>
        {recentSales.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500 text-sm">No sales yet</p>
            <p className="text-slate-600 text-xs mt-1">
              Sales will appear here as they come in from Gumroad
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-[#2a2d3a]">
                <th className="text-left pb-2 font-medium">Date</th>
                <th className="text-left pb-2 font-medium">Product</th>
                <th className="text-right pb-2 font-medium">Amount</th>
                <th className="text-right pb-2 font-medium hidden md:table-cell">Country</th>
                <th className="text-right pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map(s => (
                <tr key={s.id} className="border-b border-[#2a2d3a] hover:bg-white/5">
                  <td className="py-3 text-slate-400 text-xs">
                    {format(new Date(s.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 text-slate-200 text-xs pr-4 max-w-xs truncate">
                    {s.product_name}
                  </td>
                  <td className="py-3 text-right font-medium text-emerald-400 text-xs">
                    ${s.price}
                  </td>
                  <td className="py-3 text-right text-slate-400 text-xs hidden md:table-cell">
                    {s.country}
                  </td>
                  <td className="py-3 text-right">
                    {s.refunded ? (
                      <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Refunded</span>
                    ) : s.chargebacked ? (
                      <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">Chargeback</span>
                    ) : (
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-600 text-center">
        Data fetched live from Gumroad · no cron needed
      </p>
    </div>
  )
}
