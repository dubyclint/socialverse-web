import { readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { logStaffAction, requireStaff } from '~/server/utils/staff'

interface Body {
  id?: number
  title?: string
  message?: string
  level?: 'info' | 'warning' | 'critical'
  linkUrl?: string | null
  endsAt?: string | null
  active?: boolean
}

/** Publish a new announcement (retiring the previous one) or toggle an existing one. */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'announcements')
  const body = await readBody<Body>(event)
  const s = getServiceClient()
  const table = s.from('announcements' as never)

  if (body?.id) {
    const { error } = await table.update({ active: Boolean(body.active), updated_at: new Date().toISOString() } as never).eq('id' as never, body.id as never)
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    await logStaffAction(staff.id, body.active ? 'announcement_activate' : 'announcement_retire', 'announcement', String(body.id))
    return { success: true }
  }

  const title = body?.title?.trim() ?? ''
  const message = body?.message?.trim() ?? ''
  if (!title || title.length > 100) throw createError({ statusCode: 400, statusMessage: 'Title is required (max 100 characters)' })
  if (!message || message.length > 1000) throw createError({ statusCode: 400, statusMessage: 'Message is required (max 1000 characters)' })
  const level = body.level && ['info', 'warning', 'critical'].includes(body.level) ? body.level : 'info'
  const linkUrl = body.linkUrl?.trim() || null
  if (linkUrl && !/^(https:\/\/|\/)/.test(linkUrl)) throw createError({ statusCode: 400, statusMessage: 'Link must start with https:// or /' })
  const endsAt = body.endsAt ? new Date(body.endsAt) : null
  if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= Date.now())) {
    throw createError({ statusCode: 400, statusMessage: 'End time must be in the future' })
  }

  await table.update({ active: false, updated_at: new Date().toISOString() } as never).eq('active' as never, true as never)
  const { data, error } = await table.insert({
    title, message, level, link_url: linkUrl, ends_at: endsAt?.toISOString() ?? null,
    created_by: staff.id, created_by_role: staff.role
  } as never).select('id').single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const id = (data as { id: number }).id
  await logStaffAction(staff.id, 'announcement_publish', 'announcement', String(id), { title, level })
  return { success: true, id }
})
