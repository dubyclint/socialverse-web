import { getServiceClient } from '~/server/utils/supabase-admin'

/** The newest live announcement, cached briefly at the edge. Public. */
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120')
  const now = new Date().toISOString()
  const { data } = await getServiceClient().from('announcements' as never)
    .select('id, title, message, level, link_url, starts_at')
    .eq('active', true).lte('starts_at', now).or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('starts_at', { ascending: false }).limit(1)
  return { announcement: (data as unknown[] | null)?.[0] ?? null }
})
