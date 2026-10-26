<template>
  <div class="p2p">
    <header class="p2p-head">
      <NuxtLink to="/wallet" class="back" aria-label="Back to wallet">←</NuxtLink>
      <div class="min-w-0">
        <h1>P2P {{ mode === 'withdraw' ? 'withdrawal' : 'deposit' }}</h1>
        <p>1 PEW = 1 USD · PEW is held in escrow until payment is confirmed</p>
      </div>
      <NuxtLink v-if="isSeller" to="/p2p/sell" class="seller-link">Seller desk</NuxtLink>
    </header>

    <nav class="tabs">
      <button :class="{ on: mode === 'deposit' }" @click="setMode('deposit')">Deposit</button>
      <button :class="{ on: mode === 'withdraw' }" @click="setMode('withdraw')">Withdraw</button>
      <button :class="{ on: mode === 'trades' }" @click="setMode('trades')">My trades<span v-if="openCount"> · {{ openCount }}</span></button>
    </nav>

    <section v-if="mode !== 'trades' && !activeTrade" class="card">
      <div class="row2">
        <label class="field">
          <span>Currency</span>
          <select v-model="asset">
            <option v-for="a in assets" :key="a.code" :value="a.code">{{ a.code }} · {{ a.display_name }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ mode === 'withdraw' ? 'PEW to withdraw' : 'PEW to receive' }}</span>
          <input v-model.number="amount" type="number" inputmode="decimal" :min="mode === 'withdraw' ? 10 : 5" step="1" />
        </label>
      </div>
      <p class="hint">
        ≈ {{ fmtMoney(localValue) }} {{ asset }} at 1 USD = {{ unitsPerUsd }} {{ asset }}
        <template v-if="mode === 'deposit'"> · minimum 5 PEW</template>
        <template v-else> · minimum 10 PEW · withdrawable {{ fmt(withdrawable) }} PEW, withdrawal fee comes off first</template>
      </p>
      <button class="btn primary w-full" :disabled="!canSearch || loading" @click="search">{{ loading ? 'Finding sellers…' : 'Find sellers' }}</button>
      <p v-if="error" class="err">{{ error }}</p>

      <ul v-if="searched" class="sellers">
        <li v-if="!matches.length" class="empty">No seller covers {{ amount }} PEW in {{ asset }} right now. Try another amount or currency.</li>
        <li v-for="m in matches" :key="m.listing_id" :class="['seller', { picked: picked?.listing_id === m.listing_id }]">
          <button class="seller-top" @click="pick(m)">
            <img :src="m.avatar_url || '/default-avatar.svg'" alt="" />
            <span class="names">
              <strong>{{ m.seller_name }} <VerifiedBadge v-if="m.is_verified" :type="m.verified_type" :size="14" /></strong>
              <small>@{{ m.username }} · {{ m.method_label }}</small>
            </span>
            <span class="quote">
              <strong>{{ fmtMoney(m.quote_amount) }} {{ asset }}</strong>
              <small>{{ mode === 'withdraw' ? 'you receive' : 'you pay' }}</small>
            </span>
          </button>
          <div class="meta">
            <span>{{ fmtMoney(1 / m.price_per_pew) }} PEW/{{ asset }}</span>
            <span>Margin {{ m.margin_pct }}%</span>
            <span>{{ mode === 'withdraw' ? 'Fee' : 'Platform' }} {{ m.platform_fee_pct }}%</span>
            <span>Limits {{ fmt(m.min_amount) }}–{{ fmt(m.max_amount) }} PEW</span>
          </div>
          <p v-if="m.buyer_notes" class="notes">{{ m.buyer_notes }}</p>
          <p v-if="m.terms" class="notes">Terms: {{ m.terms }}</p>

          <div v-if="picked?.listing_id === m.listing_id" class="pickbox">
            <template v-if="mode === 'deposit'">
              <p class="sub">After you tap “I'm paying”, {{ fmt(amount) }} PEW is locked for you and you have 45 minutes to pay:</p>
              <dl v-if="details?.method" class="pay">
                <template v-if="details.method.bank_name"><dt>Bank</dt><dd>{{ details.method.bank_name }}</dd></template>
                <template v-if="details.method.account_name"><dt>Name</dt><dd>{{ details.method.account_name }}</dd></template>
                <template v-if="details.method.account_ref"><dt>Account</dt><dd class="mono">{{ details.method.account_ref }}</dd></template>
                <template v-if="details.method.network"><dt>Network</dt><dd>{{ details.method.network }}</dd></template>
                <template v-if="details.method.instructions"><dt>Note</dt><dd>{{ details.method.instructions }}</dd></template>
              </dl>
            </template>
            <template v-else>
              <p class="sub">Where should {{ m.seller_name }} pay you {{ fmtMoney(m.quote_amount) }} {{ asset }}?</p>
              <div class="row2">
                <label class="field"><span>Account name</span><input v-model="payout.name" /></label>
                <label class="field"><span>Account number / wallet</span><input v-model="payout.account" /></label>
              </div>
              <label class="field"><span>Bank or provider</span><input v-model="payout.bank" /></label>
            </template>
            <label class="check"><input v-model="accepted" type="checkbox" class="pick" /> I accept the seller's terms and the escrow rules</label>
            <button class="btn primary w-full" :disabled="!accepted || busy" @click="start(m)">
              {{ busy ? 'Locking escrow…' : mode === 'deposit' ? "I'm paying" : `Lock ${fmt(amount)} PEW and withdraw` }}
            </button>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="activeTrade" class="card trade">
      <div class="trade-head">
        <button class="back" @click="closeTrade">←</button>
        <div class="min-w-0">
          <h2>{{ activeTrade.kind === 'withdraw' ? 'Withdrawal' : 'Deposit' }} · {{ fmt(activeTrade.amount) }} PEW</h2>
          <p>{{ fmtMoney(activeTrade.source_amount) }} {{ activeTrade.asset_code }} · {{ roleLabel }}</p>
        </div>
        <span :class="['pill', activeTrade.status]">{{ statusLabel }}</span>
      </div>

      <ol class="steps">
        <li :class="{ done: true }">PEW locked in escrow</li>
        <li :class="{ done: !!activeTrade.paid_declared_at }">{{ payerName }} marked the payment as sent</li>
        <li :class="{ done: !!activeTrade.seller_confirmed_at }">{{ holderName }} confirmed the money arrived</li>
        <li :class="{ done: activeTrade.status === 'released' }">PEW released</li>
      </ol>

      <p v-if="activeTrade.status === 'funded'" class="timer" :class="{ late: remaining <= 0 }">
        {{ remaining > 0 ? `Payment window: ${mmss(remaining)} left` : 'The 45-minute window has passed' }}
      </p>

      <dl v-if="iAmPayer && activeTrade.kind === 'deposit' && tradeMethod" class="pay">
        <template v-if="tradeMethod.bank_name"><dt>Bank</dt><dd>{{ tradeMethod.bank_name }}</dd></template>
        <template v-if="tradeMethod.account_name"><dt>Name</dt><dd>{{ tradeMethod.account_name }}</dd></template>
        <template v-if="tradeMethod.account_ref"><dt>Account</dt><dd class="mono">{{ tradeMethod.account_ref }}</dd></template>
        <template v-if="tradeMethod.network"><dt>Network</dt><dd>{{ tradeMethod.network }}</dd></template>
        <template v-if="tradeMethod.instructions"><dt>Note</dt><dd>{{ tradeMethod.instructions }}</dd></template>
      </dl>
      <dl v-if="iAmPayer && activeTrade.kind === 'withdraw' && activeTrade.payout_details" class="pay">
        <dt>Pay to</dt><dd>{{ activeTrade.payout_details.name }}</dd>
        <dt>Account</dt><dd class="mono">{{ activeTrade.payout_details.account }}</dd>
        <template v-if="activeTrade.payout_details.bank"><dt>Bank</dt><dd>{{ activeTrade.payout_details.bank }}</dd></template>
      </dl>

      <div v-if="['funded', 'disputed'].includes(activeTrade.status)" class="actions">
        <button v-if="iAmPayer && !activeTrade.paid_declared_at" class="btn primary" :disabled="busy" @click="act('paid')">I've paid</button>
        <button v-if="iAmHolder && activeTrade.paid_declared_at && !activeTrade.seller_confirmed_at" class="btn primary" :disabled="busy" @click="act('confirm')">I received the money</button>
        <button v-if="iAmHolder && activeTrade.seller_confirmed_at" class="btn primary" :disabled="busy" @click="releaseTwice">Release {{ fmt(activeTrade.amount) }} PEW</button>
        <button v-if="canCancel" class="btn ghost" :disabled="busy" @click="cancelTrade">Cancel trade</button>
        <button v-if="activeTrade.status === 'funded' && remaining <= 0" class="btn danger" :disabled="busy" @click="openDispute">Open dispute</button>
        <NuxtLink v-if="activeTrade.support_ticket_id" :to="`/support/${activeTrade.support_ticket_id}`" class="btn ghost">Dispute ticket</NuxtLink>
      </div>
      <p v-if="activeTrade.status === 'disputed'" class="hint">Escrow is frozen. Support reviews the evidence and an admin makes the final decision.</p>
      <p v-if="activeTrade.decision_note" class="hint">Decision: {{ activeTrade.decision_note }}</p>
      <p v-if="error" class="err">{{ error }}</p>

      <TradeChat v-if="activeTrade.chat_room_id" :room-id="activeTrade.chat_room_id" />
    </section>

    <section v-if="mode === 'trades' && !activeTrade" class="card">
      <ul class="trades">
        <li v-if="!trades.length" class="empty">No P2P trades yet.</li>
        <li v-for="t in trades" :key="t.id">
          <button class="trade-row" @click="openTrade(t.id)">
            <span class="names">
              <strong>{{ t.kind === 'withdraw' ? 'Withdrawal' : 'Deposit' }} · {{ fmt(t.amount) }} PEW</strong>
              <small>{{ fmtMoney(t.source_amount) }} {{ t.asset_code }} · {{ new Date(t.created_at).toLocaleString() }}</small>
            </span>
            <span :class="['pill', t.status]">{{ t.status }}</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import TradeChat from '~/components/trade-chat.vue'

