import { requireStaff, logStaffAction } from '~/server/utils/staff'
import { revenueDb } from '~/server/utils/creator-revenue'

interface UserRow {
  user_id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  email: string | null
  phone: string | null
  phone_country: string | null
  phone_verified: boolean | null
  last_seen: string | null
  username_changed_at: string | null
  created_at: string | null
}

const latest = (...dates: (string | null | undefined)[]) =>
  dates.filter((d): d is string => Boolean(d)).sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null

/** Admin only: find accounts by username and show their linked email, phone, last seen and last username change. */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'admin')
  const q = String(getQuery(event).q ?? '').trim().replace(/^@/, '').toLowerCase()
  if (q.length < 2) throw createError({ statusCode: 400, statusMessage: 'Type at least 2 characters of the username' })
  if (!/^[a-z0-9._-]+$/.test(q)) throw createError({ statusCode: 400, statusMessage: 'Usernames only contain letters, numbers, dots, dashes and underscores' })

  const db = revenueDb()
  const cols = 'user_id, username, display_name, avatar_url, email, phone, phone_country, phone_verified, last_seen, username_changed_at, created_at'
  const escaped = q.replace(/[%_]/g, m => `\\${m}`)
  const [{ data: exact }, { data: similar, error }] = await Promise.all([
    db.from('user').select(cols).ilike('username', escaped).limit(1),
    db.from('user').select(cols).ilike('username', `${escaped}%`).order('username').limit(10)
  ])
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const rows = [...((exact ?? []) as UserRow[]), ...((similar ?? []) as UserRow[])]
    .filter((r, i, all) => all.findIndex(x => x.user_id === r.user_id) === i)
    .slice(0, 10)
  if (!rows.length) return { users: [] }

  const ids = rows.map(r => r.user_id)
  const [{ data: devices }, { data: presence }] = await Promise.all([
    db.from('user_devices').select('user_id, last_seen').in('user_id', ids).order('last_seen', { ascending: false }).limit(200),
    db.from('user_presence').select('user_id, last_seen, updated_at').in('user_id', ids)
  ])
  const deviceSeen = new Map<string, string>()
  for (const d of (devices ?? []) as { user_id: string, last_seen: string }[]) if (!deviceSeen.has(d.user_id)) deviceSeen.set(d.user_id, d.last_seen)
  const presenceSeen = new Map<string, string | null>()
  for (const p of (presence ?? []) as { user_id: string, last_seen: string | null, updated_at: string | null }[]) presenceSeen.set(p.user_id, latest(p.last_seen, p.updated_at))

  const users = await Promise.all(rows.map(async (r) => {
    let email = r.email
    let phone = r.phone
    if (!email || !phone) {
      const { data } = await db.auth.admin.getUserById(r.user_id).catch(() => ({ data: null }))
      email ||= data?.user?.email ?? null
      phone ||= data?.user?.phone || null
    }
    return {
      id: r.user_id,
      username: r.username,
      name: r.display_name,
      avatar_url: r.avatar_url,
      email,
      phone: phone ? `${r.phone_country && !phone.startsWith('+') ? `${r.phone_country} ` : ''}${phone}` : null,
      phone_verified: r.phone_verified === true,
      last_seen: latest(r.last_seen, deviceSeen.get(r.user_id), presenceSeen.get(r.user_id)),
      username_changed_at: r.username_changed_at,
      joined_at: r.created_at
    }
  }))

  await logStaffAction(staff.id, 'USER_LOOKUP', 'user', users[0]!.id, { query: q, results: users.map(u => u.username) }).catch(() => {})
  return { users }
})
