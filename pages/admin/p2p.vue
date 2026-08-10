<template>
  <div class="admin-p2p">
    <h1>P2P administration</h1>

    <nav class="tabs">
      <button v-for="t in tabs" :key="t" :class="{ active: tab === t }" @click="tab = t">{{ t }}</button>
    </nav>

    <section v-if="tab === 'Sellers'" class="card">
      <form class="row" @submit.prevent="grant">
        <input v-model="grantDraft.userId" placeholder="User id" />
        <input v-model.number="grantDraft.maxMarginPct" type="number" step="0.1" min="0" max="100" placeholder="Max margin %" />
        <button type="submit">Grant / update</button>
      </form>
      <ul>
        <li v-for="seller in sellers" :key="seller.user_id">
          {{ seller.user_id }} · cap {{ seller.max_margin_pct }}% ·
          {{ seller.revoked_at ? 'revoked' : (seller.is_active ? 'active' : 'paused') }}
          <button class="ghost" @click="revoke(seller.user_id)">Revoke</button>
        </li>
      </ul>
    </section>

    <section v-else-if="tab === 'Payout methods'" class="card">
      <ul>
        <li v-for="method in pendingMethods" :key="method.id">
          <div>
            <strong>{{ method.kind }}</strong> · {{ method.asset_code || '—' }} ·
            {{ method.account_name || method.instructions }}
            <small v-if="method.account_ref"> · {{ method.account_ref }}</small>
          </div>
          <div>
            <button @click="review(method.id, true)">Approve</button>
            <button class="ghost" @click="review(method.id, false)">Reject</button>
          </div>
        </li>
      </ul>
      <p v-if="!pendingMethods.length" class="empty">Nothing awaiting verification.</p>
    </section>

    <section v-else-if="tab === 'Assets'" class="card">
      <p>{{ enabledCrypto }} / {{ cryptoLimit }} crypto assets enabled.</p>
      <form class="row" @submit.prevent="saveAsset">
        <input v-model="assetDraft.code" placeholder="Code" />
        <select v-model="assetDraft.kind">
          <option value="FIAT">FIAT</option>
          <option value="CRYPTO">CRYPTO</option>
        </select>
        <input v-model="assetDraft.displayName" placeholder="Display name" />
        <input v-model="assetDraft.network" placeholder="Network" />
        <input v-model.number="assetDraft.referenceRate" type="number" step="0.00000001" placeholder="USD per unit" />
        <label class="inline"><input v-model="assetDraft.isEnabled" type="checkbox" /> enabled</label>
        <button type="submit">Save</button>
      </form>
      <ul>
        <li v-for="asset in enabledAssets" :key="asset.code">
          {{ asset.code }} · {{ asset.kind }} · rate {{ asset.reference_rate }}
          <small v-if="asset.rate_updated_at">(updated {{ new Date(asset.rate_updated_at).toLocaleString() }})</small>
        </li>
      </ul>
    </section>

    <section v-else class="card">
      <ul>
        <li v-for="alert in alerts" :key="alert.id" :class="alert.severity.toLowerCase()">
          <strong>{{ alert.kind }}</strong> · {{ alert.severity }} ·
          {{ new Date(alert.created_at).toLocaleString() }}
          <pre>{{ alert.detail }}</pre>
        </li>
      </ul>
      <p v-if="!alerts.length" class="empty">No alerts.</p>
    </section>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import type { P2PAssetKind, SellerMethodKind } from '~/types/p2p'

definePageMeta({
  middleware: ['auth', 'profile-completion'],
  layout: 'default'
})

interface SellerRow {
  user_id: string
  max_margin_pct: number
  is_active: boolean
  revoked_at: string | null
}

interface MethodRow {
  id: string
  kind: SellerMethodKind
  asset_code: string | null
  account_name: string | null
  account_ref: string | null
  instructions: string | null
}

interface AssetRow {
  code: string
  kind: P2PAssetKind
  reference_rate: number
  rate_updated_at: string | null
  is_enabled: boolean
}

interface AlertRow {
  id: string
  kind: string
  severity: string
  created_at: string
  detail: Record<string, unknown>
}

const tabs = ['Sellers', 'Payout methods', 'Assets', 'Alerts'] as const
const tab = ref<(typeof tabs)[number]>('Sellers')

const sellers = ref<SellerRow[]>([])
const pendingMethods = ref<MethodRow[]>([])
const assets = ref<AssetRow[]>([])
const alerts = ref<AlertRow[]>([])
const enabledCrypto = ref(0)
const cryptoLimit = ref(20)
const error = ref<string | null>(null)

const grantDraft = reactive({ userId: '', maxMarginPct: 3 })
const assetDraft = reactive({
  code: '',
  kind: 'CRYPTO' as P2PAssetKind,
  displayName: '',
  network: '',
  referenceRate: 1,
  isEnabled: true
})

const enabledAssets = computed(() => assets.value.filter((a) => a.is_enabled))

function describe(err: unknown): string {
  if (err && typeof err === 'object' && 'statusMessage' in err) {
    return String((err as { statusMessage?: string }).statusMessage ?? 'Request failed')
  }
  return err instanceof Error ? err.message : 'Request failed'
}

async function load() {
  error.value = null
  try {
    const [s, m, a, al] = await Promise.all([
      $fetch<{ sellers: SellerRow[] }>('/api/admin/p2p/sellers'),
      $fetch<{ methods: MethodRow[] }>('/api/admin/p2p/methods'),
      $fetch<{ assets: AssetRow[]; enabledCrypto: number; cryptoLimit: number }>('/api/admin/p2p/assets'),
      $fetch<{ alerts: AlertRow[] }>('/api/admin/p2p/alerts')
    ])
    sellers.value = s.sellers
    pendingMethods.value = m.methods
    assets.value = a.assets
    enabledCrypto.value = a.enabledCrypto
    cryptoLimit.value = a.cryptoLimit
    alerts.value = al.alerts
  } catch (err) {
    error.value = describe(err)
  }
}

async function grant() {
  try {
    await $fetch('/api/admin/p2p/sellers', { method: 'POST', body: { ...grantDraft } })
    await load()
  } catch (err) {
    error.value = describe(err)
  }
}

async function revoke(userId: string) {
  try {
    await $fetch('/api/admin/p2p/sellers', { method: 'POST', body: { userId, revoke: true } })
    await load()
  } catch (err) {
    error.value = describe(err)
  }
}

async function review(id: string, approve: boolean) {
  const reason = approve ? undefined : window.prompt('Rejection reason:') || 'Rejected'
  try {
    await $fetch(`/api/admin/p2p/methods/${id}/review`, { method: 'POST', body: { approve, reason } })
    await load()
  } catch (err) {
    error.value = describe(err)
  }
}

async function saveAsset() {
  try {
    await $fetch('/api/admin/p2p/assets', { method: 'POST', body: { ...assetDraft } })
    await load()
  } catch (err) {
    error.value = describe(err)
  }
}

onMounted(load)
</script>

<style scoped>
.admin-p2p { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.tabs { display: flex; gap: 0.5rem; }
.tabs button.active { font-weight: 700; text-decoration: underline; }
.card { border: 1px solid #e2e2e2; border-radius: 8px; padding: 1rem; }
.row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
.inline { display: flex; align-items: center; gap: 0.25rem; }
ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
li { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
li.critical { color: #a11; }
pre { margin: 0; font-size: 0.75rem; }
.ghost { background: transparent; border: 1px solid #ccc; }
.empty { color: #777; }
.error { color: #b00020; }
</style>
