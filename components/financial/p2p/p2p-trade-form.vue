<template>
  <section class="p2p-deposit">
    <h2>Deposit with Pewgift</h2>
    <p class="notice">{{ notice || 'For all bank local currency deposits or crypto' }}</p>

    <div class="controls">
      <label>
        Pay with
        <select v-model="assetCode">
          <option v-for="asset in assets" :key="asset.code" :value="asset.code">
            {{ asset.code }} — {{ asset.display_name }}{{ asset.network ? ` (${asset.network})` : '' }}
          </option>
        </select>
      </label>

      <label>
        Pewgift to receive
        <input v-model.number="amount" type="number" min="1" step="1" />
      </label>

      <button :disabled="!canSearch || loading" @click="search">
        {{ loading ? 'Matching…' : 'Find sellers' }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <ul v-if="matches.length" class="matches">
      <li v-for="match in matches" :key="match.listing_id">
        <div class="seller">
          <strong>{{ match.username || 'Seller' }}</strong>
          <span v-if="match.is_verified" class="badge">Verified</span>
          <span v-if="match.role === 'admin' || match.role === 'manager'" class="badge badge-priority">
            {{ match.role }}
          </span>
        </div>
        <div class="price">
          <span>{{ formatAsset(match.quote_amount) }} {{ assetCode }}</span>
          <small>{{ formatAsset(match.price_per_pewgift) }} {{ assetCode }} / Pewgift · margin {{ match.margin_pct }}%</small>
        </div>
        <button :disabled="loading" @click="startTrade(match)">Buy</button>
      </li>
    </ul>

    <p v-else-if="searched && !loading" class="empty">No seller can cover that amount right now.</p>

    <div v-if="pendingMatch" class="terms">
      <h3>Trade terms</h3>
      <p>
        You pay <strong>{{ formatAsset(pendingMatch.quote_amount) }} {{ assetCode }}</strong> off-platform and receive
        <strong>{{ amount }} Pewgift</strong>. Accepting locks the seller's Pewgift in escrow and reveals their payout
        details. Release happens once the seller confirms your payment; disputes are settled by an admin.
      </p>
      <div class="terms-actions">
        <button @click="confirm">Accept &amp; lock escrow</button>
        <button class="ghost" @click="pendingMatch = null">Cancel</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { SellerMatch } from '~/types/p2p'

const emit = defineEmits<{ opened: [tradeId: string] }>()

const { assets, notice, matches, loading, error, loadAssets, findSellers, openTrade } = useP2p()

const assetCode = ref('')
const amount = ref(100)
const searched = ref(false)
const pendingMatch = ref<SellerMatch | null>(null)

const canSearch = computed(() => Boolean(assetCode.value) && amount.value > 0)

onMounted(async () => {
  await loadAssets()
  assetCode.value = assets.value[0]?.code ?? ''
})

function formatAsset(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
}

async function search() {
  pendingMatch.value = null
  searched.value = true
  await findSellers(assetCode.value, amount.value)
}

function startTrade(match: SellerMatch) {
  pendingMatch.value = match
}

async function confirm() {
  if (!pendingMatch.value) return
  const trade = await openTrade(pendingMatch.value.listing_id, amount.value)
  pendingMatch.value = null
  if (trade) emit('opened', trade.id)
}
</script>

<style scoped>
.p2p-deposit { border: 1px solid #e2e2e2; border-radius: 8px; padding: 1rem; }
.notice { color: #666; font-size: 0.9rem; }
.controls { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; margin: 1rem 0; }
.controls label { display: flex; flex-direction: column; font-size: 0.85rem; gap: 0.25rem; }
.matches { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.matches li { display: flex; align-items: center; justify-content: space-between; gap: 1rem; border: 1px solid #eee; border-radius: 6px; padding: 0.6rem 0.8rem; }
.seller { display: flex; align-items: center; gap: 0.4rem; }
.price { display: flex; flex-direction: column; text-align: right; }
.price small { color: #777; }
.badge { background: #e8f4ff; color: #0b6bcb; border-radius: 10px; padding: 0 0.5rem; font-size: 0.72rem; text-transform: capitalize; }
.badge-priority { background: #fff3d6; color: #8a5b00; }
.terms { margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem; }
.terms-actions { display: flex; gap: 0.5rem; }
.ghost { background: transparent; border: 1px solid #ccc; }
.error { color: #b00020; }
.empty { color: #777; }
</style>