definePageMeta({ middleware: ['auth', 'profile-completion', 'language-check'], layout: 'default' })

interface Asset { code: string, display_name: string, reference_rate: number }
interface Match {
  listing_id: string, seller_name: string, username: string, avatar_url: string | null, is_verified: boolean, verified_type: string | null
  buyer_notes: string | null, terms: string | null, method_label: string, margin_pct: number, platform_fee_pct: number
  min_amount: number, max_amount: number, price_per_pew: number, quote_amount: number
}
interface Method { kind?: string, account_name?: string | null, account_ref?: string | null, bank_name?: string | null, network?: string | null, instructions?: string | null }
interface Trade {
  id: string, kind: 'deposit' | 'withdraw', status: string, amount: number, source_amount: number, asset_code: string, seller_id: string, buyer_id: string
  paid_declared_at: string | null, seller_confirmed_at: string | null, expires_at: string, created_at: string, chat_room_id: string | null
  support_ticket_id: string | null, decision_note: string | null, payout_details: { name: string, account: string, bank?: string } | null
  seller_payment_methods?: Method | null
}

const route = useRoute()
const router = useRouter()
const user = useSupabaseUser()
const mode = ref<'deposit' | 'withdraw' | 'trades'>(route.query.mode === 'withdraw' ? 'withdraw' : route.query.mode === 'trades' ? 'trades' : 'deposit')
const assets = ref<Asset[]>([])
const asset = ref('USD')
const amount = ref<number>(10)
const matches = ref<Match[]>([])
const searched = ref(false)
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const picked = ref<Match | null>(null)
const details = ref<{ method: Method } | null>(null)
const accepted = ref(false)
const payout = reactive({ name: '', account: '', bank: '' })
const trades = ref<Trade[]>([])
const activeTrade = ref<Trade | null>(null)
const withdrawable = ref(0)
const isSeller = ref(false)
const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | null = null
let poller: ReturnType<typeof setInterval> | null = null

