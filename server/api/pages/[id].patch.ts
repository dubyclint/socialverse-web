import { requirePageRole } from '~/server/utils/actor'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { PAGE_COLUMNS, cleanText, loadPage, normaliseHandle } from '~/server/utils/pages'
import type { Database } from '~/types/database.types'

type PageUpdate = Database['public']['Tables']['pages']['Update']

export default defineEventHandler(async (event) => {
  const page = await loadPage(getRouterParam(event, 'id') ?? '')
  await requirePageRole(event, page.id, ['OWNER', 'MANAGER'])
  const body = await readBody<Record<string, unknown>>(event)

  const update: PageUpdate = {}
  if (body.name !== undefined) {
    const name = cleanText(body.name, 80, 'Name')
    if (!name || name.length < 2) throw createError({ statusCode: 400, statusMessage: 'Page name is required' })
    update.name = name
  }
  if (body.handle !== undefined) update.handle = normaliseHandle(body.handle)
  if (body.category !== undefined) update.category = cleanText(body.category, 60, 'Category')
  if (body.bio !== undefined) update.bio = cleanText(body.bio, 500, 'Bio')
  if (body.website !== undefined) update.website = cleanText(body.website, 300, 'Website')
  if (body.avatar_url !== undefined) update.avatar_url = cleanText(body.avatar_url, 1000, 'Avatar')
  if (body.cover_url !== undefined) update.cover_url = cleanText(body.cover_url, 1000, 'Cover')
  if (!Object.keys(update).length) return { page }

  update.updated_at = new Date().toISOString()
  const { data, error } = await getServiceClient().from('pages').update(update).eq('id', page.id).select(PAGE_COLUMNS).single()
  if (error) {
    if (error.code === '23505') throw createError({ statusCode: 409, statusMessage: 'That handle is taken' })
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  return { page: data }
})
