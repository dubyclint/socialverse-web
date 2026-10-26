import { requireRole } from '~/server/utils/rbac'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { STAFF_ROLES, type StaffRole } from '~/server/utils/staff-access'

interface Body {
  userId?: string
  action?: 'grant_role' | 'revoke_role' | 'grant_seller' | 'revoke_seller'
  role?: StaffRole
  languages?: string[]
  countries?: string[]
  maxMarginPct?: number
}

/** Assign/revoke seller privilege and P2P/support/dispute roles. Admins only (managers may grant sellers). */
export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)
  const actor = await requireRole(event, body.action === 'grant_seller' || body.action === 'revoke_seller' ? 'manager' : 'admin')
  if (!body.userId) throw createError({ statusCode: 400, statusMessage: 'userId is required' })
  const db = getServiceClient()
  const now = new Date().toISOString()

  if (body.action === 'grant_seller' || body.action === 'revoke_seller') {
    const margin = Number(body.maxMarginPct ?? 3)
    if (!(margin >= 0 && margin <= 100)) throw createError({ statusCode: 400, statusMessage: 'Max margin must be 0-100%' })
    const revoke = body.action === 'revoke_seller'
    const { error } = await db.from('seller_profiles').upsert({
      user_id: body.userId, granted_by: actor.id, max_margin_pct: margin, is_active: !revoke, revoked_at: revoke ? now : null,
      ...(revoke ? {} : { granted_at: now })
    }, { onConflict: 'user_id' })
    if (error) throw createError({ statusCode: 400, statusMessage: error.message })
    if (revoke) await db.from('p2p_listings').update({ is_active: false }).eq('seller_id', body.userId)
  } else if (body.action === 'grant_role' || body.action === 'revoke_role') {
    if (!body.role || !STAFF_ROLES.includes(body.role)) throw createError({ statusCode: 400, statusMessage: 'Unknown role' })
    if (body.action === 'revoke_role') {
      await db.from('staff_roles' as never).delete().eq('user_id', body.userId).eq('role', body.role)
    } else {
      const clean = (list?: string[]) => (list ?? []).map(s => String(s).trim().toLowerCase()).filter(Boolean).slice(0, 20)
      const { error } = await db.from('staff_roles' as never).upsert({
        user_id: body.userId, role: body.role, granted_by: actor.id, granted_at: now,
        languages: clean(body.languages).length ? clean(body.languages) : ['en'], countries: clean(body.countries)
      } as never, { onConflict: 'user_id,role' })
      if (error) throw createError({ statusCode: 400, statusMessage: error.message })
    }
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Unknown action' })
  }
  await db.from('audit_logs' as never).insert({ actor_id: actor.id, action: `staff_${body.action}`, target_id: body.userId, detail: { role: body.role } } as never).then(() => null, () => null)
  return { success: true }
})
