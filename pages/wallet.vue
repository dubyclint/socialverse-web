<!-- ============================================================================
     FILE: /pages/wallet.vue
     PEW wallet: balance, withdrawable (earned) balance, incoming/outgoing
     history from the ledger, gift history, and withdrawal requests.
     ============================================================================ -->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

useHead({ title: 'Wallet' })

interface FeeSettings {
  deposit_fee_pct: number
  gift_fee_pct: number
  withdrawal_fee_pct: number
  withdrawal_tax_pct: number
  pew_usd_rate: number
  min_withdrawal_pew: number
}

interface WalletSummary {
  balance: number
  withdrawable_pew: number
  withdrawable_usd: number
  is_locked: boolean
  totals: { added_funds: number, gifts_received: number, other_incoming: number, outgoing: number, fees: number }
  fees: FeeSettings
}

interface HistoryItem {
  id: string
  label: string
  kind: string
  direction: 'in' | 'out'
  amount: number
  state: 'successful' | 'pending' | 'processing' | 'failed'
  counterpart: string | null
  detail: string | null
  created_at: string
}

const TABS = ['History', 'Gifts', 'Withdraw'] as const
type Tab = typeof TABS[number]

const route = useRoute()
const { cashRain } = useCelebrate()

const requestedTab = TABS.find(t => t.toLowerCase() === String(route.query.tab ?? '').toLowerCase())
const activeTab = ref<Tab>(requestedTab ?? 'History')

const summary = ref<WalletSummary | null>(null)
const history = ref<HistoryItem[]>([])
const gifts = ref<HistoryItem[]>([])
const isLoading = ref(true)
const loadError = ref('')
const depositNotice = ref('')

const withdrawForm = reactive({
  method: 'bank' as 'bank' | 'crypto',
  amount: null as number | null,
  bank_name: '',
  account_number: '',
  account_name: '',
  network: '',
  address: '',
  country: ''
})
const withdrawError = ref('')
const withdrawNotice = ref('')
const isWithdrawing = ref(false)

const fmt = (value: number, dp = 2) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })
const formatDate = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const STATE_CLASS: Record<HistoryItem['state'], string> = {
  successful: 'bg-emerald-500/15 text-emerald-400',
  pending: 'bg-amber-500/15 text-amber-400',
  processing: 'bg-sky-500/15 text-sky-400',
  failed: 'bg-red-500/15 text-red-400'
}

const withdrawPreview = computed(() => {
  const fees = summary.value?.fees
  const amount = Number(withdrawForm.amount) || 0
  if (!fees) return { fee: 0, tax: 0, usd: 0 }
  const fee = amount * fees.withdrawal_fee_pct / 100
  const tax = amount * fees.withdrawal_tax_pct / 100
  return { fee, tax, usd: (amount - fee - tax) * fees.pew_usd_rate }
})

const loadWallet = async () => {
  loadError.value = ''
  try {
    const [s, h, g] = await Promise.all([
      $fetch<WalletSummary>('/api/wallet/summary'),
      $fetch<{ items: HistoryItem[] }>('/api/wallet/history'),
      $fetch<{ items: HistoryItem[] }>('/api/wallet/history', { query: { filter: 'gifts' } })
    ])
    summary.value = s
    history.value = h.items
    gifts.value = g.items
  } catch (err) {
    loadError.value = (err as { statusMessage?: string })?.statusMessage || 'Could not load your wallet. Pull to refresh or try again.'
  } finally {
    isLoading.value = false
  }
}

const submitWithdrawal = async () => {
  withdrawError.value = ''
  withdrawNotice.value = ''
  const amount = Number(withdrawForm.amount)
  if (!amount || amount <= 0) {
    withdrawError.value = 'Enter an amount'
    return
  }
  if (summary.value && amount > summary.value.withdrawable_pew) {
    withdrawError.value = 'Amount is more than your withdrawable balance'
    return
  }
  const details = withdrawForm.method === 'bank'
    ? { bank_name: withdrawForm.bank_name, account_number: withdrawForm.account_number, account_name: withdrawForm.account_name, country: withdrawForm.country }
    : { network: withdrawForm.network, address: withdrawForm.address }

  isWithdrawing.value = true
  try {
    await $fetch('/api/wallet/withdraw', { method: 'POST', body: { amount, method: withdrawForm.method, details } })
    withdrawNotice.value = 'Withdrawal sent for admin approval. You can follow its status in History.'
    withdrawForm.amount = null
    await loadWallet()
  } catch (err) {
    withdrawError.value = (err as { statusMessage?: string, data?: { statusMessage?: string } })?.data?.statusMessage
      || (err as { statusMessage?: string })?.statusMessage
      || 'Withdrawal failed'
  } finally {
    isWithdrawing.value = false
  }
}

