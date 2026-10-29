<template>
  <div class="st">
    <header class="head">
      <NuxtLink to="/admin" class="back">←</NuxtLink>
      <div class="min-w-0">
        <h1>Staff & sellers</h1>
        <p>Grant or revoke P2P seller privilege and support / P2P / dispute roles</p>
      </div>
    </header>

    <section class="card">
      <div class="search">
        <input v-model="username" placeholder="Username, e.g. kehinde" @keyup.enter="lookup" />
        <button class="btn primary" :disabled="busy || !username.trim()" @click="lookup">Find</button>
      </div>
      <p v-if="lookedUp && !found" class="hint">No user with that username.</p>

      <div v-if="found" class="person">
        <div class="who">
          <img :src="found.avatar_url || '/default-avatar.svg'" alt="" />
          <span class="names"><strong>{{ found.display_name || found.username }}</strong><small>@{{ found.username }} · app role {{ found.role }}</small></span>
        </div>

        <div class="block">
          <div class="line">
            <span class="names"><strong>P2P seller</strong><small>{{ sellerOf(found.user_id)?.is_active && !sellerOf(found.user_id)?.revoked_at ? `Active · max margin ${sellerOf(found.user_id)?.max_margin_pct}%` : 'Not a seller' }}</small></span>
            <div class="actions">
              <input v-model.number="maxMargin" type="number" min="0" max="100" step="0.5" class="num" title="Max margin %" />
              <button v-if="isActiveSeller(found.user_id)" class="btn danger" :disabled="busy" @click="act('revoke_seller')">Revoke</button>
              <button v-else class="btn primary" :disabled="busy" @click="act('grant_seller')">Grant</button>
            </div>
          </div>
          <div v-for="r in ROLES" :key="r.key" class="line">
            <span class="names"><strong>{{ r.label }}</strong><small>{{ r.desc }}</small></span>
            <div class="actions">
              <button v-if="hasRole(found.user_id, r.key)" class="btn danger" :disabled="busy" @click="act('revoke_role', r.key)">Revoke</button>
              <button v-else class="btn primary" :disabled="busy" @click="act('grant_role', r.key)">Grant</button>
            </div>
          </div>
          <div class="row2">
            <label class="field"><span>Support languages (comma separated)</span><input v-model="languages" placeholder="en, fr, yo" /></label>
            <label class="field"><span>Countries / phone codes</span><input v-model="countries" placeholder="NG, +234" /></label>
          </div>
        </div>
      </div>
      <p v-if="error" class="err">{{ error }}</p>
      <p v-if="notice" class="ok">{{ notice }}</p>
    </section>

    <section class="card">
      <h2>Current sellers</h2>
      <ul class="list">
        <li v-for="s in data.sellers" :key="s.user_id" class="line">
          <span class="names"><strong>@{{ userOf(s.user_id)?.username || s.user_id.slice(0, 8) }}</strong><small>{{ s.is_active && !s.revoked_at ? 'Active' : 'Revoked' }} · max margin {{ s.max_margin_pct }}%</small></span>
          <div class="actions">
            <button class="btn ghost" @click="pickUser(s.user_id)">Manage</button>
          </div>
        </li>
        <li v-if="!data.sellers.length" class="hint">No sellers yet.</li>
      </ul>
    </section>

    <section class="card">
      <h2>Staff roles</h2>
      <ul class="list">
        <li v-for="r in data.roles" :key="r.user_id + r.role" class="line">
          <span class="names"><strong>@{{ userOf(r.user_id)?.username || r.user_id.slice(0, 8) }}</strong><small>{{ ROLES.find(x => x.key === r.role)?.label }} · {{ (r.languages || []).join(', ') }}</small></span>
          <div class="actions">
            <button class="btn ghost" @click="pickUser(r.user_id)">Manage</button>
          </div>
        </li>
        <li v-if="!data.roles.length" class="hint">No staff roles yet. Admins and managers already have full access.</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'], layout: 'default' })

const ROLES = [
  { key: 'support_agent', label: 'Support agent', desc: 'Claims tickets from the queue; sees only assigned or unclaimed tickets' },
  { key: 'support_manager', label: 'Support manager', desc: 'Sees all tickets, assigns agents, can decide disputes' },
  { key: 'dispute_decider', label: 'Dispute decider', desc: 'Makes final release / return decisions on P2P escrow' },
  { key: 'p2p_admin', label: 'P2P & escrow admin', desc: 'Manages P2P trades, sellers and escrow' }
] as const

interface U { user_id: string, username: string, display_name: string | null, avatar_url: string | null, role: string }
interface Seller { user_id: string, is_active: boolean, revoked_at: string | null, max_margin_pct: number }
interface Role { user_id: string, role: string, languages: string[] | null, countries: string[] | null }

const data = reactive<{ roles: Role[], sellers: Seller[], users: U[] }>({ roles: [], sellers: [], users: [] })
const username = ref('')
const found = ref<U | null>(null)
const lookedUp = ref(false)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const maxMargin = ref(3)
const languages = ref('en')
const countries = ref('')

