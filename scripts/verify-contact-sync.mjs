// Ad-hoc end-to-end check: two real accounts, phone-hash contact sync, PAL
// suggestions and chat discovery. Run with `node scripts/verify-contact-sync.mjs`.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] ??= m[2]
}

const url = process.env.SUPABASE_URL
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})
const anon = createClient(url, process.env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const stamp = Date.now()
const people = [
  { tag: 'a', phone: '+2348031000001', country: 'NG' },
  { tag: 'b', phone: '+2348031000002', country: 'NG' }
]

const created = []
const cleanup = async () => {
  for (const id of created) await admin.auth.admin.deleteUser(id).catch(() => {})
}

// @nuxtjs/supabase resolves the user from the ssr cookie (named after
// `cookiePrefix`), not from a bearer header, and chunks long values.
const COOKIE_NAME = 'sb-socialverse'
const CHUNK = 3180

const sessionCookie = (session) => {
  const value = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64')
  if (value.length <= CHUNK) return `${COOKIE_NAME}=${value}`
  const parts = []
  for (let i = 0; i * CHUNK < value.length; i++) {
    parts.push(`${COOKIE_NAME}.${i}=${value.slice(i * CHUNK, (i + 1) * CHUNK)}`)
  }
  return parts.join('; ')
}

const api = async (path, person, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${person.token}`,
      cookie: sessionCookie(person.session),
      ...(body ? { 'content-type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = text }
  return { status: res.status, body: json }
}

try {
  for (const p of people) {
    const email = `verify-${p.tag}-${stamp}@example.com`
    const password = `Pw!${stamp}${p.tag}`
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true
    })
    if (error) throw error
    p.id = data.user.id
    created.push(p.id)

    const { error: upErr } = await admin.from('user').upsert({
      user_id: p.id,
      email,
      username: `verify_${p.tag}_${stamp}`,
      full_name: `Verify ${p.tag.toUpperCase()}`,
      phone: p.phone,
      phone_country: p.country
    }, { onConflict: 'user_id' })
    if (upErr) throw upErr

    const { data: session, error: signErr } = await anon.auth.signInWithPassword({ email, password })
    if (signErr) throw signErr
    p.token = session.session.access_token
    p.session = session.session
  }

  const { data: rows } = await admin.from('user')
    .select('user_id, phone, phone_country, phone_hash')
    .in('user_id', created)
  console.log('accounts:', rows.map(r => ({
    phone: r.phone, country: r.phone_country, hashed: Boolean(r.phone_hash)
  })))

  const [a, b] = people

  // A syncs B's number in *national* format — the format a real phonebook holds.
  const sync = await api('/api/contacts/sync', a, {
    contacts: [
      { phone: '0803 100 0002', name: 'Bee From Phonebook' },
      { phone: '08039999999', name: 'Not Registered' }
    ]
  })
  console.log('sync:', sync.status, JSON.stringify(sync.body))

  const { data: contactRows } = await admin.from('user_contacts')
    .select('display_name, contact_id, is_registered')
    .eq('user_id', a.id)
  console.log('user_contacts:', contactRows)

  for (const path of ['/api/pals/suggestions', '/api/chat/people', '/api/contacts']) {
    const res = await api(path, a)
    const preview = typeof res.body === 'string' ? res.body.slice(0, 160) : JSON.stringify(res.body).slice(0, 400)
    console.log(`${path} -> ${res.status} ${preview}`)
  }

  const matchedB = contactRows?.some(r => r.contact_id === b.id)
  console.log(matchedB ? 'RESULT: national-format contact matched the registered account' : 'RESULT: NO MATCH')
} finally {
  await cleanup()
}
