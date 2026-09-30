<!-- ============================================================================
     FILE: /pages/wallet.vue
     closed looped Capital, Wallet Management & pewgift 
     ============================================================================ -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import PewgiftSummary from '~/components/financial/gifts/pewgift-summary.vue'
import PewgiftHistory from '~/components/financial/gifts/pewgift-history.vue'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

const supabase = useSupabaseClient()

// Active Panel Tabs
const tabs = ['Transactions', 'Pewgift', 'Payment Methods', 'Withdrawals', 'Referrals']
const route = useRoute()
const requestedTab = typeof route.query.tab === 'string' ? route.query.tab : ''
const activeTab = ref(tabs.includes(requestedTab) ? requestedTab : 'Transactions')

const userStore = useUserStore()
const pewgiftUserId = computed(() => userStore.user?.id ?? '')

// Core Loading & UI Structural States
const isLoading = ref(true)
const showWithdrawModal = ref(false)
const showTransferModal = ref(false)
const showAddPaymentModal = ref(false)

// Data Storage Repositories
const transactions = ref<any[]>([])
const paymentMethods = ref<any[]>([])
const withdrawals = ref<any[]>([])
const userBalance = ref<number>(0.00) 
const referralStats = ref({
  total_referrals: 0,
  referral_earnings: 0.00,
  referral_code: 'SOCIALVERSE024'
})

// Transfer Form Payload Aggregates
const transferAmount = ref<number | null>(null)
const targetRecipient = ref('')
const paymentNotes = ref('')
const isSubmitting = ref(false)
const depositStatusNotice = ref('')

// Live Reactive Performance Metrics
const totalBalance = computed(() => userBalance.value)

const totalIncome = computed(() => {
  return transactions.value
    .filter(tx => tx.type === 'credit')
    .reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0)
})

const totalSpent = computed(() => {
  return transactions.value
    .filter(tx => tx.type === 'debit')
    .reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0)
})

const pendingAmount = computed(() => {
  return withdrawals.value
    .filter(w => w.status === 'pending')
    .reduce((acc, w) => acc + (Number(w.amount) || 0), 0)
})

// Core Ledger Multi-Fetch Initialization 
const fetchWalletInfrastructureData = async () => {
  try {
    isLoading.value = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle()
      
    if (!walletError && wallet) {
      userBalance.value = Number(wallet.balance) || 0.00
    }
    
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    transactions.value = txData || []

    const { data: payData } = await supabase
      .from('payment_methods')
      .select('*')
      .order('created_at', { ascending: false })
    paymentMethods.value = payData || []

    const { data: withdrawData } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false })
    withdrawals.value = withdrawData || []

    const { data: refData } = await supabase
      .from('referrals')
      .select('total_referrals, referral_earnings, referral_code')
      .maybeSingle()
      
    if (refData) {
      referralStats.value = {
        total_referrals: refData.total_referrals || 0,
        referral_earnings: Number(refData.referral_earnings) || 0,
        referral_code: refData.referral_code || 'SOCIALVERSE024'
      }
    }

  } catch (err) {
    console.error('❌ [Wallet Engine] Failed to compile structural accounting logs:', err)
  } finally {
    isLoading.value = false
  }
}

// Transaction Pipeline Submissions: Cross-Node Internal Transfers
const executeDirectNodeTransfer = async () => {
  if (!transferAmount.value || transferAmount.value <= 0 || !targetRecipient.value) return
  if (transferAmount.value > totalBalance.value) {
    alert('Execution halted: Insufficient capital pool remaining in this node link.')
    return
  }

  try {
    isSubmitting.value = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const updatedSenderBalance = userBalance.value - transferAmount.value

    const { data: receiverWallet, error: rxFetchError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', targetRecipient.value)
      .maybeSingle()

    if (rxFetchError || !receiverWallet) {
      alert('Execution aborted: Destination node reference hash identifier is invalid.')
      return
    }

    const updatedReceiverBalance = (Number(receiverWallet.balance) || 0) + transferAmount.value

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: transferAmount.value,
        type: 'debit',
        description: paymentNotes.value || `Transfer to tracking handle: ${targetRecipient.value.slice(0, 8)}...`,
        icon: '🔄',
        metadata: { recipient_node: targetRecipient.value }
      })
    if (txError) throw txError

    const { error: rxTxError } = await supabase
      .from('transactions')
      .insert({
        user_id: targetRecipient.value,
        amount: transferAmount.value,
        type: 'credit',
        description: `Internal cross-node inbound settlement receipt`,
        icon: '📥',
        metadata: { sender_node: user.id }
      })
    if (rxTxError) throw rxTxError

    const { error: senderUpdateError } = await supabase
      .from('wallets')
      .update({ balance: updatedSenderBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
    if (senderUpdateError) throw senderUpdateError

    const { error: receiverUpdateError } = await supabase
      .from('wallets')
      .update({ balance: updatedReceiverBalance, updated_at: new Date().toISOString() })
      .eq('user_id', targetRecipient.value)
    if (receiverUpdateError) throw receiverUpdateError
    
    transferAmount.value = null
    targetRecipient.value = ''
    paymentNotes.value = ''
    showTransferModal.value = false
    await fetchWalletInfrastructureData()
    alert('🔄 Multi-tier node settlement completed!')
  } catch (err) {
    console.error('❌ Direct network transfer mutation failure:', err)
    alert('Failed to execute internal ledger modification safely.')
  } finally {
    isSubmitting.value = false
  }
}

const removePaymentMethodItem = async (id: string) => {
  if (!confirm('Drop this verification asset from your billing profile?')) return
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id)

  if (!error) {
    paymentMethods.value = paymentMethods.value.filter(m => m.id !== id)
  }
}