const userOf = (id: string) => data.users.find(u => u.user_id === id) || (found.value?.user_id === id ? found.value : null)
const sellerOf = (id: string) => data.sellers.find(s => s.user_id === id)
const isActiveSeller = (id: string) => { const s = sellerOf(id); return !!s && s.is_active && !s.revoked_at }
const hasRole = (id: string, role: string) => data.roles.some(r => r.user_id === id && r.role === role)
const errMsg = (e: unknown) => (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Request failed'

async function load(name = '') {
  const res = await $fetch<{ roles: Role[], sellers: Seller[], users: U[], found: U | null }>('/api/admin/staff', { query: name ? { username: name } : {} })
  data.roles = res.roles; data.sellers = res.sellers; data.users = res.users
  return res.found
}
async function lookup() {
  error.value = ''; notice.value = ''
  try { found.value = await load(username.value.trim()); lookedUp.value = true; syncFields() } catch (e) { error.value = errMsg(e) }
}
function pickUser(id: string) { const u = userOf(id); if (u) { found.value = u as U; username.value = (u as U).username; syncFields() } }
function syncFields() {
  if (!found.value) return
  const s = sellerOf(found.value.user_id); if (s) maxMargin.value = Number(s.max_margin_pct)
  const r = data.roles.find(x => x.user_id === found.value!.user_id)
  languages.value = (r?.languages || ['en']).join(', '); countries.value = (r?.countries || []).join(', ')
}
async function act(action: string, role?: string) {
  if (!found.value) return
  if (action.startsWith('revoke') && !confirm('Revoke this privilege?')) return
  busy.value = true; error.value = ''; notice.value = ''
  try {
    await $fetch('/api/admin/staff', { method: 'POST', body: {
      userId: found.value.user_id, action, role, maxMarginPct: maxMargin.value,
      languages: languages.value.split(','), countries: countries.value.split(',')
    } })
    await load(); notice.value = 'Saved'
  } catch (e) { error.value = errMsg(e) } finally { busy.value = false }
}
onMounted(() => load().catch((e) => { error.value = errMsg(e) }))
</script>

<style scoped>
.st { max-width: 760px; margin: 0 auto; padding: 12px 16px 100px; color: #e2e8f0; display: flex; flex-direction: column; gap: 12px; }
.head { display: flex; align-items: flex-start; gap: 12px; }
.head h1 { font-size: 20px; margin: 0; line-height: 1.2; }
.head p { font-size: 13px; color: #94a3b8; margin: 4px 0 0; line-height: 1.4; }
.back { flex-shrink: 0; width: 36px; height: 36px; display: grid; place-content: center; border-radius: 999px; background: #1e293b; color: #e2e8f0; text-decoration: none; }
.min-w-0 { min-width: 0; flex: 1; }
.card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.card h2 { font-size: 14px; margin: 0; font-weight: 700; }
.search { display: flex; gap: 8px; }
.search input, .field input, .num { min-width: 0; background: #020617; border: 1px solid #334155; border-radius: 12px; padding: 10px 12px; color: #f8fafc; font-size: 16px; outline: none; transition: border-color .15s; }
.search input:focus, .field input:focus, .num:focus { border-color: #4f46e5; }
.search input { flex: 1; }
.num { width: 80px; flex-shrink: 0; text-align: center; }
.person, .block { display: flex; flex-direction: column; gap: 10px; }
.who { display: flex; align-items: center; gap: 12px; min-width: 0; }
.who img { flex-shrink: 0; width: 44px; height: 44px; border-radius: 999px; object-fit: cover; background: #1e293b; }
.line { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; background: #020617; border: 1px solid #1e293b; }
.names { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.names strong { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.3; }
.names small { font-size: 11.5px; color: #94a3b8; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.field span { font-size: 11px; color: #94a3b8; font-weight: 600; letter-spacing: .02em; text-transform: uppercase; }
.btn { flex-shrink: 0; padding: 0 14px; height: 36px; min-width: 72px; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 13px; font-weight: 600; border: 0; cursor: pointer; white-space: nowrap; transition: all .15s; -webkit-tap-highlight-color: transparent; }
.btn:active { transform: scale(.97); }
.btn:disabled { opacity: .5; pointer-events: none; }
.btn.primary { background: #4f46e5; color: #fff; }
.btn.primary:hover { background: #4338ca; }
.btn.ghost { background: #1e293b; color: #e2e8f0; }
.btn.ghost:hover { background: #334155; }
.btn.danger { background: #7f1d1d; color: #fecaca; }
.btn.danger:hover { background: #991b1b; }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.hint { font-size: 12.5px; color: #94a3b8; margin: 0; padding: 6px 2px; }
.err { color: #fca5a5; font-size: 13px; margin: 0; background: #450a0a30; border: 1px solid #7f1d1d; padding: 8px 10px; border-radius: 10px; }
.ok { color: #86efac; font-size: 13px; margin: 0; background: #052e1630; border: 1px solid #166534; padding: 8px 10px; border-radius: 10px; }

/* Mobile */
@media (max-width: 640px) {
  .st { padding: 10px 12px 90px; gap: 10px; }
  .head h1 { font-size: 18px; }
  .card { padding: 12px; border-radius: 14px; }
  .search { flex-direction: column; }
  .search .btn { width: 100%; height: 42px; }
  .line { align-items: flex-start; flex-direction: column; gap: 10px; }
  .line .names { width: 100%; }
  .line .actions { width: 100%; justify-content: flex-end; }
  .line .actions .btn { flex: 1; }
  .row2 { grid-template-columns: 1fr; }
}

@media (max-width: 380px) {
  .btn { min-width: 64px; padding: 0 10px; font-size: 12px; }
}
</style>
