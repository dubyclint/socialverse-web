import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import type { LeadQuestion } from '~/utils/ad-options'

/** Stores an instant-form submission and counts it as a campaign result. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') ?? ''
  const { answers } = await readBody<{ answers?: Record<string, string> }>(event)
  const service = getServiceClient()
  const { data: campaign } = await service.from('ads_campaigns').select('id, status, lead_form').eq('id', id).maybeSingle()
  const form = (campaign as { lead_form: { questions: LeadQuestion[] } | null } | null)?.lead_form
  if (!campaign || !form || (campaign as { status: string }).status !== 'ACTIVE') {
    throw createError({ statusCode: 404, statusMessage: 'This form is no longer accepting responses' })
  }
  const clean: Record<string, string> = {}
  for (const q of form.questions) {
    const value = String(answers?.[q.label] ?? '').trim().slice(0, 500)
    if (!value) throw createError({ statusCode: 400, statusMessage: `Please answer: ${q.label}` })
    if (q.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) throw createError({ statusCode: 400, statusMessage: 'Enter a valid email' })
    if (q.type === 'choice' && q.options?.length && !q.options.includes(value)) throw createError({ statusCode: 400, statusMessage: `Choose an option for: ${q.label}` })
    clean[q.label] = value
  }
  const { error } = await service.from('ad_leads' as never).insert({ campaign_id: id, user_id: user.id, answers: clean } as never)
  if (error) {
    if (error.code === '23505') throw createError({ statusCode: 409, statusMessage: 'You have already sent this form' })
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  await service.rpc('record_ad_interaction' as never, { p_campaign_id: id, p_viewer_id: user.id, p_interaction: 'LEAD', p_metadata: {} } as never)
  return { success: true }
})
