import { createError, type H3Event } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { STAFF_PERMISSION_KEYS, type RestrictionKey, type StaffPermission } from '~/utils/staff-permissions'

export interface StaffContext {
  id: string
  role: 'admin' | 'manager'
  permissions: string[]
}

export const loadStaff = async (userId: string): Promise<StaffContext | null> => {
  const { data } = await getServiceClient()
    .from('user')
    .select('role, manager_permissions')
    .eq('user_id', userId)
    .maybeSingle()
  const row = data as { role?: string | null, manager_permissions?: string[] | null } | null
  if (row?.role === 'admin') return { id: userId, role: 'admin', permissions: [...STAFF_PERMISSION_KEYS] }
  if (row?.role === 'manager') {
    return { id: userId, role: 'manager', permissions: (row.manager_permissions ?? []).filter(p => STAFF_PERMISSION_KEYS.includes(p)) }
  }
  return null
}

/** Admins pass every check; managers only for permissions an admin granted them. */
export const requireStaff = async (event: H3Event, permission?: StaffPermission | 'admin'): Promise<StaffContext> => {
  const user = await requireUser(event)
  const staff = await loadStaff(user.id)
  if (!staff) throw createError({ statusCode: 403, statusMessage: 'Admin or manager access required' })
  if (permission === 'admin' && staff.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }
  if (permission && permission !== 'admin' && !staff.permissions.includes(permission)) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission for this section' })
  }
  return staff
}

export const logStaffAction = async (
  staffId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {}
) => {
  await getServiceClient().from('admin_actions').insert({
    admin_id: staffId,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details as never
  })
}

interface AccountState {
  is_banned: boolean | null
  banned_until: string | null
  ban_reason: string | null
  restrictions: Record<string, unknown> | null
}

const loadAccountState = async (userId: string): Promise<AccountState | null> => {
  const { data } = await getServiceClient()
    .from('user')
    .select('is_banned, banned_until, ban_reason, restrictions')
    .eq('user_id', userId)
    .maybeSingle()
  return data as AccountState | null
}

export const isBanActive = (state: Pick<AccountState, 'is_banned' | 'banned_until'> | null): boolean =>
  Boolean(state?.is_banned) && (!state?.banned_until || new Date(state.banned_until).getTime() > Date.now())

/** Throws 403 when the account is banned or the feature is restricted by staff. */
export const assertAllowed = async (userId: string, feature: RestrictionKey): Promise<void> => {
  const state = await loadAccountState(userId)
  if (isBanActive(state)) {
    const until = state?.banned_until ? ` until ${new Date(state.banned_until).toUTCString()}` : ''
    throw createError({ statusCode: 403, statusMessage: `Your account is suspended${until}.` })
  }
  const entry = state?.restrictions?.[feature] as { until?: string | null } | boolean | undefined
  if (!entry) return
  const until = typeof entry === 'object' ? entry.until : null
  if (until && new Date(until).getTime() <= Date.now()) return
  throw createError({
    statusCode: 403,
    statusMessage: `This feature is restricted on your account${until ? ` until ${new Date(until).toUTCString()}` : ''}.`
  })
}
