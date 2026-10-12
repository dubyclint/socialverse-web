<!-- ============================================================================
     FILE: /pages/admin/withdrawals.vue
     Admin review of withdrawal requests and wallet fee settings.
     ============================================================================ -->
<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'route-guard'],
  layout: 'default'
})

useHead({ title: 'Withdrawals & fees' })

interface WithdrawalRow {
  id: string
  username: string | null
  amount: number
  status: 'pending' | 'processing' | 'successful' | 'failed'
  method: 'bank' | 'crypto' | null
  details: Record<string, string>
  fee_pewgift: number
  tax_pewgift: number
  payout_usd: number | null
  admin_note: string | null
  created_at: string
}

interface FeeSettings {
  deposit_fee_pct: number
  gift_fee_pct: number
  withdrawal_fee_pct: number
  withdrawal_tax_pct: number
  pew_usd_rate: number
  min_withdrawal_pew: number
}

const FEE_FIELDS: { key: keyof FeeSettings, label: string }[] = [
  { key: 'deposit_fee_pct', label: 'Add funds processing fee (%)' },
  { key: 'gift_fee_pct', label: 'Gift fee (%)' },
  { key: 'withdrawal_fee_pct', label: 'Withdrawal fee (%)' },
  { key: 'withdrawal_tax_pct', label: 'Withdrawal tax (%)' },
  { key: 'pew_usd_rate', label: 'USD per 1 PEW' },
  { key: 'min_withdrawal_pew', label: 'Minimum withdrawal (PEW)' }
]

const FILTERS = ['open', 'successful', 'failed'] as const
const filter = ref<typeof FILTERS[number]>('open')
const rows = ref<WithdrawalRow[]>([])
const notes = reactive<Record<string, string>>({})
const busyId = ref('')
const error = ref('')
const fees = ref<FeeSettings | null>(null)
const feeNotice = ref('')
const savingFees = ref(false)

const errMsg = (err: unknown, fallback: string) =>
  (err as { data?: { statusMessage?: string } })?.data?.statusMessage
  || (err as { statusMessage?: string })?.statusMessage
  || fallback

const fmt = (n: number | null) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const loadRows = async () => {
  error.value = ''
  try {
    const res = await $fetch<{ items: WithdrawalRow[] }>('/api/admin/withdrawals', { query: { status: filter.value } })
    rows.value = res.items
  } catch (err) {
    error.value = errMsg(err, 'Could not load withdrawals')
  }
}

const loadFees = async () => {
  try {
    fees.value = await $fetch<FeeSettings>('/api/admin/wallet-fees')
  } catch (err) {
    error.value = errMsg(err, 'Could not load fee settings')
  }
}

const resolve = async (row: WithdrawalRow, status: 'processing' | 'successful' | 'failed') => {
  if (status === 'failed' && !confirm(`Reject @${row.username ?? 'user'}'s withdrawal and return ${fmt(row.amount)} PEW?`)) return
  busyId.value = row.id
  error.value = ''
  try {
    await $fetch(`/api/admin/withdrawals/${row.id}`, { method: 'POST', body: { status, note: notes[row.id] || undefined } })
    await loadRows()
  } catch (err) {
    error.value = errMsg(err, 'Update failed')
  } finally {
    busyId.value = ''
  }
}

const saveFees = async () => {
  if (!fees.value) return
  savingFees.value = true
  feeNotice.value = ''
  error.value = ''
  try {
    fees.value = await $fetch<FeeSettings>('/api/admin/wallet-fees', { method: 'PUT', body: fees.value })
    feeNotice.value = 'Saved. New fees apply to every transaction from now on.'
  } catch (err) {
    error.value = errMsg(err, 'Could not save fees')
  } finally {
    savingFees.value = false
  }
}

watch(filter, loadRows)
onMounted(() => {
  loadRows()
  loadFees()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 sm:px-6">
    <div class="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 class="text-xl font-bold">Withdrawals & fees</h1>
        <p class="text-xs text-slate-400 mt-1">Approve or reject withdrawal requests and set wallet fees.</p>
      </header>

      <p v-if="error" class="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{{ error }}</p>

      <section class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-sm font-bold">Withdrawal requests</h2>
          <div class="flex gap-1 overflow-x-auto">
            <button
              v-for="f in FILTERS"
              :key="f"
              type="button"
              class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border capitalize"
              :class="filter === f ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-950 border-slate-800 text-slate-400'"
              @click="filter = f"
            >
              {{ f === 'open' ? 'Pending / processing' : f }}
            </button>
          </div>
        </div>

        <p v-if="!rows.length" class="text-sm text-slate-400 py-6 text-center">No withdrawals here.</p>

        <article v-for="row in rows" :key="row.id" class="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm font-semibold">
              @{{ row.username ?? 'unknown' }} · {{ fmt(row.amount) }} PEW
              <span class="text-slate-400 font-normal">→ pay ${{ fmt(row.payout_usd) }}</span>
            </p>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize bg-slate-800">{{ row.status }}</span>
          </div>
          <p class="text-[11px] text-slate-400">
            {{ new Date(row.created_at).toLocaleString() }} · fee {{ fmt(row.fee_pewgift) }} PEW<span v-if="row.tax_pewgift"> · tax {{ fmt(row.tax_pewgift) }} PEW</span>
          </p>
          <div class="text-[11px] text-slate-300 bg-slate-900 rounded p-2 font-mono break-all">
            <span class="uppercase font-bold text-slate-400">{{ row.method }}</span>
            <span v-for="(v, k) in row.details" :key="k"> · {{ k }}: {{ v }}</span>
          </div>
          <p v-if="row.admin_note" class="text-[11px] text-slate-400">Note: {{ row.admin_note }}</p>
          <template v-if="row.status === 'pending' || row.status === 'processing'">
            <input v-model="notes[row.id]" placeholder="Note to user (optional)" class="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs">
            <div class="flex flex-wrap gap-2">
              <button v-if="row.status === 'pending'" type="button" :disabled="busyId === row.id" class="px-3 py-1.5 rounded text-xs font-bold bg-sky-600 disabled:opacity-50" @click="resolve(row, 'processing')">Mark processing</button>
              <button type="button" :disabled="busyId === row.id" class="px-3 py-1.5 rounded text-xs font-bold bg-emerald-600 disabled:opacity-50" @click="resolve(row, 'successful')">Mark paid</button>
              <button type="button" :disabled="busyId === row.id" class="px-3 py-1.5 rounded text-xs font-bold bg-red-600 disabled:opacity-50" @click="resolve(row, 'failed')">Reject &amp; refund</button>
            </div>
          </template>
        </article>
      </section>

      <section v-if="fees" class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 class="text-sm font-bold">Wallet fees</h2>
        <form class="grid grid-cols-1 sm:grid-cols-2 gap-3" @submit.prevent="saveFees">
          <label v-for="field in FEE_FIELDS" :key="field.key" class="text-[11px] text-slate-400 space-y-1">
            <span>{{ field.label }}</span>
            <input v-model.number="fees[field.key]" type="number" step="any" min="0" class="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-sm text-white font-mono">
          </label>
          <div class="sm:col-span-2 flex items-center gap-3">
            <button type="submit" :disabled="savingFees" class="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 disabled:opacity-50">
              {{ savingFees ? 'Saving…' : 'Save fees' }}
            </button>
            <span v-if="feeNotice" class="text-xs text-emerald-400">{{ feeNotice }}</span>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>
