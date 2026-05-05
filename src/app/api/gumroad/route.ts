import { NextResponse } from 'next/server'

const TOKEN = process.env.GUMROAD_ACCESS_TOKEN!
const BASE = 'https://api.gumroad.com/v2'

export async function GET() {
  if (!TOKEN) {
    return NextResponse.json({ error: 'GUMROAD_ACCESS_TOKEN not set' }, { status: 500 })
  }

  try {
    // Fetch products and all sales pages in parallel
    const [productsRes, firstSalesRes] = await Promise.all([
      fetch(`${BASE}/products?access_token=${TOKEN}`, { next: { revalidate: 300 } }),
      fetch(`${BASE}/sales?access_token=${TOKEN}`, { next: { revalidate: 300 } }),
    ])

    const [productsData, firstSalesData] = await Promise.all([
      productsRes.json(),
      firstSalesRes.json(),
    ])

    const products = (productsData.products ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      permalink: p.short_url ?? p.url,
      price_cents: p.price,
      price: (p.price / 100).toFixed(2),
      sales_count: p.sales_count ?? 0,
      revenue_cents: p.sales_usd_cents ?? 0,
      published: p.published,
      thumbnail_url: p.thumbnail_url ?? null,
    }))

    // Paginate through all sales
    const allSales: any[] = [...(firstSalesData.sales ?? [])]
    let pageKey = firstSalesData.next_page_key
    while (pageKey) {
      const res = await fetch(
        `${BASE}/sales?access_token=${TOKEN}&page_key=${pageKey}`,
        { next: { revalidate: 300 } }
      )
      const data = await res.json()
      allSales.push(...(data.sales ?? []))
      pageKey = data.next_page_key ?? null
    }

    // Aggregate KPIs
    const activeSales = allSales.filter(s => !s.refunded && !s.chargebacked)
    const totalRevenueCents = activeSales.reduce((sum, s) => sum + (s.price ?? 0), 0)
    const totalFeeCents = activeSales.reduce((sum, s) => sum + (s.gumroad_fee ?? 0), 0)
    const netRevenueCents = totalRevenueCents - totalFeeCents

    // Group sales by product
    const salesByProduct: Record<string, number> = {}
    const revenueByProduct: Record<string, number> = {}
    for (const s of activeSales) {
      const name = s.product_name ?? 'Unknown'
      salesByProduct[name] = (salesByProduct[name] ?? 0) + 1
      revenueByProduct[name] = (revenueByProduct[name] ?? 0) + (s.price ?? 0)
    }

    // Recent sales (last 10)
    const recentSales = allSales.slice(0, 10).map((s: any) => ({
      id: s.id,
      created_at: s.created_at,
      product_name: s.product_name,
      price: ((s.price ?? 0) / 100).toFixed(2),
      currency: s.currency ?? 'usd',
      country: s.country ?? '—',
      refunded: s.refunded ?? false,
      chargebacked: s.chargebacked ?? false,
    }))

    return NextResponse.json({
      products,
      kpis: {
        totalSales: activeSales.length,
        totalRevenue: (totalRevenueCents / 100).toFixed(2),
        netRevenue: (netRevenueCents / 100).toFixed(2),
        avgOrderValue: activeSales.length
          ? (totalRevenueCents / activeSales.length / 100).toFixed(2)
          : '0.00',
        refunds: allSales.filter(s => s.refunded).length,
      },
      recentSales,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
