<template>
  <div class="payments-admin">
    <header class="page-header">
      <h1>Deposit Methods</h1>
      <p>
        Fees set here are charged on top of the top-up at payment time: the user is charged
        amount + (amount × fee %) + flat fee, and the wallet is credited for the amount only.
      </p>
    </header>

    <p v-if="error" class="alert error">{{ error }}</p>
    <p v-if="notice" class="alert ok">{{ notice }}</p>
    <p v-if="loading" class="empty">Loading payment methods…</p>

    <section v-for="provider in providers" :key="provider.code" class="provider-card">
      <div class="provider-head">
        <div>
          <h2>{{ provider.display_name }}</h2>
          <span class="mono">{{ provider.code }} · {{ provider.route }}</span>
        </div>
        <label class="checkbox">
          <input v-model="provider.is_enabled" type="checkbox">
          <span>Enabled</span>
        </label>
      </div>

      <div class="grid">
        <label>
          <span>Fee %</span>
          <input v-model.number="provider.fee_percent" type="number" min="0" max="100" step="0.01">
        </label>
        <label>
          <span>Flat fee</span>
          <input v-model.number="provider.fee_flat" type="number" min="0" step="0.01">
        </label>
        <label>
          <span>Min amount</span>
          <input v-model.number="provider.min_amount" type="number" min="0" step="0.01">
        </label>
        <label>
          <span>Max amount</span>
          <input v-model.number="provider.max_amount" type="number" min="0" step="0.01">
        </label>
        <label class="checkbox">
          <input v-model="provider.web_only" type="checkbox">
          <span>Web only (hidden in the mobile app)</span>
        </label>
      </div>

      <p class="preview">
        A {{ settings.currency }} 100 top-up charges
        {{ settings.currency }} {{ preview(provider) }} and credits 100 PEW.
      </p>

      <div v-if="provider.code === 'paystack'" class="grid">
        <label>
          <span>Charge currency (blank = wallet currency)</span>
          <input v-model="provider.config.charge_currency" placeholder="NGN" maxlength="3">
        </label>
        <label>
          <span>Rate: 1 {{ settings.currency }} =</span>
          <input v-model.number="provider.config.fx_rate" type="number" min="0" step="0.0001" placeholder="1600">
        </label>
      </div>

      <div v-if="provider.code === 'flutterwave'" class="flutterwave">
        <h3>Currency / bank accounts (max 6)</h3>
        <div v-for="(slot, index) in bankSlots(provider)" :key="index" class="bank-row">
          <input v-model="slot.currency" placeholder="NGN" maxlength="3">
          <input v-model="slot.bank_name" placeholder="Bank name">
          <input v-model="slot.account_name" placeholder="Account name">
          <input v-model="slot.account_number" placeholder="Account number">
          <button type="button" class="danger" @click="removeBankSlot(provider, index)">Remove</button>
        </div>
        <button
          type="button"
          class="ghost"
          :disabled="bankSlots(provider).length >= 6"
          @click="addBankSlot(provider)"
        >
          Add account slot
        </button>

        <h3>Custom payment links (max 2)</h3>
        <div v-for="(_, index) in paymentLinks(provider)" :key="`link-${index}`" class="link-row">
          <input v-model="paymentLinks(provider)[index]" placeholder="https://flutterwave.com/pay/…">
          <button type="button" class="danger" @click="removeLink(provider, index)">Remove</button>
        </div>
        <button
          type="button"
          class="ghost"
          :disabled="paymentLinks(provider).length >= 2"
          @click="addLink(provider)"
        >
          Add payment link
        </button>
      </div>

      <div class="actions">
        <button type="button" :disabled="saving === provider.code" @click="save(provider)">
          {{ saving === provider.code ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

definePageMeta({
  middleware: ['auth', 'profile-completion'],
  layout: 'default'
})

useHead({ title: 'Deposit Methods' })

interface BankSlot {
  currency: string
  bank_name: string
  account_name: string
  account_number: string
}

interface ProviderConfig {
  bank_slots?: BankSlot[]
  payment_links?: string[]
  instructions?: string
  charge_currency?: string
  fx_rate?: number
}

interface ProviderRow {
  code: string
  display_name: string
  route: string
  is_enabled: boolean
  supported_currencies: string[]
  fee_percent: number
  fee_flat: number
  min_amount: number | null
  max_amount: number | null
  web_only: boolean
  config: ProviderConfig
}

interface DepositSettings {
  currency: string
  pewgift_per_unit: number
  min_amount: number
  max_amount: number
}

const providers = ref<ProviderRow[]>([])
const settings = ref<DepositSettings>({ currency: 'USD', pewgift_per_unit: 1, min_amount: 1, max_amount: 10000 })
const loading = ref(true)
const saving = ref('')
const error = ref('')
const notice = ref('')

const bankSlots = (provider: ProviderRow) => {
  if (!provider.config.bank_slots) provider.config.bank_slots = []
  return provider.config.bank_slots
}

const paymentLinks = (provider: ProviderRow) => {
  if (!provider.config.payment_links) provider.config.payment_links = []
  return provider.config.payment_links
}

const addBankSlot = (provider: ProviderRow) => {
  bankSlots(provider).push({ currency: '', bank_name: '', account_name: '', account_number: '' })
}
const removeBankSlot = (provider: ProviderRow, index: number) => bankSlots(provider).splice(index, 1)
const addLink = (provider: ProviderRow) => paymentLinks(provider).push('')
const removeLink = (provider: ProviderRow, index: number) => paymentLinks(provider).splice(index, 1)

const preview = (provider: ProviderRow) =>
  (100 + (100 * Number(provider.fee_percent || 0)) / 100 + Number(provider.fee_flat || 0)).toFixed(2)

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch<{ data: { providers: ProviderRow[], settings: DepositSettings } }>(
      '/api/admin/payment-providers'
    )
    providers.value = response.data.providers.map(row => ({ ...row, config: row.config ?? {} }))
    settings.value = response.data.settings
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
      || 'Failed to load payment methods'
  } finally {
    loading.value = false
  }
}

