import { getServiceClient } from '~/server/utils/supabase-admin'

export const PASSWORD_CHANGE_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000

type Kind = 'requested' | 'changed'
const table = () => getServiceClient().from('password_changes' as never)

/** Earliest date the user may change their password again, or null if allowed now. */
export async function nextPasswordChangeAt(userId: string): Promise<Date | null> {
  const { data } = await table()
    .select('created_at')
    .eq('user_id' as never, userId as never)
    .eq('kind' as never, 'changed' as never)
    .order('created_at' as never, { ascending: false })
    .limit(1)
  const last = (data as { created_at: string }[] | null)?.[0]?.created_at
  if (!last) return null
  const next = new Date(new Date(last).getTime() + PASSWORD_CHANGE_INTERVAL_MS)
  return next.getTime() > Date.now() ? next : null
}

export async function recordPasswordEvent(userId: string, kind: Kind) {
  await table().insert({ user_id: userId, kind } as never)
}

export function limitMessage(next: Date) {
  return `You can change your password once a month. Next change allowed on ${next.toUTCString().slice(0, 16)}.`
}
