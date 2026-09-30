<!-- ============================================================================
     FILE: /pages/add-funds.vue
     Dedicated Funding Page for Paystack, Flutterwave, NowPayments, and P2P
     ============================================================================ -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

const router = useRouter()
const userStore = useUserStore()

const amount = ref<number | null>(null)
const selectedGateway = ref('paystack')
const isProcessing = ref(false)
const errorMessage = ref('')

const paymentGateways = [
  { id: 'paystack', name: 'Paystack', description: 'Cards, Bank Transfers, USSD', icon: '💳' },
  { id: 'flutterwave', name: 'Flutterwave', description: 'Cards, Mobile Money, Bank Transfer', icon: '🌊' },
  { id: 'nowpayments', name: 'NowPayments', description: 'Crypto (BTC, ETH, USDT, SOL)', icon: '🪙' },
  { id: 'p2p', name: 'P2P Network', description: 'Direct Peer-to-Peer Escrow', icon: '🤝' }
]

const processFunding = async () => {
  errorMessage.value = ''

  if (selectedGateway.value === 'p2p') {
    router.push('/p2p')
    return
  }

  if (!amount.value || amount.value <= 0) {
    errorMessage.value = 'Please enter a valid amount.'
    return
  }

  isProcessing.value = true

  try {
    const response = await $fetch<{ success: boolean; checkoutUrl: string }>('/api/payment/initialize', {
      method: 'POST',
      body: {
        gateway: selectedGateway.value,
        amount: amount.value,
        currency: 'USD',
        email: userStore.user?.email || 'user@example.com'
      }
    })

    if (response?.checkoutUrl) {
      window.location.href = response.checkoutUrl
    } else {
      throw new Error('No checkout URL returned from payment provider.')
    }
  } catch (error: any) {
    errorMessage.value = error.data?.statusMessage || error.message || 'Failed to initialize payment.'
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
    <div class="max-w-2xl mx-auto space-y-6">
      
      <div class="flex items-center space-x-4 border-b border-slate-800 pb-6">
        <NuxtLink to="/wallet" class="text-slate-400 hover:text-white transition-colors text-xs font-bold">
          ← Back to Wallet
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-black text-white tracking-tight">➕ Add Funds</h1>
          <p class="text-xs text-slate-400 mt-1">Select your preferred payment gateway or P2P network to top up your wallet balance.</p>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
        
        <!-- Payment Options Grid -->
        <div>
          <label class="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Select Gateway</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div 
              v-for="gateway in paymentGateways" 
              :key="gateway.id"
              @click="selectedGateway = gateway.id"
              :class="[
                'cursor-pointer p-4 rounded-xl border transition-all flex items-center space-x-3', 
                selectedGateway === gateway.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              ]"
            >
              <div class="text-2xl">{{ gateway.icon }}</div>
              <div>
                <h4 class="text-sm font-bold text-white">{{ gateway.name }}</h4>
                <p class="text-[10px] text-slate-400">{{ gateway.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Amount Input Field -->
        <div v-if="selectedGateway !== 'p2p'" class="space-y-4">
          <div>
            <label class="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Deposit Amount (USD)</label>
            <input 
              v-model.number="amount" 
              type="number" 
              min="1" 
              placeholder="0.00" 
              class="w-full bg-slate-950 text-sm text-white border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
            />
          </div>
        </div>

        <p v-if="errorMessage" class="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg">
          {{ errorMessage }}
        </p>

        <button 
          @click="processFunding" 
          :disabled="isProcessing"
          class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black text-sm px-4 py-3.5 rounded-lg transition-colors shadow"
        >
          {{ isProcessing ? 'Initializing...' : (selectedGateway === 'p2p' ? 'Continue to P2P Marketplace' : 'Proceed to Payment') }}
        </button>

      </div>
    </div>
  </main>
</template>