const rateOf = computed(() => Number(assets.value.find(a => a.code === asset.value)?.reference_rate || 1))
const unitsPerUsd = computed(() => fmtMoney(1 / rateOf.value))
const localValue = computed(() => (Number(amount.value) || 0) / rateOf.value)
const canSearch = computed(() => !!asset.value && Number(amount.value) >= (mode.value === 'withdraw' ? 10 : 5))
const openCount = computed(() => trades.value.filter(t => ['funded', 'disputed'].includes(t.status)).length)
const me = computed(() => user.value?.id ?? '')
const iAmHolder = computed(() => activeTrade.value?.seller_id === me.value)
const iAmPayer = computed(() => activeTrade.value?.buyer_id === me.value)
const tradeMethod = computed(() => activeTrade.value?.seller_payment_methods ?? null)
const remaining = computed(() => activeTrade.value ? Math.floor((new Date(activeTrade.value.expires_at).getTime() - now.value) / 1000) : 0)
const payerName = computed(() => activeTrade.value?.kind === 'withdraw' ? 'The seller' : (iAmPayer.value ? 'You' : 'The buyer'))
const holderName = computed(() => iAmHolder.value ? 'You' : activeTrade.value?.kind === 'withdraw' ? 'The withdrawer' : 'The seller')
const roleLabel = computed(() => iAmPayer.value ? 'You send the money' : 'You confirm and release')
const statusLabel = computed(() => ({ funded: 'In escrow', disputed: 'Disputed', released: 'Completed', cancelled: 'Cancelled' } as Record<string, string>)[activeTrade.value?.status ?? ''] ?? activeTrade.value?.status)
const canCancel = computed(() => {
  const t = activeTrade.value
  if (!t || t.status !== 'funded') return false
  if (iAmPayer.value) return true
  return iAmHolder.value && !t.paid_declared_at && remaining.value <= 0
})

