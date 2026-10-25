<!-- Verification badges: review requests, assign / change / remove badges for users and Pages. -->
<template>
  <div class="sa">
    <header class="sa-top">
      <NuxtLink to="/admin" class="sa-back"><Icon name="arrow-left" size="18" /> Control</NuxtLink>
      <h1>Verification badges</h1>
    </header>
    <nav class="sa-tabs">
      <button v-for="t in TABS" :key="t.value" :class="{ active: tab === t.value }" @click="tab = t.value">{{ t.label }}</button>
    </nav>
    <p v-if="error" class="sa-error">{{ error }}</p>
    <p v-if="notice" class="sa-ok">{{ notice }}</p>

    <template v-if="tab === 'fees'">
      <div class="sa-card">
        <p>Fees in PEW, charged when someone applies. Leave empty to hide a plan.</p>
        <div v-for="(label, tier) in feeTiers" :key="tier" class="sa-row">
          <strong style="flex:1">{{ label }}</strong>
          <label>Monthly <input v-model="feeForm[`${tier}_monthly`]" class="sa-input" type="number" min="0" step="0.01" style="width:90px" /></label>
          <label>Yearly <input v-model="feeForm[`${tier}_yearly`]" class="sa-input" type="number" min="0" step="0.01" style="width:90px" /></label>
        </div>
        <button class="sa-btn" :disabled="busy" @click="saveFees">Save fees</button>
        <NuxtLink to="/verification/terms" target="_blank">View badge terms page</NuxtLink>
      </div>
    </template>

    <template v-if="tab === 'assign'">
      <div class="sa-card">
        <input v-model="q" class="sa-input" placeholder="Search a user or Page by name / username / handle" @input="onSearch" />
      </div>
      <div v-for="r in results" :key="r.kind + r.id" class="sa-card sa-row">
        <div class="sa-who">
          <img :src="r.avatar_url || '/default-avatar.svg'" alt="" />
          <div>
            <div class="sa-name">{{ r.name }} <VerifiedBadge v-if="r.verified" :type="r.type" :size="16" /></div>
            <div class="sa-muted">{{ r.kind === 'page' ? 'Page' : 'User' }} · @{{ r.handle }}</div>
          </div>
        </div>
        <select v-model="choice[r.kind + r.id]" class="sa-select">
          <option v-for="b in BADGE_TYPES" :key="b.value" :value="b.value">{{ b.label }}</option>
        </select>
        <button class="sa-btn ok" :disabled="busy" @click="act({ action: 'assign', kind: r.kind, targetId: r.id, type: choice[r.kind + r.id] || defaultType(r.kind) })">{{ r.verified ? 'Change badge' : 'Assign badge' }}</button>
        <button v-if="r.verified" class="sa-btn danger" :disabled="busy" @click="revoke(r.kind, r.id)">Remove</button>
      </div>
    </template>

    <template v-else-if="tab === 'verified'">
      <p v-if="!verified.length" class="sa-muted">No verified accounts yet.</p>
      <div v-for="v in verified" :key="v.kind + v.id" class="sa-card sa-row">
        <NuxtLink :to="v.kind === 'page' ? `/pages/${v.handle}` : `/profile/${v.id}`" class="sa-who">
          <img :src="v.avatar_url || '/default-avatar.svg'" alt="" />
          <div>
            <div class="sa-name">{{ v.name }} <VerifiedBadge :type="v.type" :size="16" /></div>
            <div class="sa-muted">{{ v.kind === 'page' ? 'Page' : 'User' }} · {{ label(v.type) }}</div>
          </div>
        </NuxtLink>
        <select v-model="choice[v.kind + v.id]" class="sa-select">
          <option v-for="b in BADGE_TYPES" :key="b.value" :value="b.value">{{ b.label }}</option>
        </select>
        <button class="sa-btn" :disabled="busy" @click="act({ action: 'assign', kind: v.kind, targetId: v.id, type: choice[v.kind + v.id] || v.type })">Change</button>
        <button class="sa-btn danger" :disabled="busy" @click="revoke(v.kind, v.id)">Remove</button>
      </div>
    </template>

    <template v-else>
      <p v-if="loading" class="sa-muted">Loading…</p>
      <p v-else-if="!requests.length" class="sa-muted">No {{ tab }} requests.</p>
      <div v-for="r in requests" :key="r.id" class="sa-card sa-grid">
        <div class="sa-row">
          <NuxtLink :to="r.page ? `/pages/${r.page.handle}` : `/profile/${r.user_id}`" class="sa-who">
            <img :src="(r.page?.avatar_url ?? r.user?.avatar_url) || '/default-avatar.svg'" alt="" />
            <div>
              <div class="sa-name">{{ r.page?.name ?? (r.user?.display_name || r.user?.username) }}</div>
              <div class="sa-muted">
                {{ r.page ? `Page @${r.page.handle} · owner @${r.user?.username}` : `@${r.user?.username}` }}
                · {{ r.page ? r.page.followers_count : r.user?.followers_count }} followers
              </div>
            </div>
          </NuxtLink>
          <span class="sa-chip">{{ label(r.category) }}</span>
          <span class="sa-muted">{{ new Date(r.created_at).toLocaleString() }}</span>
        </div>
        <p>{{ r.reason }}</p>
        <div class="sa-links">
          <a v-for="l in r.evidence.links" :key="l" :href="l" target="_blank" rel="noopener noreferrer">{{ l }}</a>
          <a v-for="d in r.evidence.documents" :key="d.name + d.url" :href="d.url ?? undefined" target="_blank" rel="noopener noreferrer">📎 {{ d.name }}</a>
        </div>
        <p v-if="r.review_note" class="sa-muted">Note: {{ r.review_note }}</p>
        <div v-if="r.status === 'pending'" class="sa-row">
          <select v-model="choice[r.id]" class="sa-select">
            <option v-for="b in BADGE_TYPES" :key="b.value" :value="b.value">{{ b.label }}</option>
          </select>
          <button class="sa-btn ok" :disabled="busy" @click="act({ action: 'approve', requestId: r.id, type: choice[r.id] || r.category || 'personal' })">Approve</button>
          <input v-model="notes[r.id]" class="sa-input" style="flex:1;min-width:160px" placeholder="Reason (required to reject)" />
          <button class="sa-btn danger" :disabled="busy || !notes[r.id]" @click="act({ action: 'reject', requestId: r.id, note: notes[r.id] })">Reject</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import VerifiedBadge from '~/components/VerifiedBadge.vue'
