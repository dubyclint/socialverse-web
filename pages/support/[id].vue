<template>
  <div class="tk">
    <header class="head">
      <NuxtLink :to="viewer?.isStaffView && !viewer?.isParty ? '/admin/support-queue' : '/support'" class="back">←</NuxtLink>
      <div class="min-w-0">
        <h1>{{ ticket?.subject || 'Ticket' }}</h1>
        <p v-if="ticket">{{ ticket.category === 'p2p_dispute' ? 'P2P dispute' : ticket.category }} · {{ assignedName ? `Handled by ${assignedName}` : 'Waiting for an agent' }}</p>
      </div>
      <span v-if="ticket" :class="['pill', ticket.status]">{{ ticket.status }}</span>
    </header>

    <section v-if="trade" class="card trade">
      <strong>{{ trade.kind === 'withdraw' ? 'Withdrawal' : 'Deposit' }} · {{ trade.amount }} PEW · {{ trade.source_amount }} {{ trade.asset_code }}</strong>
      <small>Escrow {{ trade.status }} · paid marked {{ trade.paid_declared_at ? new Date(trade.paid_declared_at).toLocaleString() : 'no' }} · receipt confirmed {{ trade.seller_confirmed_at ? 'yes' : 'no' }}</small>
      <small v-if="trade.dispute_reason">Reason: {{ trade.dispute_reason }}</small>
      <small v-if="trade.decision_note">Decision: {{ trade.decision_note }}</small>
      <NuxtLink v-if="viewer?.isParty" :to="`/p2p?trade=${trade.id}`" class="link">Open trade</NuxtLink>
      <div v-if="viewer?.canDecide && trade.status === 'disputed'" class="decide">
        <textarea v-model="decisionNote" rows="2" placeholder="Reason for the final decision (shown to both sides)" />
        <div class="actions">
          <button class="btn primary" :disabled="busy" @click="decide('release')">Release PEW to buyer</button>
          <button class="btn danger" :disabled="busy" @click="decide('cancel')">Return PEW to holder</button>
        </div>
      </div>
    </section>

    <section v-if="viewer?.isStaffView && !viewer?.isParty" class="card staff">
      <div class="actions">
        <button v-if="viewer.canClaim" class="btn primary" :disabled="busy" @click="action('claim')">Claim ticket</button>
        <template v-else-if="isMine || viewer.isSupportManager">
          <button class="btn ghost" :disabled="busy" @click="action('pending')">Waiting on user</button>
          <button class="btn ghost" :disabled="busy" @click="action('resolve')">Resolve</button>
          <button class="btn ghost" :disabled="busy" @click="escalate">Escalate to admin</button>
          <button class="btn ghost" :disabled="busy" @click="action('unclaim')">Unclaim</button>
        </template>
      </div>
      <p v-if="ticket?.escalation_note" class="hint">Escalation note: {{ ticket.escalation_note }}</p>
    </section>

    <ul ref="thread" class="thread">
      <li v-for="m in messages" :key="m.id" :class="['msg', { system: m.is_system, me: m.sender_id === me, staff: m.is_staff && !m.is_system }]">
        <small v-if="!m.is_system">{{ m.sender_id === me ? 'You' : nameOf(m.sender_id) }}{{ m.is_staff ? ' · Support' : '' }} · {{ new Date(m.created_at).toLocaleString() }}</small>
        <p>{{ m.body }}</p>
        <a v-for="a in m.attachments" :key="a" :href="a" target="_blank" rel="noopener" class="att">
          <img v-if="/\.(png|jpe?g|webp|gif)(\?|$)/i.test(a)" :src="a" alt="evidence" />
          <span v-else>Attachment</span>
        </a>
      </li>
    </ul>

    <footer v-if="ticket && ticket.status !== 'closed' && canReply" class="composer">
      <label class="clip" title="Attach evidence">📎<input type="file" accept="image/*,application/pdf" hidden @change="attach" /></label>
      <div class="min-w-0">
        <div v-if="pending.length" class="pending"><span v-for="p in pending" :key="p">📄 attached</span></div>
        <textarea v-model="text" rows="1" placeholder="Write a message or add proof" />
      </div>
      <button class="btn primary" :disabled="busy || (!text.trim() && !pending.length)" @click="send">Send</button>
    </footer>
    <p v-if="error" class="err">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'], layout: 'default' })

interface Msg { id: string, sender_id: string | null, body: string, attachments: string[], is_staff: boolean, is_system: boolean, created_at: string }
interface Ticket { id: string, subject: string, category: string, status: string, assigned_to: string | null, escalation_note: string | null }
interface Viewer { isParty: boolean, isStaffView: boolean, canClaim: boolean, canDecide: boolean, isSupportManager: boolean }
interface Trade { id: string, kind: string, status: string, amount: number, source_amount: number, asset_code: string, paid_declared_at: string | null, seller_confirmed_at: string | null, dispute_reason: string | null, decision_note: string | null }

const route = useRoute()
const user = useSupabaseUser()
const me = computed(() => user.value?.id)
const id = computed(() => String(route.params.id))
const ticket = ref<Ticket | null>(null)
const messages = ref<Msg[]>([])
const people = ref<{ user_id: string, username: string, display_name: string | null }[]>([])
const trade = ref<Trade | null>(null)
const viewer = ref<Viewer | null>(null)
const text = ref('')
const pending = ref<string[]>([])
const busy = ref(false)
const error = ref('')
const decisionNote = ref('')
const thread = ref<HTMLElement | null>(null)
let poller: ReturnType<typeof setInterval> | null = null

