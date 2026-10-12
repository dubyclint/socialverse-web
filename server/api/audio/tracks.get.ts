// Royalty-free catalog backed by the public Audius API (trending, or search with ?q=).
const AUDIUS = 'https://api.audius.co/v1'
// The trimmer decodes the whole file in the browser, so very long mixes are skipped.
const MAX_TRACK_SECONDS = 600

interface AudiusTrack {
  id: string
  title: string
  duration: number
  is_streamable?: boolean
  genre?: string
  user?: { name?: string }
  artwork?: Record<string, string> | null
}

export default defineEventHandler(async (event) => {
  const q = String(getQuery(event).q ?? '').trim().slice(0, 80)
  const url = q
    ? `${AUDIUS}/tracks/search?query=${encodeURIComponent(q)}&limit=25&app_name=viorp`
    : `${AUDIUS}/tracks/trending?limit=25&app_name=viorp`
  try {
    const res = await $fetch<{ data: AudiusTrack[] }>(url, { timeout: 10000 })
    const tracks = (res.data ?? [])
      .filter(t => t.is_streamable !== false && t.duration > 0 && t.duration <= MAX_TRACK_SECONDS)
      .map(t => ({
        id: t.id,
        title: t.title,
        artist: t.user?.name ?? 'Unknown artist',
        duration: t.duration,
        genre: t.genre ?? null,
        artwork: t.artwork?.['150x150'] ?? null,
        stream_url: `/api/audio/audius/${t.id}`,
        source: 'audius' as const
      }))
    return { tracks }
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Music catalog is unavailable right now' })
  }
})