const save = async (provider: ProviderRow) => {
  saving.value = provider.code
  error.value = ''
  notice.value = ''
  try {
    await $fetch('/api/admin/payment-providers', {
      method: 'POST',
      body: {
        code: provider.code,
        isEnabled: provider.is_enabled,
        feePercent: provider.fee_percent,
        feeFlat: provider.fee_flat,
        minAmount: provider.min_amount,
        maxAmount: provider.max_amount,
        webOnly: provider.web_only,
        bankSlots: provider.config.bank_slots,
        paymentLinks: provider.config.payment_links,
        chargeCurrency: provider.config.charge_currency ?? null,
        fxRate: provider.config.fx_rate ?? null
      }
    })
    notice.value = `${provider.display_name} saved.`
    await load()
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
      || 'Failed to save payment method'
  } finally {
    saving.value = ''
  }
}

onMounted(load)
</script>

<style scoped>
.payments-admin {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-lg, 24px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.page-header p {
  color: var(--text-secondary, #9aa4b2);
  font-size: 0.9rem;
}

.alert {
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
}

.alert.error {
  background: rgba(255, 46, 136, 0.12);
  color: var(--color-error, #ff2e88);
}

.alert.ok {
  background: rgba(111, 255, 212, 0.12);
  color: var(--color-aurora-mint, #6fffd4);
}

.provider-card {
  background: var(--bg-card, #0a0f1e);
  border: 1px solid var(--color-dark-grey, #1f2937);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.provider-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.provider-head h2 {
  font-size: 1.05rem;
  font-weight: 600;
}

.mono {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: var(--text-secondary, #9aa4b2);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--text-secondary, #9aa4b2);
}

label.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

input {
  background: var(--bg-app, #121827);
  border: 1px solid var(--color-dark-grey, #1f2937);
  border-radius: 8px;
  padding: 8px 10px;
  color: var(--text-primary, #f0fffb);
}

.preview {
  font-size: 0.8rem;
  color: var(--color-solar-gold, #ffc857);
}

.flutterwave h3 {
  font-size: 0.85rem;
  margin-top: 8px;
  margin-bottom: 6px;
}

.bank-row,
.link-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.bank-row input,
.link-row input {
  flex: 1;
  min-width: 120px;
}

button {
  background: var(--accent, #6fffd4);
  color: var(--text-on-accent, #0a0f1e);
  border: none;
  border-radius: 999px;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
}

button.ghost {
  background: transparent;
  color: var(--text-primary, #f0fffb);
  border: 1px solid var(--color-dark-grey, #1f2937);
}

button.danger {
  background: var(--color-error, #ff2e88);
  color: #fff;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty {
  color: var(--text-secondary, #9aa4b2);
  font-size: 0.85rem;
}
</style>
