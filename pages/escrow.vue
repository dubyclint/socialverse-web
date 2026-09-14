<template>
  <div class="escrow-container">
    <div class="page-header">
      <h1>🔒 Escrow</h1>
      <p class="subtitle">Pewgift held against your P2P trades until both sides settle</p>
    </div>

    <div class="escrow-stats">
      <div class="stat-card">
        <p class="stat-label">Active escrows</p>
        <h3 class="stat-value">{{ active.length }}</h3>
      </div>
      <div class="stat-card">
        <p class="stat-label">Held in escrow</p>
        <h3 class="stat-value">{{ totalHeld.toFixed(2) }} PEW</h3>
      </div>
      <div class="stat-card">
        <p class="stat-label">Completed</p>
        <h3 class="stat-value">{{ completed.length }}</h3>
      </div>
      <div class="stat-card">
        <p class="stat-label">Disputes</p>
        <h3 class="stat-value">{{ disputes.length }}</h3>
      </div>
    </div>

    <div class="escrow-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="loading" class="muted">Loading your escrows…</p>

    <div v-else class="escrow-section">
      <p v-if="visible.length === 0" class="muted">
        Nothing here yet. Escrow opens when you start a
        <NuxtLink to="/p2p">P2P deposit</NuxtLink>.
      </p>

      <article v-for="trade in visible" :key="trade.id" class="escrow-card">
        <header>
          <h3>{{ trade.amount }} PEW · {{ trade.asset_code }}</h3>
          <span class="badge" :class="trade.status">{{ trade.status.replace('_', ' ') }}</span>
        </header>
        <p class="meta">
          {{ trade.buyer_id === userId ? 'You are buying' : 'You are selling' }} ·
          opened {{ formatDate(trade.created_at) }}
        </p>
        <p v-if="trade.source_amount" class="meta">
          You pay {{ trade.source_amount }} {{ trade.asset_code }} off-platform
        </p>
        <NuxtLink :to="`/p2p?trade=${trade.id}`" class="open">Open trade room →</NuxtLink>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { P2PTrade } from '~/types/p2p'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

const tabs = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'disputes', label: 'Disputes' }
]

const activeTab = ref('active')
const trades = ref<P2PTrade[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const user = useSupabaseUser()
const userId = computed(() => user.value?.id ?? '')

const active = computed(() =>
  trades.value.filter(t => ['created', 'funded'].includes(t.status))
)
const completed = computed(() => trades.value.filter(t => t.status === 'released'))
const disputes = computed(() => trades.value.filter(t => t.status === 'disputed'))

const totalHeld = computed(() => active.value.reduce((sum, t) => sum + Number(t.amount), 0))

const visible = computed(() => {
  if (activeTab.value === 'completed') return completed.value
  if (activeTab.value === 'disputes') return disputes.value
  return active.value
})

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(async () => {
  try {
    const res = await $fetch<{ trades: P2PTrade[] }>('/api/p2p/trades')
    trades.value = res.trades
  } catch {
    error.value = 'Could not load your escrows'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.escrow-container { padding: 1.5rem; max-width: 960px; margin: 0 auto; }
.page-header h1 { margin: 0; }
.subtitle { color: #666; margin-top: 0.25rem; }
.escrow-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
.stat-card { border: 1px solid #eee; border-radius: 8px; padding: 1rem; }
.stat-label { margin: 0; color: #777; font-size: 0.85rem; }
.stat-value { margin: 0.35rem 0 0; font-size: 1.4rem; }
.escrow-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.tab-button { padding: 0.5rem 1rem; border: 1px solid #ddd; background: #fff; border-radius: 999px; cursor: pointer; }
.tab-button.active { background: #1a73e8; color: #fff; border-color: #1a73e8; }
.escrow-card { border: 1px solid #eee; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; }
.escrow-card header { display: flex; justify-content: space-between; align-items: center; }
.escrow-card h3 { margin: 0; font-size: 1rem; }
.badge { font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 999px; background: #eee; text-transform: capitalize; }
.badge.funded, .badge.paid_declared { background: #fff4d6; }
.badge.released { background: #e6f7e9; }
.badge.disputed { background: #fde8e8; }
.meta { color: #666; font-size: 0.85rem; margin: 0.35rem 0 0; }
.open { display: inline-block; margin-top: 0.6rem; font-size: 0.85rem; }
.muted { color: #777; }
.error { color: #b00020; }
</style>