import { BADGE_TYPES } from '~/utils/staff-permissions'
import '~/assets/css/staff-admin.css'

definePageMeta({ middleware: ['auth', 'route-guard'], layout: 'default' })
useHead({ title: 'Verification badges' })

interface Person { username: string | null, display_name: string | null, avatar_url: string | null, followers_count: number | null }
interface RequestRow {
  id: string, user_id: string, category: string | null, reason: string | null, status: string, review_note: string | null, created_at: string
  evidence: { links: string[], documents: { name: string, url: string | null }[] }
  user: Person | null
  page: { name: string, handle: string, avatar_url: string | null, followers_count: number | null } | null
}
interface Entity { kind: 'user' | 'page', id: string, name: string, handle: string, avatar_url: string | null, type: string | null, verified?: boolean }

const TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'verified', label: 'Verified accounts' },
  { value: 'assign', label: 'Assign directly' },
  { value: 'fees', label: 'Badge fees' }
]
const feeForm = reactive<Record<string, number | string | null>>({})
const feeTiers = ref<Record<string, string>>({})
const loadFees = async () => {
  const r = await $fetch<{ fees: Record<string, number | null>, tiers: Record<string, string> }>('/api/verification/fees')
  feeTiers.value = r.tiers
  Object.assign(feeForm, r.fees)
}
const saveFees = async () => {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await $fetch('/api/admin/verification/fees', { method: 'POST', body: { ...feeForm } })
    notice.value = 'Badge fees saved. The terms page shows them now.'
  } catch (err) {
    error.value = msg(err, 'Could not save fees')
  } finally {
    busy.value = false
  }
}
const tab = ref('pending')
const requests = ref<RequestRow[]>([])
const verified = ref<Entity[]>([])
const results = ref<Entity[]>([])
const q = ref('')
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const choice = reactive<Record<string, string>>({})
const notes = reactive<Record<string, string>>({})

const label = (t: string | null | undefined) => BADGE_TYPES.find(b => b.value === t)?.label ?? 'Individual'
const defaultType = (kind: string) => (kind === 'page' ? 'business' : 'personal')
const msg = (err: unknown, fallback: string) => (err as { data?: { statusMessage?: string } }).data?.statusMessage || fallback

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const status = ['pending', 'approved', 'rejected'].includes(tab.value) ? tab.value : 'pending'
    const res = await $fetch<{ requests: RequestRow[], verified: Entity[] }>('/api/admin/verification', { query: { status } })
    requests.value = res.requests
    verified.value = res.verified
  } catch (err) {
    error.value = msg(err, 'Could not load requests')
  } finally {
    loading.value = false
  }
}

let timer: ReturnType<typeof setTimeout> | null = null
const onSearch = () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(async () => {
    try {
      results.value = (await $fetch<{ results: Entity[] }>('/api/admin/verification/search', { query: { q: q.value } })).results
    } catch (err) {
      error.value = msg(err, 'Search failed')
    }
  }, 300)
}

const act = async (body: Record<string, unknown>) => {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await $fetch('/api/admin/verification/action', { method: 'POST', body })
    notice.value = 'Saved. The owner has been notified.'
    await load()
    if (q.value) onSearch()
  } catch (err) {
    error.value = msg(err, 'Action failed')
  } finally {
    busy.value = false
  }
}

const revoke = (kind: string, targetId: string) => {
  const note = prompt('Reason for removing the badge (sent to the owner):') ?? ''
  if (!confirm('Remove this verification badge?')) return
  void act({ action: 'revoke', kind, targetId, note })
}

watch(tab, t => (t === 'fees' ? loadFees().catch(() => { error.value = 'Could not load fees' }) : load()))
onMounted(load)
</script>
