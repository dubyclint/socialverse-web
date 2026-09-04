import { serverSupabaseClient } from '#supabase/server'
import { requireRole } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

interface GrantBody {
  userId?: string
  maxMarginPct?: number
  isActive?: boolean
  revoke?: boolean
  notes?: string
}

/** Grant, adjust or revoke the sell privilege. */
export default defineEventHandler(async (event) => {
  const actor = await requireRole(event, 'manager')
  const body = await readBody<GrantBody>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  if (!body.userId) throw createError({ statusCode: 400, statusMessage: 'userId is required' })

  const margin = body.maxMarginPct ?? 3
  if (margin < 0 || margin > 100) {
    throw createError({ statusCode: 400, statusMessage: 'maxMarginPct must be between 0 and 100' })
  }

  const { data, error } = await supabase
    .from('seller_profiles')
    .upsert({
      user_id: body.userId,
      granted_by: actor.id,
      max_margin_pct: margin,
      is_active: body.revoke ? false : (body.isActive ?? true),
      revoked_at: body.revoke ? new Date().toISOString() : null,
      notes: body.notes ?? null
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { seller: data }
})
