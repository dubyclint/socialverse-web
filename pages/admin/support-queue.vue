<template>
  <div class="q">
    <header class="head">
      <NuxtLink to="/feed" class="back">←</NuxtLink>
      <div class="min-w-0">
        <h1>Support queue</h1>
        <p>Claim a ticket before replying. Escalate disputes that need an admin decision.</p>
      </div>
    </header>
    <nav class="tabs">
      <button v-for="s in scopes" :key="s.key" :class="{ on: scope === s.key }" @click="scope = s.key; load()">{{ s.label }}</button>
    </nav>
    <p v-if="error" class="err">{{ error }}</p>
    <ul class="list">
      <li v-if="loaded && !tickets.length" class="hint">Nothing here.</li>
      <li v-for="t in tickets" :key="t.id">
        <NuxtLink :to="`/support/${t.id}`" class="row">
          <span class="icon">{{ t.category === 'p2p_dispute' ? '⚖️' : '💬' }}</span>
          <span class="names">
            <strong>{{ t.subject }}</strong>
            <small>@{{ nameOf(t.user_id) }} · {{ t.language }}{{ t.country ? ' · ' + t.country : '' }} · {{ ago(t.created_at) }}{{ t.assigned_to ? ' · ' + nameOf(t.assigned_to) : '' }}</small>
          </span>
          <span :class="['pill', t.priority]">{{ t.status === 'escalated' ? 'escalated' : t.priority }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'], layout: 'default' })

interface T { id: string, subject: string, category: string, status: string, priority: string, language: string, country: string | null, user_id: string, assigned_to: string | null, created_at: string }
const scopes = [
  { key: 'queue', label: 'Unclaimed' }, { key: 'mine', label: 'Mine' }, { key: 'escalated', label: 'Escalated' }, { key: 'all', label: 'All' }
]
const scope = ref('queue')
const tickets = ref<T[]>([])
const people = ref<{ user_id: string, username: string }[]>([])
const loaded = ref(false)
const error = ref('')
const nameOf = (id: string) => people.value.find(p => p.user_id === id)?.username || id.slice(0, 8)
const ago = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d` }
async function load() {
  error.value = ''
  try {
    const res = await $fetch<{ tickets: T[], people: typeof people.value }>('/api/support/queue', { query: { scope: scope.value } })
    tickets.value = res.tickets; people.value = res.people
  } catch (e) { error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not load the queue' } finally { loaded.value = true }
}
let poller: ReturnType<typeof setInterval> | null = null
onMounted(() => { load(); poller = setInterval(load, 15000) })
onBeforeUnmount(() => { if (poller) clearInterval(poller) })
</script>

<style scoped>
.q { max-width: 760px; margin: 0 auto; padding: 8px 10px 80px; color: #e2e8f0; display: flex; flex-direction: column; gap: 8px; }
.head { display: flex; align-items: center; gap: 10px; }
.head h1 { font-size: 18px; margin: 0; }
.head p { font-size: 12px; color: #94a3b8; margin: 0; }
.back { flex-shrink: 0; width: 32px; height: 32px; display: grid; place-content: center; border-radius: 999px; background: #1e293b; color: #e2e8f0; }
.min-w-0 { min-width: 0; flex: 1; }
.tabs { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
.tabs button { flex-shrink: 0; padding: 6px 14px; border-radius: 999px; background: #1e293b; color: #cbd5e1; font-size: 13px; border: 0; }
.tabs button.on { background: #4f46e5; color: #fff; }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.row { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 10px; background: #0f172a; border: 1px solid #1e293b; color: inherit; }
.icon { flex-shrink: 0; width: 32px; height: 32px; display: grid; place-content: center; border-radius: 999px; background: #1e293b; }
.names { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.names strong, .names small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.names strong { font-size: 13px; }
.names small { font-size: 11px; color: #94a3b8; }
.pill { flex-shrink: 0; font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #334155; text-transform: capitalize; }
.pill.high { background: #713f12; color: #fde68a; }
.pill.urgent { background: #7f1d1d; color: #fecaca; }
.hint { font-size: 13px; color: #94a3b8; }
.err { color: #fca5a5; font-size: 13px; }
</style>