const fmt = (n: number | string | null | undefined) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })
const fmtMoney = (n: number | string | null | undefined) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const msg = (e: unknown) => (e as { data?: { statusMessage?: string }, statusMessage?: string })?.data?.statusMessage || (e as { statusMessage?: string })?.statusMessage || 'Something went wrong'

function setMode(m: 'deposit' | 'withdraw' | 'trades') {
  mode.value = m
  activeTrade.value = null
  matches.value = []
  searched.value = false
  picked.value = null
  error.value = ''
  router.replace({ query: { mode: m } })
  if (m === 'trades') loadTrades()
}

async function search() {
  loading.value = true; error.value = ''; picked.value = null
  try {
    const res = await $fetch<{ matches: Match[] }>('/api/p2p/match', { query: { asset: asset.value, amount: amount.value, side: mode.value === 'withdraw' ? 'buy' : 'sell' } })
    matches.value = res.matches
    searched.value = true
  } catch (e) { error.value = msg(e) } finally { loading.value = false }
}

async function pick(m: Match) {
  picked.value = picked.value?.listing_id === m.listing_id ? null : m
  accepted.value = false
  details.value = null
  if (picked.value && mode.value === 'deposit') {
    try { details.value = await $fetch(`/api/p2p/listings/${m.listing_id}/details`) } catch (e) { error.value = msg(e) }
  }
}