const reviewReturnedDeposit = async (depositId: string) => {
  try {
    const response = await $fetch<{ data: { status: string, credited_pewgift: number } }>(`/api/wallet/deposit/${depositId}`)
    if (response.data.status === 'SETTLED') {
      cashRain()
      depositNotice.value = `Payment successful — ${fmt(response.data.credited_pewgift)} PEW added to your wallet.`
    } else if (response.data.status === 'FAILED') {
      depositNotice.value = 'The payment failed. No money was taken from your wallet.'
    } else {
      depositNotice.value = 'Payment is processing. Your balance updates as soon as the provider confirms it.'
    }
    await loadWallet()
  } catch {
    depositNotice.value = ''
  }
}

onMounted(() => {
  void useUnreadCounts().markGiftsSeen()
  loadWallet()
  if (typeof route.query.deposit === 'string') reviewReturnedDeposit(route.query.deposit)
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 sm:px-6">
    <div class="max-w-3xl mx-auto space-y-5">
      <header class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="text-xl font-bold">Wallet</h1>
          <p class="text-xs text-slate-400 mt-1">Balance, incoming and outgoing history, gifts and withdrawals</p>
        </div>
        <NuxtLink to="/add-funds" class="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg">
          + Add funds
        </NuxtLink>
      </header>

      <p v-if="depositNotice" class="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
        {{ depositNotice }}
      </p>
      <p v-if="loadError" class="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
        {{ loadError }}
      </p>
      <p v-if="summary?.is_locked" class="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
        Your wallet is locked by an administrator. Sending and withdrawing are paused.
      </p>

      <div v-if="isLoading" class="text-sm text-slate-400 py-10 text-center">Loading wallet…</div>

      <template v-else-if="summary">
        <section class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="bg-gradient-to-br from-indigo-600/30 to-slate-900 border border-indigo-500/30 rounded-xl p-4">
            <span class="text-[11px] text-slate-300 font-semibold uppercase tracking-wide">Total balance</span>
            <p class="text-2xl font-bold mt-1 font-mono">{{ fmt(summary.balance) }} <span class="text-sm text-slate-300">PEW</span></p>
          </div>
          <div class="bg-gradient-to-br from-emerald-600/25 to-slate-900 border border-emerald-500/30 rounded-xl p-4">
            <span class="text-[11px] text-slate-300 font-semibold uppercase tracking-wide">Withdrawable balance</span>
            <p class="text-2xl font-bold mt-1 font-mono">${{ fmt(summary.withdrawable_usd) }}</p>
            <p class="text-[11px] text-slate-400 mt-1">
              From {{ fmt(summary.withdrawable_pew) }} PEW earned, after the {{ summary.fees.withdrawal_fee_pct }}% withdrawal fee<span v-if="summary.fees.withdrawal_tax_pct"> and {{ summary.fees.withdrawal_tax_pct }}% tax</span>
            </p>
          </div>
        </section>

        <section class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <span class="text-[10px] text-slate-400 uppercase tracking-wide">Funds added</span>
            <p class="text-sm font-bold font-mono text-emerald-400">+{{ fmt(summary.totals.added_funds) }}</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <span class="text-[10px] text-slate-400 uppercase tracking-wide">Gifts received</span>
            <p class="text-sm font-bold font-mono text-emerald-400">+{{ fmt(summary.totals.gifts_received) }}</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <span class="text-[10px] text-slate-400 uppercase tracking-wide">Other incoming</span>
            <p class="text-sm font-bold font-mono text-emerald-400">+{{ fmt(summary.totals.other_incoming) }}</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <span class="text-[10px] text-slate-400 uppercase tracking-wide">Outgoing</span>
            <p class="text-sm font-bold font-mono text-rose-400">-{{ fmt(summary.totals.outgoing) }}</p>
          </div>
        </section>
        <p class="text-[11px] text-slate-500">
          Fees paid: {{ fmt(summary.totals.fees) }} PEW · Add funds {{ summary.fees.deposit_fee_pct }}% · Gifts {{ summary.fees.gift_fee_pct }}% · Withdrawal {{ summary.fees.withdrawal_fee_pct }}%.
          Funds added by card, bank or crypto can be spent but not withdrawn; gifts received, P2P and escrow earnings can.
        </p>

        <nav class="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            v-for="tab in TABS"
            :key="tab"
            type="button"
            class="shrink-0 px-4 py-2 rounded-lg text-xs font-bold border transition-colors"
            :class="activeTab === tab ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </nav>

        <section v-if="activeTab === 'History' || activeTab === 'Gifts'" class="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
          <p v-if="!(activeTab === 'Gifts' ? gifts : history).length" class="text-sm text-slate-400 p-6 text-center">
            {{ activeTab === 'Gifts' ? 'No gifts sent or received yet.' : 'No transactions yet.' }}
          </p>
          <div
            v-for="item in (activeTab === 'Gifts' ? gifts : history)"
            :key="item.id"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div
              class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold"
              :class="item.direction === 'in' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'"
            >
              {{ item.direction === 'in' ? '↓' : '↑' }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold truncate">
                {{ item.label }}<span v-if="item.counterpart" class="text-slate-400 font-normal"> · {{ item.direction === 'in' ? 'from' : 'to' }} @{{ item.counterpart }}</span>
              </p>
              <p class="text-[11px] text-slate-500 truncate">
                {{ formatDate(item.created_at) }}<span v-if="item.detail"> · {{ item.detail }}</span>
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-bold font-mono" :class="item.direction === 'in' ? 'text-emerald-400' : 'text-rose-400'">
                {{ item.direction === 'in' ? '+' : '-' }}{{ fmt(item.amount) }}
              </p>
              <span class="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" :class="STATE_CLASS[item.state]">
                {{ item.state }}
              </span>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'Withdraw'" class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h2 class="text-sm font-bold">Request a withdrawal</h2>
            <p class="text-[11px] text-slate-400 mt-1">
              Available: {{ fmt(summary.withdrawable_pew) }} PEW (≈ ${{ fmt(summary.withdrawable_usd) }}). Minimum {{ summary.fees.min_withdrawal_pew }} PEW. An admin reviews every request.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="m in (['bank', 'crypto'] as const)"
              :key="m"
              type="button"
              class="py-2.5 rounded-lg text-xs font-bold border capitalize"
              :class="withdrawForm.method === m ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'"
              @click="withdrawForm.method = m"
            >
              {{ m === 'bank' ? 'Bank account' : 'Crypto wallet' }}
            </button>
          </div>

          <form class="space-y-3" @submit.prevent="submitWithdrawal">
            <template v-if="withdrawForm.method === 'bank'">
              <input v-model.trim="withdrawForm.bank_name" required placeholder="Bank name" class="wallet-input">
              <input v-model.trim="withdrawForm.account_number" required inputmode="numeric" placeholder="Account number / IBAN" class="wallet-input">
              <input v-model.trim="withdrawForm.account_name" required placeholder="Account holder name" class="wallet-input">
              <input v-model.trim="withdrawForm.country" placeholder="Country (optional)" class="wallet-input">
            </template>
            <template v-else>
              <input v-model.trim="withdrawForm.network" required placeholder="Network (e.g. USDT-TRC20, BTC)" class="wallet-input">
              <input v-model.trim="withdrawForm.address" required placeholder="Wallet address" class="wallet-input font-mono">
            </template>
            <input v-model.number="withdrawForm.amount" type="number" min="0" step="0.01" required placeholder="Amount in PEW" class="wallet-input font-mono">

            <div v-if="withdrawForm.amount" class="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1">
              <p>Withdrawal fee ({{ summary.fees.withdrawal_fee_pct }}%): -{{ fmt(withdrawPreview.fee) }} PEW</p>
              <p v-if="summary.fees.withdrawal_tax_pct">Tax ({{ summary.fees.withdrawal_tax_pct }}%): -{{ fmt(withdrawPreview.tax) }} PEW</p>
              <p class="text-slate-200 font-semibold">You receive: ${{ fmt(withdrawPreview.usd) }}</p>
            </div>

            <p v-if="withdrawError" class="text-xs text-red-400">{{ withdrawError }}</p>
            <p v-if="withdrawNotice" class="text-xs text-emerald-400">{{ withdrawNotice }}</p>

            <button
              type="submit"
              :disabled="isWithdrawing || summary.is_locked || summary.withdrawable_pew <= 0"
              class="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-lg"
            >
              {{ isWithdrawing ? 'Sending…' : 'Send for approval' }}
            </button>
          </form>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.wallet-input {
  width: 100%;
  background: #020617;
  border: 1px solid #1e293b;
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  color: #fff;
}
.wallet-input:focus {
  outline: none;
  border-color: #6366f1;
}
</style>
