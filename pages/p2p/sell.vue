<template>
  <div class="desk">
    <header class="head">
      <NuxtLink to="/p2p" class="back" aria-label="Back">←</NuxtLink>
      <div class="min-w-0">
        <h1>Seller desk</h1>
        <p v-if="isSeller">{{ configs.length }} / {{ max }} offers · balance {{ fmt(wallet?.balance) }} PEW · in escrow {{ fmt(wallet?.locked_balance) }} PEW</p>
      </div>
    </header>

    <p v-if="loaded && !isSeller" class="card empty">You don't have seller privileges. An admin can grant them from Control → Staff & sellers.</p>

    <template v-if="isSeller">
      <section class="card">
        <h2>Seller profile</h2>
        <label class="field"><span>Display name buyers see</span><input v-model="profile.displayName" maxlength="60" /></label>
        <label class="field"><span>Notes and instructions for buyers</span><textarea v-model="profile.buyerNotes" rows="3" maxlength="1000" /></label>
        <button class="btn primary" :disabled="busy" @click="saveProfile">Save profile</button>
      </section>

      <section class="card">
        <div class="row-between">
          <h2>Offers (currency + payment method)</h2>
          <button class="btn primary sm" :disabled="configs.length >= max" @click="edit(null)">+ New</button>
        </div>
        <ul class="list">
          <li v-if="!configs.length" class="empty">No offers yet. Add one per currency and payment method (up to {{ max }}).</li>
          <li v-for="c in configs" :key="c.id" class="offer">
            <div class="names">
              <strong>{{ c.side === 'buy' ? 'Buys PEW (withdrawals)' : 'Sells PEW (deposits)' }} · {{ c.asset_code }}</strong>
              <small>{{ c.method?.bank_name || c.method?.kind }} · margin {{ c.margin_pct }}% · {{ fmt(c.min_amount) }}–{{ fmt(c.max_amount) }} PEW · available {{ fmt(c.available_pewgift) }}</small>
            </div>
            <span :class="['pill', c.is_active ? 'on' : '']">{{ c.is_active ? 'Live' : 'Paused' }}</span>
            <button class="btn ghost sm" @click="edit(c)">Edit</button>
          </li>
        </ul>
      </section>

      <section v-if="form" class="card">
        <h2>{{ form.id ? 'Edit offer' : 'New offer' }}</h2>
        <div class="seg">
          <button :class="{ on: form.side === 'sell' }" @click="form.side = 'sell'">I sell PEW (deposits)</button>
          <button :class="{ on: form.side === 'buy' }" @click="form.side = 'buy'">I buy PEW (withdrawals)</button>
        </div>
        <div class="row2">
          <label class="field"><span>Currency</span>
            <select v-model="form.assetCode"><option v-for="a in assets" :key="a.code" :value="a.code">{{ a.code }} · {{ a.display_name }}</option></select>
          </label>
          <label class="field"><span>Margin % (max {{ maxMargin }})</span><input v-model.number="form.marginPct" type="number" min="0" :max="maxMargin" step="0.1" /></label>
          <label class="field"><span>Min PEW</span><input v-model.number="form.minAmount" type="number" min="5" /></label>
          <label class="field"><span>Max PEW</span><input v-model.number="form.maxAmount" type="number" min="5" /></label>
          <label class="field"><span>{{ form.side === 'sell' ? 'PEW available to sell' : 'PEW you can buy' }}</span><input v-model.number="form.availablePew" type="number" min="0" /></label>
          <label class="field"><span>Method</span>
            <select v-model="form.method.kind"><option value="BANK">Bank transfer</option><option value="CRYPTO">Crypto</option><option value="CUSTOM">Other (mobile money, etc.)</option></select>
          </label>
        </div>
        <p class="hint">App rate: 1 PEW = 1 USD = {{ unitsPerUsd }} {{ form.assetCode }}. {{ form.side === 'sell' ? 'Buyers pay' : 'You pay out' }} {{ fmtMoney(previewPerPew) }} {{ form.assetCode }} per PEW.</p>
        <div class="row2">
          <label class="field"><span>{{ form.method.kind === 'CRYPTO' ? 'Wallet name' : 'Account name' }}</span><input v-model="form.method.accountName" /></label>
          <label class="field"><span>{{ form.method.kind === 'CRYPTO' ? 'Wallet address' : 'Account number' }}</span><input v-model="form.method.accountRef" /></label>
          <label class="field"><span>{{ form.method.kind === 'CRYPTO' ? 'Network' : 'Bank / provider' }}</span><input v-if="form.method.kind === 'CRYPTO'" v-model="form.method.network" /><input v-else v-model="form.method.bankName" /></label>
          <label class="field"><span>Payment note</span><input v-model="form.method.instructions" /></label>
        </div>
        <label class="field"><span>Terms</span><textarea v-model="form.terms" rows="2" maxlength="1000" /></label>
        <label class="check"><input v-model="form.isActive" type="checkbox" class="tog" /> Offer is live</label>
        <div class="actions">
          <button class="btn primary" :disabled="busy" @click="saveConfig">Save offer</button>
          <button class="btn ghost" @click="form = null">Close</button>
          <button v-if="form.id" class="btn danger" :disabled="busy" @click="removeConfig">Delete</button>
        </div>
      </section>
      <p v-if="error" class="err">{{ error }}</p>
      <p v-if="notice" class="ok">{{ notice }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'profile-completion', 'language-check'], layout: 'default' })

