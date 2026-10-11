import { getServiceClient } from '~/server/utils/supabase-admin'

const MENTION = /(?:^|[^\w@])@([a-z0-9_.]{3,30})/gi

/** Lowercased usernames mentioned as `@name` in the text. */
export const extractMentions = (text: string): string[] =>
  Array.from(new Set(Array.from(text.matchAll(MENTION), m => m[1]!.toLowerCase().replace(/\.+$/, '')))).slice(0, 20)

/**
 * Notifies every user `@mentioned` in `text` (except the actor and anyone in `skip`).
 * Failures are logged, never thrown, so the originating action still succeeds.
 */
export const notifyMentions = async (opts: {
  text: string
  actorId: string
  actorName: string
  sourceId: string
  eventType: 'MENTION' | 'TAG'
  where: string
  skip?: string[]
}): Promise<void> => {
  const usernames = extractMentions(opts.text)
  if (!usernames.length) return
  try {
    const admin = getServiceClient()
    const { data: users } = await admin.from('user').select('user_id, username').in('username', usernames)
    const skip = new Set([opts.actorId, ...(opts.skip ?? [])])
    const rows = (users ?? [])
      .filter(u => !skip.has(u.user_id))
      .map(u => ({
        recipient_id: u.user_id,
        notifier_id: opts.actorId,
        event_type: opts.eventType,
        source_id: opts.sourceId,
        message_text: `${opts.actorName} ${opts.eventType === 'TAG' ? 'tagged' : 'mentioned'} you in ${opts.where}`
      }))
    if (rows.length) await admin.from('notifications').insert(rows)
  } catch (err) {
    console.error('[mentions] notify failed', err)
  }
}
