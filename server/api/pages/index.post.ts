import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { PAGE_COLUMNS, PAGE_CREATION_CAP, cleanText, normaliseHandle } from '~/server/utils/pages'

interface CreatePageBody {
  name?: string
  handle?: string
  category?: string
  bio?: string
  avatar_url?: string
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<CreatePageBody>(event)
  const name = cleanText(body?.name, 80, 'Name')
  if (!name || name.length < 2) throw createError({ statusCode: 400, statusMessage: 'Page name is required' })
  const handle = normaliseHandle(body?.handle)

  const service = getServiceClient()
  const { count } = await service.from('pages').select('id', { count: 'exact', head: true }).eq('created_by_user_id', user.id)
  if ((count ?? 0) >= PAGE_CREATION_CAP) {
    throw createError({ statusCode: 409, statusMessage: `You can create at most ${PAGE_CREATION_CAP} Pages` })
  }

  const { data, error } = await service
    .from('pages')
    .insert({
      name,
      handle,
      category: cleanText(body?.category, 60, 'Category'),
      bio: cleanText(body?.bio, 500, 'Bio'),
      avatar_url: cleanText(body?.avatar_url, 1000, 'Avatar'),
      created_by_user_id: user.id
    })
    .select(PAGE_COLUMNS)
    .single()

  if (error) {
    if (error.code === '23505') throw createError({ statusCode: 409, statusMessage: 'That handle is taken' })
    if (error.code === 'P0001') throw createError({ statusCode: 409, statusMessage: error.message })
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  return { page: { ...data, role: 'OWNER' as const } }
})