const copyReferralLinkCode = () => {
  navigator.clipboard.writeText(referralStats.value.referral_code)
  alert('Crypto node referral identifier copied to memory pipeline.')
}

const formatDateLabel = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const reviewReturnedDeposit = async (depositId: string) => {
  try {
    const response = await $fetch<{
      data: { status: string, credited_pewgift: number, source_currency: string }
    }>(`/api/wallet/deposit/${depositId}`)

    depositStatusNotice.value = response.data.status === 'SETTLED'
      ? `Deposit settled — ${Number(response.data.credited_pewgift).toFixed(2)} PEW credited.`
      : 'Payment received by the provider. Your balance updates as soon as it confirms.'
    await fetchWalletInfrastructureData()
  } catch {
    depositStatusNotice.value = ''
  }
}

onMounted(() => {
  fetchWalletInfrastructureData()
  if (typeof route.query.deposit === 'string') reviewReturnedDeposit(route.query.deposit)
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
    <div class="max-w-6xl mx-auto space-y-8">
      
      <div class="border-b border-slate-800 pb-6">
        <h1 class="text-2xl font-black text-white tracking-tight">💼 Decentralized Capital & Wallet Management</h1>
        <p class="text-xs text-slate-400 mt-1">Audit active row ledgers, check inbound revenue pools, and command multi-tier settlement gateways.</p>
      </div>

      <p v-if="depositStatusNotice" class="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
        {{ depositStatusNotice }}
      </p>

      <ClientOnly>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Fluid Balance</span>
            <h3 class="text-xl font-black text-white mt-1">${{ totalBalance.toFixed(2) }}</h3>
          </div>
          <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Income Accumulation</span>
            <h3 class="text-xl font-black text-emerald-400 mt-1">${{ totalIncome.toFixed(2) }}</h3>
          </div>
          <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outbound Expense Sheet</span>
            <h3 class="text-xl font-black text-rose-500 mt-1">${{ totalSpent.toFixed(2) }}</h3>
          </div>
          <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Disbursals</span>
            <h3 class="text-xl font-black text-amber-400 mt-1">${{ pendingAmount.toFixed(2) }}</h3>
          </div>
        </div>

        <!-- Interactive Direct Dispatch Controls -->
        <div class="flex flex-wrap gap-3">
          <NuxtLink to="/add-funds" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow">
            ➕ Add Funds
          </NuxtLink>
          <button @click="showWithdrawModal = true" class="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg transition-colors">
            ➖ Withdraw Assets
          </button>
          <button @click="showTransferModal = true" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow">
            🔄 Node Transfer
          </button>
        </div>

        <!-- FIXED TAB BAR: Responsive gaps and text sizing to prevent clustering -->
        <div class="flex gap-2 sm:gap-6 border-b border-slate-800 overflow-x-auto scrollbar-none">
          <button 
            v-for="tab in tabs" 
            :key="tab"
            @click="activeTab = tab"
            :class="[
              'px-2 py-3 text-[11px] sm:text-xs font-bold tracking-wide border-b-2 whitespace-nowrap transition-colors', 
              activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            ]"
          >
            {{ tab }}
          </button>
        </div>

        <div v-if="isLoading" class="space-y-4">
          <div v-for="n in 3" :key="n" class="h-16 bg-slate-900 rounded-xl border border-slate-800 animate-pulse"></div>
        </div>

        <div v-else class="space-y-6 pt-4">
          
          <div v-if="activeTab === 'Transactions'" class="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 class="text-sm font-black text-slate-200 uppercase tracking-wider">📋 Ledger Log Register</h3>
            <div v-if="transactions.length > 0" class="divide-y divide-slate-800/60">
              <div v-for="tx in transactions" :key="tx.id" class="py-3.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                <div class="flex items-center space-x-3">
                  <div class="text-base bg-slate-950 p-2 rounded-lg border border-slate-800/60">{{ tx.icon || '🪙' }}</div>
                  <div>
                    <p class="font-bold text-slate-200">{{ tx.description }}</p>
                    <span class="text-[10px] text-slate-500 block font-mono mt-0.5">{{ formatDateLabel(tx.created_at || tx.date) }}</span>
                  </div>
                </div>
                <span :class="['font-mono font-bold text-sm', tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-500']">
                  {{ tx.type === 'credit' ? '+' : '-' }}${{ (Number(tx.amount) || 0).toFixed(2) }}
                </span>
              </div>
            </div>
            <div v-else class="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No dynamic accounting row items logged under this workspace anchor.
            </div>
          </div>

          <div v-if="activeTab === 'Pewgift'" class="space-y-4">
            <PewgiftSummary />
            <PewgiftHistory v-if="pewgiftUserId" :user-id="pewgiftUserId" />
          </div>

          <div v-if="activeTab === 'Payment Methods'" class="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 class="text-sm font-black text-slate-200 uppercase tracking-wider">💳 Active Settlement Links</h3>
              <button @click="showAddPaymentModal = true" class="text-[11px] text-indigo-400 font-bold hover:underline">
                Add Method
              </button>
            </div>
            <div v-if="paymentMethods.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div v-for="method in paymentMethods" :key="method.id" class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="text-lg">{{ method.icon || '💳' }}</div>
                  <div>
                    <p class="text-xs font-bold text-white">{{ method.name }}</p>
                    <p class="text-[10px] text-slate-400 font-mono mt-0.5">{{ method.info }}</p>
                  </div>
                </div>
                <button @click="removePaymentMethodItem(method.id)" class="text-[10px] font-bold text-rose-400 hover:bg-rose-950/20 px-2 py-1 rounded border border-rose-950/30 transition-colors">
                  Remove
                </button>
              </div>
            </div>
            <div v-else class="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No authenticated merchant methods tied to this profile layout stack.
            </div>
          </div>

          <div v-if="activeTab === 'Withdrawals'" class="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 class="text-sm font-black text-slate-200 uppercase tracking-wider">🏦 Asset Disbursal Processing Records</h3>
            <div v-if="withdrawals.length > 0" class="divide-y divide-slate-800/60">
              <div v-for="withdrawal in withdrawals" :key="withdrawal.id" class="py-3.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="font-bold text-white text-sm">${{ (Number(withdrawal.amount) || 0).toFixed(2) }}</span>
                    <span :class="['px-1.5 py-0.5 text-[8px] font-black uppercase rounded tracking-wide border', withdrawal.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20']">
                      {{ withdrawal.status }}
                    </span>
                  </div>
                  <span class="text-[10px] text-slate-500 font-mono block mt-0.5">{{ formatDateLabel(withdrawal.created_at || withdrawal.date) }}</span>
                </div>
                <span class="text-slate-400 font-medium font-mono text-[11px]">{{ withdrawal.method || 'Direct Bank Settlement' }}</span>
              </div>
            </div>
            <div v-else class="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No historic or executing payout sequences logged.
            </div>
          </div>

          <div v-if="activeTab === 'Referrals'" class="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-6">
            <h3 class="text-sm font-black text-slate-200 uppercase tracking-wider">🎁 Node Network Affiliate Program</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Referred Nodes Connected</span>
                <p class="text-2xl font-black text-white mt-1">{{ referralStats.total_referrals }}</p>
              </div>
              <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Accumulated Dividends</span>
                <p class="text-2xl font-black text-emerald-400 mt-1">${{ referralStats.referral_earnings.toFixed(2) }}</p>
              </div>
            </div>

            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label class="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Your Cryptographic Affiliate Tracking Code</label>
              <div class="flex gap-2">
                <input type="text" :value="referralStats.referral_code" readonly class="flex-1 bg-slate-900 text-xs font-mono font-bold text-white border border-slate-800 rounded-lg px-3 py-2 focus:outline-none" />
                <button @click="copyReferralLinkCode" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                  📋 Copy Key
                </button>
              </div>
            </div>
          </div>

        </div>
      </ClientOnly>
    </div>

    <!-- SAFEKEEPING MODAL GATEWAY: OUTBOUND NODE TRANSFERS -->
    <div v-if="showTransferModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-xl shadow-2xl space-y-4">
        <div>
          <h3 class="text-base font-black text-white">Initiate Instant Secure Disbursal</h3>
          <p class="text-xs text-slate-400">Move cross-node capital pools instantly across verification chains.</p>
        </div>

        <form @submit.prevent="executeDirectNodeTransfer" class="space-y-4">
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Target Receiver Hash ID</label>
            <input v-model="targetRecipient" type="text" required placeholder="e.g. 8f24bca8-22d1-44bb-ba91..." class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-3 py-2.5 focus:outline-none font-mono" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Amount ($)</label>
            <input v-model.number="transferAmount" type="number" step="0.01" required placeholder="0.00" class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-3 py-2.5 focus:outline-none font-mono" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Internal Purpose Note</label>
            <input v-model="paymentNotes" type="text" placeholder="Reference notes or contract logs" class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-3 py-2.5 focus:outline-none" />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" @click="showTransferModal = false" class="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
              Close
            </button>
            <button type="submit" :disabled="isSubmitting" class="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors">
              {{ isSubmitting ? 'Validating Link...' : 'Execute Transaction' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
