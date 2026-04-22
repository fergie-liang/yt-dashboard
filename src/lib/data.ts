import { supabase } from './supabase'
import type { Platform, YoutubeChannel, Video, VideoMetrics, VideoWithLatestMetrics, KPIs, WeeklyBrief, InstagramReel, InstagramReelMetrics, InstagramReelWithLatestMetrics, InstagramKPIs, VideoComment, InstagramReelComment } from './types'

// Get all videos, optionally filtered by channel
export async function getVideos(channel: YoutubeChannel = 'all'): Promise<Video[]> {
  let query = supabase
    .from('videos')
    .select('*')
    .order('published_at', { ascending: false })

  if (channel !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (query as any).eq('channel', channel)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Get a single video by youtube_video_id
export async function getVideo(youtubeVideoId: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('youtube_video_id', youtubeVideoId)
    .single()
  if (error) return null
  return data
}

// Get the latest metrics snapshot per video
export async function getLatestMetricsPerVideo(channel: YoutubeChannel = 'all'): Promise<VideoMetrics[]> {
  // Get the most recent snapshot_date for this channel
  let dateQuery = supabase
    .from('video_metrics')
    .select('snapshot_date')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single()

  if (channel !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dateQuery = (dateQuery as any).eq('channel', channel)
  }

  const { data: latestDate } = await dateQuery
  if (!latestDate) return []

  let query = supabase
    .from('video_metrics')
    .select('*')
    .eq('snapshot_date', latestDate.snapshot_date)

  if (channel !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (query as any).eq('channel', channel)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Get all metrics for a specific video (for timeline chart)
export async function getVideoMetricsHistory(youtubeVideoId: string): Promise<VideoMetrics[]> {
  const { data, error } = await supabase
    .from('video_metrics')
    .select('*')
    .eq('youtube_video_id', youtubeVideoId)
    .order('snapshot_date', { ascending: true })
  if (error) throw error
  return data || []
}

// Get all metrics snapshots (for time series chart)
export async function getAllMetricsSnapshots(channel: YoutubeChannel = 'all'): Promise<VideoMetrics[]> {
  let query = supabase
    .from('video_metrics')
    .select('*')
    .order('snapshot_date', { ascending: true })

  if (channel !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (query as any).eq('channel', channel)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Get videos with their latest metrics
export async function getVideosWithMetrics(channel: YoutubeChannel = 'all'): Promise<VideoWithLatestMetrics[]> {
  const [videos, metrics] = await Promise.all([
    getVideos(channel),
    getLatestMetricsPerVideo(channel),
  ])

  const metricsMap = new Map(metrics.map(m => [m.youtube_video_id, m]))

  return videos.map(v => ({
    ...v,
    latest_metrics: metricsMap.get(v.youtube_video_id) || null,
  }))
}

// Compute KPIs from latest snapshots
export async function getKPIs(channel: YoutubeChannel = 'all'): Promise<KPIs> {
  const [videos, metrics] = await Promise.all([
    getVideos(channel),
    getLatestMetricsPerVideo(channel),
  ])

  const totalViews = metrics.reduce((sum, m) => sum + (m.views || 0), 0)
  const totalSaves = metrics.reduce((sum, m) => sum + (m.saves || 0), 0)
  const watchThroughValues = metrics.filter(m => m.avg_percentage_viewed != null).map(m => m.avg_percentage_viewed!)
  const avgWatchThrough = watchThroughValues.length ? watchThroughValues.reduce((a, b) => a + b, 0) / watchThroughValues.length : 0
  const netSubscribers = metrics.reduce((sum, m) => sum + (m.subscribers_gained || 0) - (m.subscribers_lost || 0), 0)

  const latestSnapshot = metrics.length ? metrics[0]?.snapshot_date : null

  return {
    totalVideos: videos.length,
    totalViews,
    totalSaves,
    avgWatchThrough,
    netSubscribers,
    lastSynced: latestSnapshot,
  }
}

// Get previous week's snapshot for WoW deltas
export async function getPreviousWeekMetrics(): Promise<VideoMetrics[]> {
  const { data: dates } = await supabase
    .from('video_metrics')
    .select('snapshot_date')
    .order('snapshot_date', { ascending: false })

  if (!dates || dates.length < 2) return []

  const uniqueDates = [...new Set(dates.map(d => d.snapshot_date))]
  if (uniqueDates.length < 2) return []

  const previousDate = uniqueDates[1]
  const { data, error } = await supabase
    .from('video_metrics')
    .select('*')
    .eq('snapshot_date', previousDate)

  if (error) return []
  return data || []
}

// Get all weekly briefs
export async function getWeeklyBriefs(): Promise<WeeklyBrief[]> {
  const { data, error } = await supabase
    .from('weekly_briefs')
    .select('*')
    .order('week_start', { ascending: false })
  if (error) throw error
  return data || []
}

// Update video tags
export async function updateVideoTags(
  youtubeVideoId: string,
  updates: Partial<Pick<Video, 'series_name' | 'hook_type' | 'topic_tags' | 'content_pillar'>>
): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('youtube_video_id', youtubeVideoId)
  if (error) throw error
}

// Batch update video tags
export async function batchUpdateVideoTags(
  updates: Array<{ youtube_video_id: string } & Partial<Pick<Video, 'series_name' | 'hook_type' | 'topic_tags' | 'content_pillar'>>>
): Promise<void> {
  await Promise.all(updates.map(({ youtube_video_id, ...tags }) => updateVideoTags(youtube_video_id, tags)))
}

// ── Instagram ────────────────────────────────────────────────────────────────

export async function getInstagramReels(): Promise<InstagramReel[]> {
  const { data, error } = await supabase
    .from('instagram_reels')
    .select('*')
    .order('published_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getLatestInstagramMetrics(): Promise<InstagramReelMetrics[]> {
  const { data: latestDate } = await supabase
    .from('instagram_reel_metrics')
    .select('snapshot_date')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single()

  if (!latestDate) return []

  const { data, error } = await supabase
    .from('instagram_reel_metrics')
    .select('*')
    .eq('snapshot_date', latestDate.snapshot_date)

  if (error) throw error
  return data || []
}

export async function getInstagramReelsWithMetrics(): Promise<InstagramReelWithLatestMetrics[]> {
  const [reels, metrics] = await Promise.all([
    getInstagramReels(),
    getLatestInstagramMetrics(),
  ])
  const metricsMap = new Map(metrics.map(m => [m.instagram_media_id, m]))
  return reels.map(r => ({
    ...r,
    latest_metrics: metricsMap.get(r.instagram_media_id) || null,
  }))
}

export async function getInstagramKPIs(): Promise<InstagramKPIs> {
  const [reels, metrics] = await Promise.all([
    getInstagramReels(),
    getLatestInstagramMetrics(),
  ])

  const totalReach = metrics.reduce((sum, m) => sum + (m.reach || 0), 0)
  const totalSaved = metrics.reduce((sum, m) => sum + (m.saved || 0), 0)
  const totalInteractions = metrics.reduce((sum, m) => sum + (m.total_interactions || 0), 0)
  const watchTimes = metrics.filter(m => m.avg_watch_time_ms != null).map(m => m.avg_watch_time_ms! / 1000)
  const avgWatchTimeSeconds = watchTimes.length ? watchTimes.reduce((a, b) => a + b, 0) / watchTimes.length : 0
  const lastSynced = metrics.length ? metrics[0]?.snapshot_date : null

  return { totalReels: reels.length, totalReach, totalSaved, avgWatchTimeSeconds, totalInteractions, lastSynced }
}

export async function getInstagramReelsForTagging(): Promise<InstagramReel[]> {
  const { data, error } = await supabase
    .from('instagram_reels')
    .select('*')
    .order('published_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function linkReelToVideo(instagramMediaId: string, youtubeVideoId: string | null): Promise<void> {
  const { error } = await supabase
    .from('instagram_reels')
    .update({ youtube_video_id: youtubeVideoId, updated_at: new Date().toISOString() })
    .eq('instagram_media_id', instagramMediaId)
  if (error) throw error
}

// ── Comments ─────────────────────────────────────────────────────────────────

export async function getVideoComments(youtubeVideoId: string): Promise<VideoComment[]> {
  const { data, error } = await supabase
    .from('video_comments')
    .select('*')
    .eq('youtube_video_id', youtubeVideoId)
    .order('like_count', { ascending: false })
    .limit(50)
  if (error) throw error
  return data || []
}

export async function getInstagramReelComments(instagramMediaId: string): Promise<InstagramReelComment[]> {
  const { data, error } = await supabase
    .from('instagram_reel_comments')
    .select('*')
    .eq('instagram_media_id', instagramMediaId)
    .order('timestamp', { ascending: false })
    .limit(50)
  if (error) throw error
  return data || []
}
