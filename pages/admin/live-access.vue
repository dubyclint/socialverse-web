<template>
  <div class="live-admin">
    <NuxtLink to="/admin" class="back">← Control dashboard</NuxtLink>
    <h1>Live access</h1>
    <p class="muted">Every account gets a lifetime free trial. After it, only qualified accounts or accounts you grant can go live. Watching and joining streams is always open.</p>

    <p v-if="message" class="alert" :class="{ ok: !isError }">{{ message }}</p>

    <form v-if="rules" class="rules" @submit.prevent="saveRules">
      <h2>Requirements</h2>
      <label v-for="field in FIELDS" :key="field.key">
        <span>{{ field.label }}</span>
        <input v-model.number="rules[field.key]" type="number" min="0" step="any" required>
      </label>
      <button type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save requirements' }}</button>
    </form>

    <section class="users">
      <h2>Accounts</h2>
      <input v-model="query" type="search" placeholder="Search by name or username (empty shows accounts with overrides)" @input="debouncedSearch">
      <p v-if="loadingUsers" class="muted">Loading…</p>
      <p v-else-if="!users.length" class="muted">No accounts found.</p>
      <div v-for="user in users" :key="user.id" class="user-row">
        <img :src="user.avatar_url || '/default-avatar.svg'" alt="" class="avatar">
        <div class="user-info">
          <strong>{{ user.name }}</strong> <span class="muted">@{{ user.username }}</span>
          <div class="chips">
            <span class="chip" :class="user.eligibility.mode">{{ MODE_LABELS[user.eligibility.mode] }}</span>
            <span class="chip">Trial left {{ Math.floor(user.eligibility.trialSecondsLeft / 60) }}m</span>
            <span class="chip">{{ user.eligibility.progress.followers }} followers</span>
            <span class="chip">{{ user.eligibility.progress.pewAdded }} added / {{ user.eligibility.progress.pewReceived }} received PEW</span>
            <span class="chip">{{ user.eligibility.progress.activeDays }} active days</span>
            <span class="chip">{{ user.eligibility.progress.transactions }} transactions</span>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="grant" :disabled="busy === user.id" @click="act(user, 'grant')">Grant</button>
          <button type="button" class="deny" :disabled="busy === user.id" @click="act(user, 'deny')">Disallow</button>
          <button type="button" :disabled="busy === user.id" @click="act(user, 'auto')">Use rules</button>
          <button type="button" :disabled="busy === user.id" @click="act(user, 'reset_trial')">Reset trial</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

definePageMeta({ middleware: ['auth'], layout: 'default' })
useHead({ title: 'Live access' })

type RuleKey = 'trial_minutes' | 'min_followers' | 'min_account_days' | 'min_pew_added' | 'min_pew_received' | 'min_active_days' | 'min_transactions' | 'window_days'
type Mode = 'waived' | 'qualified' | 'trial' | 'locked' | 'denied'
interface LiveUser {
  id: string
  name: string
  username: string
  avatar_url: string | null
  eligibility: { mode: Mode, trialSecondsLeft: number, progress: { followers: number, pewAdded: number, pewReceived: number, activeDays: number, transactions: number } }
}

const FIELDS: { key: RuleKey, label: string }[] = [
  { key: 'trial_minutes', label: 'Free trial (total minutes per account)' },
  { key: 'min_followers', label: 'Minimum active followers' },
  { key: 'min_account_days', label: 'Minimum account age (days)' },
  { key: 'min_pew_added', label: 'PEW added (or…)' },
  { key: 'min_pew_received', label: '…PEW received' },
  { key: 'min_active_days', label: 'Active days in window' },
  { key: 'min_transactions', label: 'Wallet transactions in window' },
  { key: 'window_days', label: 'Activity window (days)' }
]
const MODE_LABELS: Record<Mode, string> = { waived: 'Granted by admin', qualified: 'Qualified', trial: 'On trial', locked: 'Not qualified', denied: 'Disallowed' }

const rules = ref<Record<RuleKey, number> | null>(null)
const users = ref<LiveUser[]>([])
const query = ref('')
const saving = ref(false)
const loadingUsers = ref(false)
const busy = ref('')
const message = ref('')
const isError = ref(false)

const notify = (text: string, error = false) => { message.value = text; isError.value = error }
const errText = (err: unknown) => (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Something went wrong'

const loadRules = async () => {
  try {
    rules.value = (await $fetch<{ rules: Record<RuleKey, number> }>('/api/admin/live-access/rules')).rules
  } catch (err) { notify(errText(err), true) }
}

const search = async () => {
  loadingUsers.value = true
  try {
    users.value = (await $fetch<{ users: LiveUser[] }>('/api/admin/live-access/users', { query: { q: query.value.trim() } })).users
  } catch (err) { notify(errText(err), true) } finally { loadingUsers.value = false }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(search, 350)
}

const saveRules = async () => {
  if (!rules.value) return
  saving.value = true
  try {
    rules.value = (await $fetch<{ rules: Record<RuleKey, number> }>('/api/admin/live-access/rules', { method: 'PUT', body: rules.value })).rules
    notify('Requirements saved')
  } catch (err) { notify(errText(err), true) } finally { saving.value = false }
}

const act = async (user: LiveUser, action: 'grant' | 'deny' | 'auto' | 'reset_trial') => {
  busy.value = user.id
  try {
    const res = await $fetch<{ eligibility: LiveUser['eligibility'] }>('/api/admin/live-access/action', { method: 'POST', body: { userId: user.id, action } })
    user.eligibility = res.eligibility
    notify(`${user.name}: ${MODE_LABELS[res.eligibility.mode]}`)
  } catch (err) { notify(errText(err), true) } finally { busy.value = '' }
}

onMounted(() => { void loadRules(); void search() })
</script>

<style scoped>
.live-admin { max-width: 960px; margin: 0 auto; padding: 1rem; color: #e2e8f0; display: flex; flex-direction: column; gap: 1rem; }
.back { color: #93c5fd; font-size: 0.85rem; }
h1 { margin: 0; }
h2 { margin: 0 0 0.75rem; font-size: 1.1rem; }
.muted { color: #94a3b8; font-size: 0.9rem; }
.alert { padding: 0.6rem 0.9rem; border-radius: 10px; background: rgba(220, 38, 38, 0.15); color: #fca5a5; }
.alert.ok { background: rgba(22, 163, 74, 0.15); color: #86efac; }
.rules, .users { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 1rem; }
.rules { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
.rules h2, .rules button { grid-column: 1 / -1; }
.rules label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.85rem; }
input { background: #1e293b; border: 1px solid #334155; color: #f8fafc; border-radius: 8px; padding: 0.5rem 0.65rem; width: 100%; }
button { background: #334155; color: #e2e8f0; border: none; border-radius: 8px; padding: 0.45rem 0.8rem; cursor: pointer; }
.rules button { background: #2563eb; justify-self: start; }
button:disabled { opacity: 0.5; }
.user-row { display: flex; gap: 0.75rem; align-items: center; padding: 0.75rem 0; border-top: 1px solid #1e293b; flex-wrap: wrap; }
.avatar { width: 44px; height: 44px; border-radius: 999px; object-fit: cover; }
.user-info { flex: 1; min-width: 220px; }
.chips { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.3rem; }
.chip { font-size: 0.75rem; background: #1e293b; border-radius: 999px; padding: 0.15rem 0.55rem; }
.chip.waived, .chip.qualified { background: #14532d; }
.chip.trial { background: #78350f; }
.chip.locked, .chip.denied { background: #7f1d1d; }
.actions { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.grant { background: #15803d; }
.deny { background: #b91c1c; }
</style>
