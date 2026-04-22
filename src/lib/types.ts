export type Platform = 'youtube' | 'instagram' | 'all'
export type YoutubeChannel = 'aipm' | 'fergie' | 'all'

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
  channel: YoutubeChannel
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

// ── Instagram ────────────────────────────────────────────────────────────────

export interface InstagramReel {
  id: string
  instagram_media_id: string
  youtube_video_id: string | null
  caption: string | null
  permalink: string | null
  published_at: string
  duration_seconds: number | null
  thumbnail_url: string | null
  series_name: string | null
  hook_type: string | null
  topic_tags: string[] | null
  content_pillar: string | null
  created_at: string
  updated_at: string
}

export interface InstagramReelMetrics {
  id: string
  instagram_media_id: string
  snapshot_date: string
  reach: number
  likes: number
  comments: number
  shares: number
  saved: number
  total_interactions: number
  avg_watch_time_ms: number | null
  total_view_time_ms: number | null
  created_at: string
}

export interface InstagramReelWithLatestMetrics extends InstagramReel {
  latest_metrics: InstagramReelMetrics | null
}

export interface InstagramKPIs {
  totalReels: number
  totalReach: number
  totalSaved: number
  avgWatchTimeSeconds: number
  totalInteractions: number
  lastSynced: string | null
}

// ── Comments ─────────────────────────────────────────────────────────────────

export interface VideoComment {
  id: string
  youtube_video_id: string
  comment_id: string
  author_display_name: string | null
  author_profile_image: string | null
  text_display: string
  like_count: number
  reply_count: number
  published_at: string | null
  created_at: string
}

export interface InstagramReelComment {
  id: string
  instagram_media_id: string
  comment_id: string
  username: string | null
  text: string
  timestamp: string | null
  like_count: number
  created_at: string
}
