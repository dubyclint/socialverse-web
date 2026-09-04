<template>
  <div class="seller-page">
    <header>
      <h1>Sell Pewgift</h1>
      <p v-if="maxMarginPct !== null">Your margin cap is {{ maxMarginPct }}%. Payout methods are usable once an admin approves them.</p>
    </header>

    <p v-if="denied" class="notice">
      Selling is granted by an admin or manager. Ask support to enable the privilege on your account.
    </p>

    <template v-else>
      <section class="card">
        <h2>Payout methods</h2>
        <ul class="methods">
          <li v-for="method in methods" :key="method.id">
            <span>{{ method.kind }} · {{ method.asset_code || '—' }} · {{ method.account_name || 'custom instructions' }}</span>
            <span class="state" :class="method.status.toLowerCase()">{{ method.status }}</span>
          </li>
        </ul>
        <p v-if="!methods.length" class="empty">No payout methods yet.</p>

        <form class="method-form" @submit.prevent="addMethod">
          <select v-model="draft.kind">
            <option value="BANK">Bank account</option>
            <option value="CRYPTO">Crypto address</option>
            <option value="CUSTOM">Custom local instructions</option>
          </select>

          <template v-if="draft.kind === 'CUSTOM'">
            <textarea
              v-model="draft.instructions"
              maxlength="400"
              placeholder="How buyers should pay you (max 400 characters)"
            />
            <small>{{ (draft.instructions || '').length }}/400</small>
          </template>
          <template v-else>
            <input v-model="draft.accountName" placeholder="Account name (must match your KYC identity)" />
            <input v-model="draft.accountRef" :placeholder="draft.kind === 'BANK' ? 'Account number' : 'Wallet address'" />
            <input v-if="draft.kind === 'BANK'" v-model="draft.bankName" placeholder="Bank name" />
            <input v-else v-model="draft.network" placeholder="Network (TRC20, ERC20, TON…)" />
          </template>

          <select v-model="draft.assetCode">
            <option value="">Asset</option>
            <option v-for="asset in assets" :key="asset.code" :value="asset.code">{{ asset.code }}</option>
          </select>

          <button type="submit">Submit for approval</button>
        </form>
      </section>

      <section class="card">
        <h2>Listings</h2>
        <ul class="listings">
          <li v-for="listing in listings" :key="listing.id">
            {{ listing.asset_code }} · margin {{ listing.margin_pct }}% ·
            {{ listing.min_amount }}–{{ listing.max_amount }} Pewgift ·
            {{ listing.available_pewgift }} available
            <span v-if="!listing.is_active" class="state">paused</span>
          </li>
        </ul>
        <p v-if="!listings.length" class="empty">No listings yet.</p>

        <form class="listing-form" @submit.prevent="addListing">
          <select v-model="listingDraft.assetCode">
            <option value="">Asset</option>
            <option v-for="asset in assets" :key="asset.code" :value="asset.code">{{ asset.code }}</option>
          </select>
          <input v-model.number="listingDraft.marginPct" type="number" step="0.1" min="0" placeholder="Margin %" />
          <input v-model.number="listingDraft.minAmount" type="number" min="1" placeholder="Min Pewgift" />
          <input v-model.number="listingDraft.maxAmount" type="number" min="1" placeholder="Max Pewgift" />
          <input v-model.number="listingDraft.availablePewgift" type="number" min="0" placeholder="Available Pewgift" />
          <select v-model="listingDraft.paymentMethodId">
            <option value="">Approved payout method</option>
            <option v-for="method in approvedMethods" :key="method.id" :value="method.id">
              {{ method.kind }} · {{ method.account_name || 'custom' }}
            </option>
          </select>
          <button type="submit">Publish listing</button>
        </form>
      </section>
    </template>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import type { SellerMethodKind, SupportedAsset } from '~/types/p2p'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

interface PayoutMethodRow {
  id: string
  kind: SellerMethodKind
  asset_code: string | null
  account_name: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface ListingRow {
  id: string
  asset_code: string
  margin_pct: number
  min_amount: number
  max_amount: number
  available_pewgift: number
  is_active: boolean
}

const methods = ref<PayoutMethodRow[]>([])
const listings = ref<ListingRow[]>([])
const assets = ref<SupportedAsset[]>([])
const maxMarginPct = ref<number | null>(null)
const denied = ref(false)
const error = ref<string | null>(null)

const draft = reactive({
  kind: 'BANK' as SellerMethodKind,
  assetCode: '',
  accountName: '',
  accountRef: '',
  bankName: '',
  network: '',
  instructions: ''
})

const listingDraft = reactive({
  assetCode: '',
  marginPct: 0,
  minAmount: 1,
  maxAmount: 1000,
  availablePewgift: 0,
  paymentMethodId: ''
})

const approvedMethods = computed(() => methods.value.filter((m) => m.status === 'APPROVED'))

function describe(err: unknown): string {
  if (err && typeof err === 'object' && 'statusMessage' in err) {
    return String((err as { statusMessage?: string }).statusMessage ?? 'Request failed')
  }
  return err instanceof Error ? err.message : 'Request failed'
}

async function load() {
  try {
    const res = await $fetch<{ methods: PayoutMethodRow[]; maxMarginPct: number }>('/api/p2p/seller/methods')
    methods.value = res.methods
    maxMarginPct.value = res.maxMarginPct
  } catch (err) {
    denied.value = true
    error.value = describe(err)
    return
  }

  const [listingRes, assetRes] = await Promise.all([
    $fetch<{ listings: ListingRow[] }>('/api/p2p/listings', { query: { mine: '1' } }),
    $fetch<{ assets: SupportedAsset[] }>('/api/p2p/assets')
  ])
  listings.value = listingRes.listings
  assets.value = assetRes.assets
}

async function addMethod() {
  error.value = null
  try {
    await $fetch('/api/p2p/seller/methods', { method: 'POST', body: { ...draft } })
    await load()
  } catch (err) {
    error.value = describe(err)
  }
}

async function addListing() {
  error.value = null
  try {
    await $fetch('/api/p2p/listings', { method: 'POST', body: { ...listingDraft } })
    await load()
  } catch (err) {
    error.value = describe(err)
  }
}

onMounted(load)
</script>

<style scoped>
.seller-page { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; max-width: 900px; }
.card { border: 1px solid #e2e2e2; border-radius: 8px; padding: 1rem; }
.methods, .listings { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.methods li { display: flex; justify-content: space-between; gap: 1rem; }
.state { text-transform: uppercase; font-size: 0.72rem; padding: 0 0.4rem; border-radius: 10px; background: #eee; }
.state.approved { background: #e3f6e5; color: #1c6b2b; }
.state.rejected { background: #fde8e8; color: #a11; }
.method-form, .listing-form { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
.notice { background: #fff8e1; padding: 0.75rem; border-radius: 6px; }
.empty { color: #777; }
.error { color: #b00020; }
</style>
