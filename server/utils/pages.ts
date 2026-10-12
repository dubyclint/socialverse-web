import { createError } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'

export const PAGE_COLUMNS =
  'id,name,handle,category,bio,avatar_url,cover_url,website,created_by_user_id,followers_count,posts_count,created_at,updated_at'
export const PAGE_CREATION_CAP = 5
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Load a page by id or handle, or 404. */
export const loadPage = async (idOrHandle: string) => {
  const service = getServiceClient()
  const query = service.from('pages').select(PAGE_COLUMNS)
  const { data, error } = UUID.test(idOrHandle)
    ? await query.eq('id', idOrHandle).maybeSingle()
    : await query.eq('handle', idOrHandle.toLowerCase()).maybeSingle()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  return data
}

export const normaliseHandle = (raw: unknown): string => {
  const handle = String(raw ?? '').trim().toLowerCase().replace(/^@/, '')
  if (!/^[a-z0-9_.]{3,30}$/.test(handle)) {
    throw createError({ statusCode: 400, statusMessage: 'Handle must be 3–30 letters, numbers, dots or underscores' })
  }
  return handle
}

export const cleanText = (raw: unknown, max: number, field: string): string | null => {
  if (raw === null || raw === undefined) return null
  const text = String(raw).trim()
  if (!text) return null
  if (text.length > max) throw createError({ statusCode: 400, statusMessage: `${field} must be at most ${max} characters` })
  return text
}
