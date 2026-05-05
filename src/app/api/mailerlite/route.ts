import { NextResponse } from 'next/server'

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY!
const BASE = 'https://connect.mailerlite.com/api'

const GROUP_META: Record<string, { label: string; color: string }> = {
  '183939624389837888': { label: 'AIPM Newsletter',         color: 'blue' },
  '183171274938254889': { label: 'AI Native Ferg',          color: 'purple' },
  '186515511854499185': { label: 'Terrain — Founding Cohort', color: 'emerald' },
}

export async function GET() {
  if (!MAILERLITE_API_KEY) {
    return NextResponse.json({ error: 'MAILERLITE_API_KEY not set' }, { status: 500 })
  }

  const headers = {
    Authorization: `Bearer ${MAILERLITE_API_KEY}`,
    'Content-Type': 'application/json',
  }

  try {
    // Fetch all groups
    const groupsRes = await fetch(`${BASE}/groups?limit=25`, { headers, next: { revalidate: 300 } })
    const groupsData = await groupsRes.json()
    const groups = (groupsData.data ?? []).map((g: any) => ({
      id: g.id,
      name: GROUP_META[g.id]?.label ?? g.name,
      color: GROUP_META[g.id]?.color ?? 'slate',
      active_count: g.active_count,
      unsubscribed_count: g.unsubscribed_count,
      unconfirmed_count: g.unconfirmed_count,
      bounced_count: g.bounced_count,
      open_rate: g.open_rate?.string ?? '0%',
      click_rate: g.click_rate?.string ?? '0%',
      created_at: g.created_at,
    }))

    // Fetch account-level stats
    const statsRes = await fetch(`${BASE}/subscribers?limit=1`, { headers, next: { revalidate: 300 } })
    const statsData = await statsRes.json()
    const totalActive = groups.reduce((sum: number, g: any) => sum + g.active_count, 0)

    return NextResponse.json({
      groups,
      totalActive,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
