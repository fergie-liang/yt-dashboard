# yt-dashboard

Content performance dashboard for @ainativepm YouTube Shorts channel.

**Live:** https://ytdashboard.design4venture.com

## Stack
- Next.js 16 (App Router)
- Tailwind CSS v4
- Recharts
- Supabase JS client
- Vercel hosting

## Project Structure

```
src/
  app/              # Next.js pages
    page.tsx        # Overview (KPIs, charts, top performers)
    video/[id]/     # Video detail with inline tag editing
    analytics/      # Deep analytics (series, hooks, velocity)
    tagging/        # Backfill untagged content
    briefs/         # Weekly Mika briefs
  components/       # Shared UI components
  lib/
    supabase.ts     # Supabase client setup
    data.ts         # All data access (platform-abstracted)
    types.ts        # TypeScript types
middleware.ts       # Auth stub (ready for future auth)
```

## Running Locally

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your Supabase credentials
npm run dev
```

## Adding Instagram Later

The data layer in `src/lib/data.ts` is built with platform abstraction:

1. Add a `platform` column to the `videos` table: `ALTER TABLE videos ADD COLUMN platform TEXT DEFAULT 'youtube';`
2. Add `platform` to `video_metrics` as well
3. Uncomment the platform filter in `data.ts` `applyPlatformFilter()`
4. Add platform toggle UI to the Overview KPI row (the `Platform` type already exists in `types.ts`)

## Environment Variables

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API |

## RLS Warning

Row Level Security is currently **disabled** on all Supabase tables. This is fine for a private dashboard. Before making this public or adding user accounts, enable RLS:

```sql
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_briefs ENABLE ROW LEVEL SECURITY;
-- Then create appropriate policies
```