interface Method { kind: 'BANK' | 'CRYPTO' | 'CUSTOM', account_name?: string | null, account_ref?: string | null, bank_name?: string | null, network?: string | null, instructions?: string | null }
interface Config { id: string, side: 'sell' | 'buy', asset_code: string, margin_pct: number, min_amount: number, max_amount: number, available_pewgift: number, terms: string | null, is_active: boolean, method: Method | null }
interface FormState {
  id?: string, side: 'sell' | 'buy', assetCode: string, marginPct: number, minAmount: number, maxAmount: number, availablePew: number, terms: string, isActive: boolean
  method: { kind: 'BANK' | 'CRYPTO' | 'CUSTOM', accountName: string, accountRef: string, bankName: string, network: string, instructions: string }
}

const isSeller = ref(false)
const loaded = ref(false)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const max = ref(30)
const maxMargin = ref(3)
const configs = ref<Config[]>([])
const wallet = ref<{ balance: number, locked_balance: number } | null>(null)
const assets = ref<{ code: string, display_name: string, reference_rate: number }[]>([])
const profile = reactive({ displayName: '', buyerNotes: '' })
const form = ref<FormState | null>(null)

const fmt = (n: unknown) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })
const fmtMoney = (n: unknown) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const msg = (e: unknown) => (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Something went wrong'
const rate = computed(() => Number(assets.value.find(a => a.code === form.value?.assetCode)?.reference_rate || 1))
const unitsPerUsd = computed(() => fmtMoney(1 / rate.value))
const previewPerPew = computed(() => {
  const m = Number(form.value?.marginPct || 0) / 100
  return (form.value?.side === 'buy' ? 1 - m : 1 + m) / rate.value
})

async function load() {
  const res = await $fetch<{ isSeller: boolean, profile: { display_name?: string, buyer_notes?: string, max_margin_pct?: number } | null, configs: Config[], max: number, wallet: typeof wallet.value }>('/api/p2p/seller/profile')
  isSeller.value = res.isSeller
  configs.value = res.configs
  max.value = res.max
  wallet.value = res.wallet ?? null
  profile.displayName = res.profile?.display_name ?? ''
  profile.buyerNotes = res.profile?.buyer_notes ?? ''
  maxMargin.value = Number(res.profile?.max_margin_pct ?? 3)
  loaded.value = true
}

function edit(c: Config | null) {
  error.value = ''; notice.value = ''
  form.value = c
    ? { id: c.id, side: c.side, assetCode: c.asset_code, marginPct: Number(c.margin_pct), minAmount: Number(c.min_amount), maxAmount: Number(c.max_amount), availablePew: Number(c.available_pewgift), terms: c.terms ?? '', isActive: c.is_active,
        method: { kind: c.method?.kind ?? 'BANK', accountName: c.method?.account_name ?? '', accountRef: c.method?.account_ref ?? '', bankName: c.method?.bank_name ?? '', network: c.method?.network ?? '', instructions: c.method?.instructions ?? '' } }
    : { side: 'sell', assetCode: assets.value[0]?.code ?? 'USD', marginPct: 0, minAmount: 5, maxAmount: 500, availablePew: 100, terms: '', isActive: true,
        method: { kind: 'BANK', accountName: '', accountRef: '', bankName: '', network: '', instructions: '' } }
}

async function saveProfile() {
  busy.value = true; error.value = ''; notice.value = ''
  try { await $fetch('/api/p2p/seller/profile', { method: 'POST', body: profile }); notice.value = 'Profile saved' } catch (e) { error.value = msg(e) } finally { busy.value = false }
}

async function saveConfig() {
  if (!form.value) return
  busy.value = true; error.value = ''; notice.value = ''
  try { await $fetch('/api/p2p/seller/configs', { method: 'POST', body: form.value }); form.value = null; notice.value = 'Offer saved'; await load() } catch (e) { error.value = msg(e) } finally { busy.value = false }
}

async function removeConfig() {
  if (!form.value?.id || !confirm('Delete this offer?')) return
  busy.value = true; error.value = ''
  try { await $fetch('/api/p2p/seller/configs', { method: 'POST', body: { id: form.value.id, remove: true } }); form.value = null; await load() } catch (e) { error.value = msg(e) } finally { busy.value = false }
}

onMounted(async () => {
  const a = await $fetch<{ assets: typeof assets.value }>('/api/p2p/assets').catch(() => ({ assets: [] }))
  assets.value = a.assets
  await load().catch((e) => { error.value = msg(e); loaded.value = true })
})
</script>

<style scoped>
.desk { max-width: 720px; margin: 0 auto; padding: 8px 10px 80px; color: #e2e8f0; display: flex; flex-direction: column; gap: 8px; }
.head { display: flex; align-items: center; gap: 10px; }
.head h1 { font-size: 18px; margin: 0; }
.head p { font-size: 12px; color: #94a3b8; margin: 0; }
.back { flex-shrink: 0; width: 32px; height: 32px; display: grid; place-content: center; border-radius: 999px; background: #1e293b; color: #e2e8f0; }
.min-w-0 { min-width: 0; flex: 1; }
.card { background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.card h2 { font-size: 14px; margin: 0; }
.empty { font-size: 13px; color: #94a3b8; }
.row-between { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.field span { font-size: 11px; color: #94a3b8; }
.field input, .field select, .field textarea { width: 100%; min-width: 0; background: #020617; border: 1px solid #334155; border-radius: 10px; padding: 8px 10px; color: #f8fafc; font-size: 16px; }
.hint { font-size: 12px; color: #94a3b8; margin: 0; }
.err { color: #fca5a5; font-size: 13px; }
.ok { color: #86efac; font-size: 13px; }
.btn { padding: 8px 14px; border-radius: 10px; font-size: 14px; font-weight: 600; border: 0; }
.btn.sm { padding: 5px 10px; font-size: 12px; flex-shrink: 0; }
.btn:disabled { opacity: .5; }
.btn.primary { background: #4f46e5; color: #fff; }
.btn.ghost { background: #1e293b; color: #e2e8f0; }
.btn.danger { background: #7f1d1d; color: #fecaca; }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.offer { display: flex; align-items: center; gap: 8px; border: 1px solid #1e293b; border-radius: 10px; padding: 8px; }
.names { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.names strong, .names small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.names strong { font-size: 13px; }
.names small { font-size: 11px; color: #94a3b8; }
.pill { flex-shrink: 0; font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #334155; }
.pill.on { background: #14532d; color: #bbf7d0; }
.seg { display: flex; gap: 6px; overflow-x: auto; }
.seg button { flex: 1 0 auto; padding: 6px 10px; border-radius: 999px; background: #1e293b; color: #cbd5e1; font-size: 12px; border: 0; }
.seg button.on { background: #4f46e5; color: #fff; }
.check { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.tog { appearance: none; -webkit-appearance: none; flex-shrink: 0; width: 2.25rem; height: 1.25rem; border-radius: 999px; background: #334155; position: relative; margin: 0; }
.tog::after { content: ''; position: absolute; top: 2px; left: 2px; width: 1rem; height: 1rem; border-radius: 999px; background: #fff; transition: transform .15s; }
.tog:checked { background: #6366f1; }
.tog:checked::after { transform: translateX(1rem); }
.actions { display: flex; gap: 6px; flex-wrap: wrap; }
@media (max-width: 420px) { .row2 { grid-template-columns: 1fr; } }
</style>
