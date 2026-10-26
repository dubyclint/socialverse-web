<template>
  <div class="sup">
    <header class="head">
      <div class="min-w-0">
        <h1>Support</h1>
        <p>Tickets go to the Viorp support team. P2P disputes open here automatically.</p>
      </div>
      <NuxtLink v-if="isStaff" to="/admin/support-queue" class="chip">Agent queue</NuxtLink>
    </header>

    <section class="card">
      <button v-if="!creating" class="btn primary" @click="creating = true">+ New ticket</button>
      <template v-else>
        <div class="row2">
          <label class="field"><span>Topic</span>
            <select v-model="form.category">
              <option value="general">General</option><option value="account">Account &amp; login</option><option value="wallet">Wallet &amp; payments</option>
              <option value="escrow">Escrow</option><option value="verification">Verification badge</option><option value="safety">Safety / report</option><option value="other">Other</option>
            </select>
          </label>
          <label class="field"><span>Subject</span><input v-model="form.subject" maxlength="140" /></label>
        </div>
        <label class="field"><span>Describe the problem</span><textarea v-model="form.message" rows="4" maxlength="4000" /></label>
        <div class="actions">
          <button class="btn primary" :disabled="busy || !form.subject.trim() || !form.message.trim()" @click="create">{{ busy ? 'Sending…' : 'Send ticket' }}</button>
          <button class="btn ghost" @click="creating = false">Cancel</button>
        </div>
      </template>
      <p v-if="error" class="err">{{ error }}</p>
    </section>

    <section class="card">
      <h2>Your tickets</h2>
      <ul class="list">
        <li v-if="loaded && !tickets.length" class="empty">No tickets yet.</li>
        <li v-for="t in tickets" :key="t.id">
          <NuxtLink :to="`/support/${t.id}`" class="row">
            <span class="icon">{{ t.category === 'p2p_dispute' ? '⚖️' : '💬' }}</span>
            <span class="names">
              <strong>{{ t.subject }}</strong>
              <small>{{ label(t.category) }} · {{ new Date(t.updated_at).toLocaleString() }}</small>
            </span>
            <span :class="['pill', t.status]">{{ t.status }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'], layout: 'default' })

interface Ticket { id: string, subject: string, category: string, status: string, updated_at: string }
const tickets = ref<Ticket[]>([])
const loaded = ref(false)
const creating = ref(false)
const busy = ref(false)
const error = ref('')
const isStaff = ref(false)
const form = reactive({ category: 'general', subject: '', message: '' })
const label = (c: string) => ({ p2p_dispute: 'P2P dispute', general: 'General', account: 'Account', wallet: 'Wallet', escrow: 'Escrow', verification: 'Verification', safety: 'Safety', other: 'Other' } as Record<string, string>)[c] ?? c

async function load() {
  tickets.value = (await $fetch<{ tickets: Ticket[] }>('/api/support/tickets')).tickets
  loaded.value = true
}
async function create() {
  busy.value = true; error.value = ''
  try {
    const lang = (navigator.language || 'en').slice(0, 2)
    const res = await $fetch<{ ticket: Ticket }>('/api/support/tickets', { method: 'POST', body: { ...form, language: lang } })
    await navigateTo(`/support/${res.ticket.id}`)
  } catch (e) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not send the ticket'
  } finally { busy.value = false }
}
onMounted(async () => {
  await load().catch(() => { loaded.value = true })
  isStaff.value = await $fetch('/api/support/queue', { query: { scope: 'mine' } }).then(() => true, () => false)
})
</script>

<style scoped>
.sup { max-width: 720px; margin: 0 auto; padding: 8px 10px 80px; color: #e2e8f0; display: flex; flex-direction: column; gap: 8px; }
.head { display: flex; align-items: center; gap: 10px; }
.head h1 { font-size: 18px; margin: 0; }
.head p { font-size: 12px; color: #94a3b8; margin: 0; }
.min-w-0 { min-width: 0; flex: 1; }
.chip { flex-shrink: 0; font-size: 12px; padding: 6px 10px; border-radius: 999px; background: #312e81; color: #c7d2fe; }
.card { background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.card h2 { font-size: 14px; margin: 0; }
.row2 { display: grid; grid-template-columns: 1fr 2fr; gap: 8px; }
.field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.field span { font-size: 11px; color: #94a3b8; }
.field input, .field select, .field textarea { width: 100%; min-width: 0; background: #020617; border: 1px solid #334155; border-radius: 10px; padding: 8px 10px; color: #f8fafc; font-size: 16px; }
.btn { padding: 8px 14px; border-radius: 10px; font-size: 14px; font-weight: 600; border: 0; }
.btn:disabled { opacity: .5; }
.btn.primary { background: #4f46e5; color: #fff; }
.btn.ghost { background: #1e293b; color: #e2e8f0; }
.actions { display: flex; gap: 6px; }
.err { color: #fca5a5; font-size: 13px; margin: 0; }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.empty { font-size: 13px; color: #94a3b8; }
.row { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 10px; background: #020617; color: inherit; }
.icon { flex-shrink: 0; width: 32px; height: 32px; display: grid; place-content: center; border-radius: 999px; background: #1e293b; }
.names { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.names strong, .names small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.names strong { font-size: 13px; }
.names small { font-size: 11px; color: #94a3b8; }
.pill { flex-shrink: 0; font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #334155; text-transform: capitalize; }
.pill.open { background: #1e3a8a; color: #bfdbfe; }
.pill.pending { background: #713f12; color: #fde68a; }
.pill.escalated { background: #7f1d1d; color: #fecaca; }
.pill.resolved, .pill.closed { background: #14532d; color: #bbf7d0; }
@media (max-width: 480px) { .row2 { grid-template-columns: 1fr; } }
</style>
