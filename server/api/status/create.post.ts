import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

const COLOR_RE = /^#[0-9a-f]{6}$/i

/** Posts a 24-hour status: text on a colour, or a photo/video (uploaded via /api/upload) with an optional caption. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ content?: string, media_url?: string | null, background_color?: string, text_color?: string }>(event)
  const content = (body?.content ?? '').trim()
  const mediaUrl = (body?.media_url ?? '').trim() || null

  if (!content && !mediaUrl) throw createError({ statusCode: 400, statusMessage: 'Write something or add a photo or video' })
  if (content.length > 700) throw createError({ statusCode: 400, statusMessage: 'Status text is limited to 700 characters' })
  if (mediaUrl && !/^https:\/\//i.test(mediaUrl)) throw createError({ statusCode: 400, statusMessage: 'Invalid media' })

  const background = COLOR_RE.test(body?.background_color ?? '') ? body!.background_color! : '#1e293b'
  const textColor = COLOR_RE.test(body?.text_color ?? '') ? body!.text_color! : '#ffffff'

  const { data, error } = await getServiceClient()
    .from('user_statuses')
    .insert({
      user_id: user.id,
      content: content || null,
      caption: content || null,
      media_url: mediaUrl,
      background_color: background,
      text_color: textColor,
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    })
    .select('id, created_at, expires_at')
    .single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true, data }
})