async function start(m: Match) {
  busy.value = true; error.value = ''
  try {
    const res = mode.value === 'deposit'
      ? await $fetch<{ trade: Trade }>('/api/p2p/trades', { method: 'POST', body: { listingId: m.listing_id, amount: amount.value, acceptedTerms: true } })
      : await $fetch<{ trade: Trade }>('/api/p2p/withdraw', { method: 'POST', body: { listingId: m.listing_id, amount: amount.value, payout } })
    await openTrade(res.trade.id)
  } catch (e) { error.value = msg(e) } finally { busy.value = false }
}

async function loadTrades() {
  try { trades.value = (await $fetch<{ trades: Trade[] }>('/api/p2p/trades')).trades } catch { trades.value = [] }
}

async function openTrade(id: string) {
  try {
    activeTrade.value = (await $fetch<{ trade: Trade }>(`/api/p2p/trades/${id}`)).trade
    router.replace({ query: { ...route.query, trade: id } })
  } catch (e) { error.value = msg(e) }
}

function closeTrade() {
  activeTrade.value = null
  router.replace({ query: { mode: mode.value } })
  loadTrades()
}

async function act(action: 'paid' | 'confirm' | 'release' | 'cancel' | 'dispute', reason?: string) {
  if (!activeTrade.value) return
  busy.value = true; error.value = ''
  try {
    const res = await $fetch<{ ticketId?: string }>(`/api/p2p/trades/${activeTrade.value.id}/${action}`, { method: 'POST', body: reason ? { reason } : {} })
    await openTrade(activeTrade.value.id)
    if (action === 'dispute' && activeTrade.value?.support_ticket_id) await navigateTo(`/support/${activeTrade.value.support_ticket_id}`)
    return res
  } catch (e) { error.value = msg(e) } finally { busy.value = false }
}

function releaseTwice() {
  if (!activeTrade.value) return
  if (!confirm(`Release ${fmt(activeTrade.value.amount)} PEW? Only do this if the money is in your account. This cannot be undone.`)) return
  act('release')
}

function cancelTrade() {
  if (confirm('Cancel this trade? Escrowed PEW goes back to the holder.')) act('cancel', 'Cancelled by user')
}

function openDispute() {
  const reason = prompt('What went wrong? Support will review the trade chat and your evidence.')
  if (reason && reason.trim()) act('dispute', reason.trim())
}

onMounted(async () => {
  ticker = setInterval(() => { now.value = Date.now() }, 1000)
  poller = setInterval(() => { if (activeTrade.value && ['funded', 'disputed'].includes(activeTrade.value.status)) openTrade(activeTrade.value.id) }, 10000)
  const [a, s, p] = await Promise.allSettled([
    $fetch<{ assets: Asset[] }>('/api/p2p/assets'),
    $fetch<{ withdrawable_pew: number }>('/api/wallet/summary'),
    $fetch<{ isSeller: boolean }>('/api/p2p/seller/profile')
  ])
  if (a.status === 'fulfilled') {
    assets.value = a.value.assets
    if (!assets.value.some(x => x.code === asset.value)) asset.value = assets.value[0]?.code ?? ''
  }
  if (s.status === 'fulfilled') withdrawable.value = Number(s.value.withdrawable_pew ?? 0)
  if (p.status === 'fulfilled') isSeller.value = p.value.isSeller
  await loadTrades()
  if (typeof route.query.trade === 'string') await openTrade(route.query.trade)
})
onBeforeUnmount(() => { if (ticker) clearInterval(ticker); if (poller) clearInterval(poller) })
</script>

