<!-- ============================================================================
     FILE: /pages/add-funds.vue
     Wallet top-up: admin-configured gateways (Paystack, Flutterwave, NOWPayments)
     open a ledger deposit; the wallet is credited only when the provider settles.
     ============================================================================ -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

useHead({ title: 'Add Funds' })

interface DepositProvider {
  code: string
  display_name: string
  route: string
  fee_percent: number
  fee_flat: number
  min_amount: number
  max_amount: number
  charge_currency: string | null
  fx_rate: number | null
}

interface DepositSettings {
  currency: string
  pewgift_per_unit: number
}

const GATEWAY_META: Record<string, { description: string, icon: string }> = {
  paystack: { description: 'Cards, Bank Transfers, USSD', icon: '💳' },
  flutterwave: { description: 'Cards, Mobile Money, Bank Transfer', icon: '🌊' },
  nowpayments: { description: 'Crypto (BTC, ETH, USDT, SOL)', icon: '🪙' }
}

const { platform, isNative } = useDevicePlatform()

const providers = ref<DepositProvider[]>([])
const settings = ref<DepositSettings>({ currency: 'USD', pewgift_per_unit: 1 })
const webOnlyBlocked = ref(false)
const isLoading = ref(true)
const selectedGateway = ref('')
const amount = ref<number | null>(null)
const isProcessing = ref(false)
const errorMessage = ref('')
const notice = ref('')

const presets = [5, 10, 25, 50, 100]

const activeProvider = computed(() => providers.value.find(p => p.code === selectedGateway.value) ?? null)

const fee = computed(() => {
  const provider = activeProvider.value
  const value = Number(amount.value || 0)
  if (!provider || value <= 0) return 0
  return Number(((value * Number(provider.fee_percent || 0)) / 100 + Number(provider.fee_flat || 0)).toFixed(2))
})
const total = computed(() => Number((Number(amount.value || 0) + fee.value).toFixed(2)))
const credited = computed(() => Number(amount.value || 0) * Number(settings.value.pewgift_per_unit || 1))
const converted = computed(() => {
  const provider = activeProvider.value
  if (!provider?.charge_currency || provider.charge_currency === settings.value.currency || !provider.fx_rate) return null
  return { currency: provider.charge_currency, amount: Number((total.value * provider.fx_rate).toFixed(2)) }
})

const loadProviders = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await $fetch<{
      data: { providers: DepositProvider[], settings: DepositSettings, webOnlyBlocked: boolean }
    }>('/api/wallet/deposit/providers', { query: { platform: platform.value } })
    providers.value = response.data.providers
    settings.value = response.data.settings
    webOnlyBlocked.value = response.data.webOnlyBlocked
    selectedGateway.value = response.data.providers[0]?.code ?? 'p2p'
  } catch (error: unknown) {
    errorMessage.value = (error as { data?: { statusMessage?: string } })?.data?.statusMessage
      || 'Could not load payment options.'
    selectedGateway.value = 'p2p'
  } finally {
    isLoading.value = false
  }
}

const processFunding = async () => {
  errorMessage.value = ''
  notice.value = ''

  if (selectedGateway.value === 'p2p') {
    await navigateTo('/p2p')
    return
  }

  const provider = activeProvider.value
  if (!provider) return
  if (!amount.value || amount.value <= 0) {
    errorMessage.value = 'Please enter a valid amount.'
    return
  }
  if (amount.value < provider.min_amount || amount.value > provider.max_amount) {
    errorMessage.value = `Amount must be between ${provider.min_amount} and ${provider.max_amount} ${settings.value.currency}.`
    return
  }

  isProcessing.value = true
  try {
    const response = await $fetch<{
      data: { checkoutUrl: string | null, instructions: string | null, deposit: { id: string } }
    }>('/api/wallet/deposit/intent', {
      method: 'POST',
      body: {
        providerCode: provider.code,
        amount: amount.value,
        currency: settings.value.currency,
        platform: platform.value,
        idempotencyKey: crypto.randomUUID()
      }
    })

    if (response.data.checkoutUrl) {
      window.location.href = response.data.checkoutUrl
      return
    }
    notice.value = response.data.instructions
      || 'Deposit opened. Your balance updates as soon as the payment is confirmed.'
    amount.value = null
  } catch (error: unknown) {
    errorMessage.value = (error as { data?: { statusMessage?: string } })?.data?.statusMessage
      || 'Failed to initialize payment.'
  } finally {
    isProcessing.value = false
  }
}