const isMine = computed(() => ticket.value?.assigned_to === me.value)
const canReply = computed(() => viewer.value?.isParty || isMine.value || ticket.value?.status === 'escalated')
const nameOf = (uid: string | null) => { const p = people.value.find(x => x.user_id === uid); return p?.display_name || (p ? `@${p.username}` : 'User') }
const assignedName = computed(() => ticket.value?.assigned_to ? nameOf(ticket.value.assigned_to) : '')
const errMsg = (e: unknown) => (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Something went wrong'

async function load() {
  try {
    const res = await $fetch<{ ticket: Ticket, messages: Msg[], people: typeof people.value, trade: Trade | null, viewer: Viewer }>(`/api/support/tickets/${id.value}`)
    const grew = res.messages.length !== messages.value.length
    ticket.value = res.ticket; messages.value = res.messages; people.value = res.people; trade.value = res.trade; viewer.value = res.viewer
    if (grew) nextTick(() => thread.value?.lastElementChild?.scrollIntoView({ block: 'end' }))
  } catch (e) { error.value = errMsg(e) }
}

async function attach(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 8 * 1024 * 1024) { error.value = 'File is larger than 8 MB'; return }
  busy.value = true
  try {
    const fd = new FormData(); fd.append('file', file)
    const res = await $fetch<{ url?: string, data?: { url?: string } }>('/api/upload', { method: 'POST', body: fd })
    const url = res.url || res.data?.url
    if (url) pending.value.push(url)
  } catch (e) { error.value = errMsg(e) } finally { busy.value = false }
}

async function send() {
  busy.value = true; error.value = ''
  try {
    await $fetch(`/api/support/tickets/${id.value}/messages`, { method: 'POST', body: { body: text.value, attachments: pending.value } })
    text.value = ''; pending.value = []
    await load()
  } catch (e) { error.value = errMsg(e) } finally { busy.value = false }
}

async function action(a: string, note?: string) {
  busy.value = true; error.value = ''
  try { await $fetch(`/api/support/tickets/${id.value}/action`, { method: 'POST', body: { action: a, note } }); await load() } catch (e) { error.value = errMsg(e) } finally { busy.value = false }
}
function escalate() {
  const note = prompt('Note for the admin / dispute decider')
  if (note?.trim()) action('escalate', note.trim())
}
async function decide(a: 'release' | 'cancel') {
  if (!trade.value || !decisionNote.value.trim()) { error.value = 'Write the reason for the decision'; return }
  if (!confirm('This decision is final and moves the escrowed PEW. Continue?')) return
  busy.value = true; error.value = ''
  try { await $fetch(`/api/p2p/trades/${trade.value.id}/decide`, { method: 'POST', body: { action: a, note: decisionNote.value } }); await load() } catch (e) { error.value = errMsg(e) } finally { busy.value = false }
}

onMounted(() => { load(); poller = setInterval(load, 8000) })
onBeforeUnmount(() => { if (poller) clearInterval(poller) })
</script>

<style scoped>
.tk { max-width: 720px; margin: 0 auto; padding: 8px 10px 90px; color: #e2e8f0; display: flex; flex-direction: column; gap: 8px; min-height: 100dvh; }
.head { display: flex; align-items: center; gap: 10px; }
.head h1 { font-size: 16px; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.head p { font-size: 12px; color: #94a3b8; margin: 0; text-transform: capitalize; }
.back { flex-shrink: 0; width: 32px; height: 32px; display: grid; place-content: center; border-radius: 999px; background: #1e293b; color: #e2e8f0; }
.min-w-0 { min-width: 0; flex: 1; }
.pill { flex-shrink: 0; font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #334155; text-transform: capitalize; }
.pill.open { background: #1e3a8a; color: #bfdbfe; }
.pill.pending { background: #713f12; color: #fde68a; }
.pill.escalated { background: #7f1d1d; color: #fecaca; }
.pill.resolved, .pill.closed { background: #14532d; color: #bbf7d0; }
.card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
.card small { font-size: 12px; color: #94a3b8; }
.link { font-size: 12px; color: #a5b4fc; }
.decide textarea, .composer textarea { width: 100%; background: #020617; border: 1px solid #334155; border-radius: 10px; padding: 8px 10px; color: #f8fafc; font-size: 16px; resize: vertical; }
.actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.btn { padding: 7px 12px; border-radius: 10px; font-size: 13px; font-weight: 600; border: 0; flex-shrink: 0; }
.btn:disabled { opacity: .5; }
.btn.primary { background: #4f46e5; color: #fff; }
.btn.ghost { background: #1e293b; color: #e2e8f0; }
.btn.danger { background: #7f1d1d; color: #fecaca; }
.hint { font-size: 12px; color: #fca5a5; margin: 0; }
.thread { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.msg { max-width: 85%; align-self: flex-start; background: #1e293b; border-radius: 12px; padding: 8px 10px; }
.msg.me { align-self: flex-end; background: #312e81; }
.msg.staff { background: #064e3b; }
.msg.system { align-self: center; background: transparent; color: #94a3b8; font-size: 12px; text-align: center; padding: 2px; }
.msg small { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 2px; }
.msg p { margin: 0; font-size: 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
.att img { max-width: 200px; border-radius: 8px; margin-top: 4px; display: block; }
.att span { font-size: 12px; color: #a5b4fc; }
.composer { position: sticky; bottom: 0; display: flex; align-items: flex-end; gap: 6px; background: #020617; padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0px)); }
.clip { flex-shrink: 0; width: 36px; height: 36px; display: grid; place-content: center; border-radius: 999px; background: #1e293b; cursor: pointer; }
.pending { font-size: 11px; color: #a5b4fc; display: flex; gap: 6px; }
.err { color: #fca5a5; font-size: 13px; }
</style>
