<!-- Behaviour & compliance: bans, timed bans, per-feature restrictions, user reports and flagged content. -->
<template>
  <div class="sa">
    <header class="sa-top">
      <NuxtLink to="/admin" class="sa-back"><Icon name="arrow-left" size="18" /> Control</NuxtLink>
      <h1>Behaviour &amp; compliance</h1>
    </header>
    <nav class="sa-tabs">
      <button :class="{ active: tab === 'users' }" @click="tab = 'users'">Accounts</button>
      <button :class="{ active: tab === 'reports' }" @click="tab = 'reports'">Reports &amp; flags</button>
    </nav>
    <p v-if="error" class="sa-error">{{ error }}</p>
    <p v-if="notice" class="sa-ok">{{ notice }}</p>

    <template v-if="tab === 'users'">
      <div class="sa-card">
        <input v-model="q" class="sa-input" placeholder="Search by username, name or email (empty = restricted accounts)" @input="onSearch" />
      </div>
      <p v-if="loading" class="sa-muted">Loading…</p>
      <p v-else-if="!users.length" class="sa-muted">No accounts.</p>
      <div v-for="u in users" :key="u.user_id" class="sa-card sa-grid">
        <div class="sa-row">
          <NuxtLink :to="`/profile/${u.user_id}`" class="sa-who">
            <img :src="u.avatar_url || '/default-avatar.svg'" alt="" />
            <div>
              <div class="sa-name">{{ u.display_name || u.username }}</div>
              <div class="sa-muted">@{{ u.username }} · {{ u.email }} · {{ u.role }} · {{ u.wallet_balance }} PEW</div>
            </div>
          </NuxtLink>
          <span v-if="u.is_banned" class="sa-chip red">Banned{{ u.banned_until ? ` until ${new Date(u.banned_until).toLocaleString()}` : '' }}</span>
          <span v-for="(r, key) in u.restrictions" :key="key" class="sa-chip red">{{ featureLabel(String(key)) }}{{ r.until ? ` until ${new Date(r.until).toLocaleDateString()}` : '' }}</span>
        </div>
        <p v-if="u.ban_reason" class="sa-muted">Ban reason: {{ u.ban_reason }}</p>
        <div v-if="u.role !== 'admin'" class="sa-row">
          <select v-model="form(u.user_id).action" class="sa-select">
            <option value="ban">Ban account</option>
            <option value="restrict">Restrict a feature</option>
          </select>
          <select v-if="form(u.user_id).action === 'restrict'" v-model="form(u.user_id).feature" class="sa-select">
            <option v-for="r in RESTRICTION_KEYS" :key="r.key" :value="r.key">{{ r.label }}</option>
          </select>
          <select v-model.number="form(u.user_id).hours" class="sa-select">
            <option :value="0">Permanent</option>
            <option :value="1">1 hour</option>
            <option :value="24">24 hours</option>
            <option :value="72">3 days</option>
            <option :value="168">7 days</option>
            <option :value="720">30 days</option>
          </select>
          <input v-model="form(u.user_id).reason" class="sa-input" style="flex:1;min-width:160px" placeholder="Reason (shown to the user)" />
          <button class="sa-btn danger" :disabled="busy || !form(u.user_id).reason" @click="apply(u.user_id)">Apply</button>
          <button v-if="u.is_banned" class="sa-btn ok" :disabled="busy" @click="send({ userId: u.user_id, action: 'unban' })">Lift ban</button>
          <button v-for="(_, key) in u.restrictions" :key="`un-${key}`" class="sa-btn secondary" :disabled="busy" @click="send({ userId: u.user_id, action: 'unrestrict', feature: String(key) })">Allow {{ featureLabel(String(key)).toLowerCase() }}</button>
        </div>
      </div>
    </template>

    <template v-else>
      <h3>User reports</h3>
      <p v-if="!reports.length" class="sa-muted">No open reports.</p>
      <div v-for="r in reports" :key="r.id" class="sa-card sa-grid">
        <div class="sa-row">
          <span class="sa-chip red">{{ r.reason }}</span>
          <span class="sa-muted">@{{ r.reporter ?? 'unknown' }} reported {{ r.reported ? `@${r.reported}` : 'content' }} · {{ new Date(r.created_at).toLocaleString() }}</span>
        </div>
        <p v-if="r.description">{{ r.description }}</p>
        <div class="sa-row">
          <NuxtLink v-if="r.post_id" :to="`/posts/${r.post_id}`" class="sa-btn secondary">View post</NuxtLink>
          <button class="sa-btn secondary" :disabled="busy" @click="resolve('report', r.id, 'dismissed', false)">Dismiss</button>
          <button v-if="r.post_id || r.comment_id" class="sa-btn danger" :disabled="busy" @click="resolve('report', r.id, 'actioned', true)">Remove content</button>
          <button v-if="r.reported_user_id" class="sa-btn" @click="openUser(r.reported ?? '')">Restrict user…</button>
        </div>
      </div>
      <h3>Flagged content</h3>
      <p v-if="!flagged.length" class="sa-muted">Nothing flagged.</p>
      <div v-for="f in flagged" :key="f.id" class="sa-card sa-row">
        <span class="sa-chip red">{{ f.content_type }}</span>
        <span class="sa-muted" style="flex:1">{{ f.reason }} · by @{{ f.flagger ?? 'system' }}</span>
        <button class="sa-btn secondary" :disabled="busy" @click="resolve('flag', f.id, 'dismissed', false)">Dismiss</button>
        <button class="sa-btn danger" :disabled="busy" @click="resolve('flag', f.id, 'actioned', true)">Remove</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { RESTRICTION_KEYS } from '~/utils/staff-permissions'
