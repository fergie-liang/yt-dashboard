export type Platform = 'youtube' | 'instagram' | 'all'

export interface Video {
  id: string
  youtube_video_id: string
  title: string
  description: string | null
  published_at: string
  duration_seconds: number | null
  thumbnail_url: string | null
  series_name: string | null
  hook_type: string | null
  topic_tags: string[] | null
  content_pillar: string | null
  created_at: string
  updated_at: string
  platform?: Platform
}

export interface VideoMetrics {
  id: string
  video_id: string
  youtube_video_id: string
  snapshot_date: string
  days_since_publish: number | null
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  avg_view_duration_seconds: number | null
  avg_percentage_viewed: number | null
  estimated_minutes_watched: number | null
  subscribers_gained: number
  subscribers_lost: number
  created_at: string
}

export interface WeeklyBrief {
  id: string
  week_start: string
  week_end: string
  brief_markdown: string | null
  hypotheses: Record<string, unknown> | null
  created_at: string
}

export interface VideoWithLatestMetrics extends Video {
  latest_metrics: VideoMetrics | null
}

export interface KPIs {
  totalVideos: number
  totalViews: number
  totalSaves: number
  avgWatchThrough: number
  netSubscribers: number
  lastSynced: string | null
}

export interface KPIDeltas {
  views: number
  saves: number
  watchThrough: number
  subscribers: number
}
