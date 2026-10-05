import { defineEventHandler, getQuery, createError } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadBlockedIds } from '~/server/utils/pals'
import { DIRECTORY_COLUMNS, loadRelationships, toDirectoryProfile } from '~/server/utils/social-graph'

const LIMIT = 30

/** People search by username, display name or full name, with the viewer's relationship to each. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const term = String(getQuery(event).q ?? '').trim().replace(/^@/, '')
  if (term.length < 2) return { success: true, data: [] }

  const service = getServiceClient()
  // PostgREST `or` syntax: strip characters that would break the filter list.
  const safe = term.replace(/[%,()*\\]/g, ' ').trim()
  if (!safe) return { success: true, data: [] }
  const pattern = `%${safe}%`

  const [{ data, error }, blocked] = await Promise.all([
    service
      .from('user')
      .select(DIRECTORY_COLUMNS)
      .or(`username.ilike.${pattern},display_name.ilike.${pattern},full_name.ilike.${pattern}`)
      .neq('user_id', user.id)
      .eq('is_banned', false)
      .order('followers_count', { ascending: false })
      .limit(LIMIT),
    loadBlockedIds(service, user.id)
  ])

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const rows = (data ?? []).filter(row => !blocked.has(row.user_id))
  const relationships = await loadRelationships(service, user.id, rows.map(row => row.user_id))
  const lowered = safe.toLowerCase()

  const results = rows
    .map(row => ({ ...toDirectoryProfile(row), relationship: relationships.get(row.user_id) }))
    // Exact and prefix username matches first.
    .sort((a, b) => rank(b.username, lowered) - rank(a.username, lowered))

  return { success: true, data: results }
})

const rank = (username: string | null, term: string) => {
  const name = username?.toLowerCase() ?? ''
  if (name === term) return 2
  if (name.startsWith(term)) return 1
  return 0
}