import '~/assets/css/staff-admin.css'

definePageMeta({ middleware: ['auth', 'route-guard'], layout: 'default' })
useHead({ title: 'Compliance' })

interface Restriction { until: string | null, reason: string | null }
interface Account {
  user_id: string, username: string, display_name: string | null, email: string | null, avatar_url: string | null, role: string
  is_banned: boolean | null, banned_until: string | null, ban_reason: string | null, restrictions: Record<string, Restriction>, wallet_balance: number
}
interface Report { id: string, reporter: string | null, reported: string | null, reported_user_id: string | null, post_id: string | null, comment_id: string | null, reason: string, description: string | null, created_at: string }
interface Flag { id: string, content_type: string, reason: string | null, flagger: string | null }
interface ActionForm { action: 'ban' | 'restrict', feature: string, hours: number, reason: string }

const tab = ref<'users' | 'reports'>('users')
const q = ref('')
const users = ref<Account[]>([])
const reports = ref<Report[]>([])
const flagged = ref<Flag[]>([])
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const forms = reactive<Record<string, ActionForm>>({})

const form = (id: string): ActionForm => (forms[id] ??= { action: 'restrict', feature: RESTRICTION_KEYS[0]?.key ?? 'post', hours: 24, reason: '' })
const featureLabel = (key: string) => RESTRICTION_KEYS.find(r => r.key === key)?.label ?? key
const msg = (err: unknown, fallback: string) => (err as { data?: { statusMessage?: string } }).data?.statusMessage || fallback

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = (await $fetch<{ users: Account[] }>('/api/admin/compliance/users', { query: { q: q.value } })).users
      .map(u => ({ ...u, restrictions: u.restrictions ?? {} }))
  } catch (err) {
    error.value = msg(err, 'Could not load accounts')
  } finally {
    loading.value = false
  }
}
const loadReports = async () => {
  try {
    const res = await $fetch<{ reports: Report[], flagged: Flag[] }>('/api/admin/compliance/reports')
    reports.value = res.reports
    flagged.value = res.flagged
  } catch (err) {
    error.value = msg(err, 'Could not load reports')
  }
}

let timer: ReturnType<typeof setTimeout> | null = null
const onSearch = () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(loadUsers, 300)
}

const send = async (body: Record<string, unknown>) => {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await $fetch('/api/admin/compliance/action', { method: 'POST', body })
    notice.value = 'Saved. The user has been notified.'
    await loadUsers()
  } catch (err) {
    error.value = msg(err, 'Action failed')
  } finally {
    busy.value = false
  }
}
const apply = (userId: string) => {
  const f = form(userId)
  void send({ userId, action: f.action, feature: f.action === 'restrict' ? f.feature : undefined, hours: f.hours || null, reason: f.reason })
}
const resolve = async (kind: 'report' | 'flag', id: string, outcome: string, removeContent: boolean) => {
  if (removeContent && !confirm('Delete this content permanently?')) return
  busy.value = true
  try {
    await $fetch('/api/admin/compliance/resolve', { method: 'POST', body: { kind, id, outcome, removeContent } })
    await loadReports()
  } catch (err) {
    error.value = msg(err, 'Action failed')
  } finally {
    busy.value = false
  }
}
const openUser = (username: string) => {
  tab.value = 'users'
  q.value = username
  void loadUsers()
}

watch(tab, t => (t === 'users' ? loadUsers() : loadReports()))
onMounted(loadUsers)
</script>