onMounted(loadProviders)
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

      <div v-if="isNative && webOnlyBlocked" class="bg-slate-900 border border-amber-500/30 p-6 rounded-xl space-y-3">
        <p class="text-sm text-amber-300">
          Top-ups are handled on the web. Open viorp.com/add-funds in your browser — your balance syncs straight back into the app.
        </p>
        <NuxtLink to="/p2p" class="inline-block text-xs font-bold text-indigo-300 hover:text-white">Or deposit via P2P →</NuxtLink>
      </div>

      <div v-else class="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
        <p v-if="isLoading" class="text-xs text-slate-400">Loading payment options…</p>

        <div v-else>
          <label class="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Select Gateway</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              v-for="gateway in providers"
              :key="gateway.code"
              type="button"
              :class="[
                'text-left p-4 rounded-xl border transition-all flex items-center space-x-3',
                selectedGateway === gateway.code ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              ]"
              @click="selectedGateway = gateway.code"
            >
              <div class="text-2xl">{{ GATEWAY_META[gateway.code]?.icon ?? '🏦' }}</div>
              <div>
                <h4 class="text-sm font-bold text-white">{{ gateway.display_name }}</h4>
                <p class="text-[10px] text-slate-400">{{ GATEWAY_META[gateway.code]?.description ?? gateway.route }}</p>
              </div>
            </button>
            <button
              type="button"
              :class="[
                'text-left p-4 rounded-xl border transition-all flex items-center space-x-3',
                selectedGateway === 'p2p' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              ]"
              @click="selectedGateway = 'p2p'"
            >
              <div class="text-2xl">🤝</div>
              <div>
                <h4 class="text-sm font-bold text-white">P2P Network</h4>
                <p class="text-[10px] text-slate-400">Direct Peer-to-Peer Escrow</p>
              </div>
            </button>
          </div>
          <p v-if="!providers.length" class="text-[11px] text-amber-400 mt-3">
            No card or crypto gateway is enabled yet. You can still deposit through the P2P network.
          </p>
        </div>

        <div v-if="activeProvider" class="space-y-4">
          <div class="grid grid-cols-5 gap-1.5">
            <button
              v-for="preset in presets"
              :key="preset"
              type="button"
              :class="['py-2 rounded-lg font-mono text-xs font-bold border transition-all', amount === preset ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700']"
              @click="amount = preset"
            >
              +{{ preset }}
            </button>
          </div>
          <div>
            <label class="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Deposit Amount ({{ settings.currency }})</label>
            <input
              v-model.number="amount"
              type="number"
              :min="activeProvider.min_amount"
              :max="activeProvider.max_amount"
              placeholder="0.00"
              class="w-full bg-slate-950 text-sm text-white border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
            >
            <p class="text-[10px] text-slate-500 mt-1">
              Fee {{ Number(activeProvider.fee_percent).toFixed(2) }}%
              <span v-if="Number(activeProvider.fee_flat) > 0">+ {{ settings.currency }} {{ Number(activeProvider.fee_flat).toFixed(2) }}</span>
              · limits {{ activeProvider.min_amount }}–{{ activeProvider.max_amount }} {{ settings.currency }}
            </p>
          </div>

          <dl v-if="amount && amount > 0" class="text-[11px] text-slate-400 space-y-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
            <div class="flex justify-between">
              <dt>Top-up</dt>
              <dd class="font-mono text-white">{{ settings.currency }} {{ Number(amount).toFixed(2) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Processing fee</dt>
              <dd class="font-mono text-amber-400">{{ settings.currency }} {{ fee.toFixed(2) }}</dd>
            </div>
            <div class="flex justify-between border-t border-slate-800 pt-1">
              <dt>You pay</dt>
              <dd class="font-mono text-white">
                {{ settings.currency }} {{ total.toFixed(2) }}
                <span v-if="converted" class="text-slate-500">≈ {{ converted.currency }} {{ converted.amount.toLocaleString() }}</span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt>Credited</dt>
              <dd class="font-mono text-emerald-400">{{ credited.toFixed(2) }} PEW</dd>
            </div>
          </dl>
        </div>

        <p v-if="notice" class="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg">
          {{ notice }}
        </p>
        <p v-if="errorMessage" class="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg">
          {{ errorMessage }}
        </p>

        <button
          type="button"
          :disabled="isProcessing || isLoading || (!!activeProvider && !(amount && amount > 0))"
          class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black text-sm px-4 py-3.5 rounded-lg transition-colors shadow"
          @click="processFunding"
        >
          {{ isProcessing ? 'Initializing...' : (selectedGateway === 'p2p' ? 'Continue to P2P Marketplace' : 'Proceed to Payment') }}
        </button>
      </div>
    </div>
  </main>
</template>