<style scoped>
.p2p { max-width: 720px; margin: 0 auto; padding: 8px 10px 80px; color: #e2e8f0; display: flex; flex-direction: column; gap: 8px; }
.p2p-head { display: flex; align-items: center; gap: 10px; }
.p2p-head h1 { font-size: 18px; font-weight: 700; margin: 0; }
.p2p-head p { font-size: 12px; color: #94a3b8; margin: 0; }
.back { flex-shrink: 0; width: 32px; height: 32px; display: grid; place-content: center; border-radius: 999px; background: #1e293b; color: #e2e8f0; border: 0; }
.seller-link { margin-left: auto; flex-shrink: 0; font-size: 12px; padding: 6px 10px; border-radius: 999px; background: #312e81; color: #c7d2fe; white-space: nowrap; }
.min-w-0 { min-width: 0; flex: 1; }
.tabs { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
.tabs button { flex-shrink: 0; padding: 6px 14px; border-radius: 999px; background: #1e293b; color: #cbd5e1; font-size: 13px; border: 0; }
.tabs button.on { background: #4f46e5; color: #fff; }
.card { background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.field span { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; }
.field input, .field select { width: 100%; min-width: 0; background: #020617; border: 1px solid #334155; border-radius: 10px; padding: 9px 10px; color: #f8fafc; font-size: 16px; }
.hint { font-size: 12px; color: #94a3b8; margin: 0; }
.err { font-size: 13px; color: #fca5a5; margin: 0; }
.btn { padding: 9px 14px; border-radius: 10px; font-size: 14px; font-weight: 600; border: 0; text-align: center; }
.btn:disabled { opacity: .5; }
.btn.primary { background: #4f46e5; color: #fff; }
.btn.ghost { background: #1e293b; color: #e2e8f0; }
.btn.danger { background: #7f1d1d; color: #fecaca; }
.w-full { width: 100%; }
.sellers, .trades { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.empty { font-size: 13px; color: #94a3b8; padding: 10px 0; text-align: center; }
.seller { border: 1px solid #1e293b; border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
.seller.picked { border-color: #6366f1; }
.seller-top, .trade-row { display: flex; align-items: center; gap: 10px; width: 100%; background: none; border: 0; color: inherit; text-align: left; padding: 0; }
.seller-top img { flex-shrink: 0; width: 38px; height: 38px; border-radius: 999px; object-fit: cover; }
.names { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.names strong, .names small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.names strong { font-size: 14px; display: flex; align-items: center; gap: 4px; }
.names small { font-size: 12px; color: #94a3b8; }
.quote { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; }
.quote strong { font-size: 14px; }
.quote small { font-size: 11px; color: #94a3b8; }
.meta { display: flex; flex-wrap: wrap; gap: 4px; }
.meta span { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #1e293b; color: #cbd5e1; }
.notes { font-size: 12px; color: #cbd5e1; margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.pickbox { border-top: 1px solid #1e293b; padding-top: 8px; display: flex; flex-direction: column; gap: 8px; }
.sub { font-size: 13px; margin: 0; }
.pay { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; margin: 0; background: #020617; border-radius: 10px; padding: 10px; font-size: 13px; }
.pay dt { color: #94a3b8; }
.pay dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.mono { font-family: ui-monospace, monospace; }
.check { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.pick { appearance: none; -webkit-appearance: none; flex-shrink: 0; width: 20px; height: 20px; border-radius: 6px; border: 2px solid #475569; margin: 0; }
.pick:checked { background: #4f46e5; border-color: #4f46e5; }
.trade-head { display: flex; align-items: center; gap: 10px; }
.trade-head h2 { font-size: 15px; margin: 0; }
.trade-head p { font-size: 12px; color: #94a3b8; margin: 0; }
.pill { flex-shrink: 0; font-size: 11px; padding: 3px 9px; border-radius: 999px; background: #1e293b; text-transform: capitalize; }
.pill.funded { background: #1e3a8a; color: #bfdbfe; }
.pill.disputed { background: #7f1d1d; color: #fecaca; }
.pill.released { background: #14532d; color: #bbf7d0; }
.steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #64748b; }
.steps li::before { content: '○ '; }
.steps li.done { color: #e2e8f0; }
.steps li.done::before { content: '● '; color: #22c55e; }
.timer { font-size: 13px; font-weight: 600; color: #fbbf24; margin: 0; }
.timer.late { color: #f87171; }
.actions { display: flex; flex-wrap: wrap; gap: 6px; }
.actions .btn { flex: 1 1 140px; }
@media (max-width: 420px) { .row2 { grid-template-columns: 1fr; } }
</style>
