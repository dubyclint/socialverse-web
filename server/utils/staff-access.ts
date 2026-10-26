import { getServiceClient } from '~/server/utils/supabase-admin'

export type StaffRole = 'p2p_admin' | 'support_agent' | 'support_manager' | 'dispute_decider'
export const STAFF_ROLES: StaffRole[] = ['p2p_admin', 'support_agent', 'support_manager', 'dispute_decider']

export interface StaffAccess {
  userId: string
  appRole: string
  roles: StaffRole[]
  languages: string[]
  countries: string[]
  isAdmin: boolean
  isSupport: boolean
  isSupportManager: boolean
  canDecideDisputes: boolean
  canManageP2p: boolean
}

export async function getStaffAccess(userId: string): Promise<StaffAccess> {
  const db = getServiceClient()
  const [{ data: u }, { data: rows }] = await Promise.all([
    db.from('user').select('role').eq('user_id', userId).maybeSingle(),
    db.from('staff_roles' as never).select('role, languages, countries').eq('user_id', userId)
  ])
  const appRole = (u as { role?: string } | null)?.role ?? 'user'
  const list = (rows ?? []) as unknown as { role: StaffRole, languages: string[] | null, countries: string[] | null }[]
  const roles = list.map(r => r.role)
  const isAdmin = appRole === 'admin'
  const isManager = isAdmin || appRole === 'manager'
  const isSupportManager = isManager || roles.includes('support_manager')
  return {
    userId,
    appRole,
    roles,
    languages: [...new Set(list.flatMap(r => r.languages ?? []))],
    countries: [...new Set(list.flatMap(r => r.countries ?? []))],
    isAdmin,
    isSupport: isSupportManager || roles.includes('support_agent'),
    isSupportManager,
    canDecideDisputes: isManager || roles.includes('dispute_decider') || roles.includes('p2p_admin') || roles.includes('support_manager'),
    canManageP2p: isManager || roles.includes('p2p_admin')
  }
}
