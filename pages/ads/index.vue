<template>
  <div class="cmps-home">
    <header class="head">
      <div>
        <h1>Ads Manager</h1>
        <p class="muted">
          Promote posts, Pages, chats, links, lead forms and catalogues. Budgets are paid in PEW from your wallet or a Page wallet.
        </p>
      </div>
      <NuxtLink
        to="/ads/create"
        class="btn"
      >
        + Create ad
      </NuxtLink>
    </header>

    <section class="stats">
      <div class="stat">
        <small>Wallet</small><strong>{{ fmt(balance) }} PEW</strong>
      </div>
      <div class="stat">
        <small>Active</small><strong>{{ totals.active }}</strong>
      </div>
      <div class="stat">
        <small>Impressions</small><strong>{{ totals.impressions.toLocaleString() }}</strong>
      </div>
      <div class="stat">
        <small>Clicks</small><strong>{{ totals.clicks.toLocaleString() }}</strong>
      </div>
      <div class="stat">
        <small>Results</small><strong>{{ totals.results.toLocaleString() }}</strong>
      </div>
      <div class="stat">
        <small>Spent</small><strong>{{ fmt(totals.spent) }} PEW</strong>
      </div>
      <div class="stat">
        <small>Remaining</small><strong>{{ fmt(totals.remaining) }} PEW</strong>
      </div>
      <div class="stat">
        <small>CTR</small><strong>{{ ctr(totals.clicks, totals.impressions) }}</strong>
      </div>
    </section>

    <div class="filters">
      <button
        v-for="f in FILTERS"
        :key="f.value"
        class="chip"
        :class="{ on: filter === f.value }"
        @click="filter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <p
      v-if="error"
      class="error"
    >
      {{ error }}
    </p>
    <div
      v-if="loading"
      class="card muted"
    >
      Loading campaigns…
    </div>
    <div
      v-else-if="!shown.length"
      class="card muted"
    >
      No campaigns here yet. <NuxtLink to="/ads/create">
        Create your first ad
      </NuxtLink>.
    </div>

    <div
      v-else
      class="list"
    >
      <article
        v-for="c in shown"
        :key="c.id"
        class="card campaign"
      >
        <img
          v-if="c.ad_creative_url"
          :src="c.ad_creative_url"
          class="thumb"
          alt=""
        >
        <div class="info">
          <NuxtLink
            :to="`/ads/${c.id}`"
            class="title"
          >
            {{ c.title }}
          </NuxtLink>
          <small>{{ GOAL_LABELS[c.goal as AdGoal]?.split(' — ')[0] ?? c.goal }} · {{ c.adset_name }}</small>
          <span
            class="status"
            :class="c.status.toLowerCase()"
          >{{ STATUS_LABELS[c.status] ?? c.status }}</span>
          <p
            v-if="c.status === 'REJECTED' && c.review_note"
            class="error"
          >
            Rejected: {{ c.review_note }}
          </p>
          <div class="metrics">
            <span>{{ Number(c.impressions_count).toLocaleString() }} impr.</span>
            <span>{{ Number(c.clicks_count).toLocaleString() }} clicks</span>
            <span>{{ Number(c.results_count).toLocaleString() }} results</span>
            <span>{{ fmt(c.spent) }} / {{ fmt(c.total_budget) }} PEW</span>
          </div>
          <div class="bar">
            <div :style="{ width: pct(c.spent, c.total_budget) }" />
          </div>
        </div>
        <div class="actions">
          <button
            v-if="c.status === 'ACTIVE'"
            class="btn small ghost"
            :disabled="busy === c.id"
            @click="setStatus(c, 'pause')"
          >
            Pause
          </button>
          <button
            v-if="c.status === 'PAUSED'"
            class="btn small"
            :disabled="busy === c.id"
            @click="setStatus(c, 'resume')"
          >
            Resume
          </button>
          <NuxtLink
            v-if="EDITABLE.includes(c.status)"
            :to="`/ads/create?edit=${c.id}`"
            class="btn small ghost"
          >
            Edit
          </NuxtLink>
          <NuxtLink
            :to="`/ads/${c.id}`"
            class="btn small ghost"
          >
            Analytics
          </NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { GOAL_LABELS } from '~/utils/ad-options'
import type { AdGoal } from '~/utils/ad-options'

definePageMeta({ middleware: ['auth'] })

interface CampaignRow {
  id: string
  title: string
  goal: string
  adset_name: string | null
  status: string
  review_note: string | null
  ad_creative_url: string | null
  impressions_count: number
  clicks_count: number
  results_count: number
  spent: number
  total_budget: number
  remaining_budget: number
}
interface Totals { impressions: number, clicks: number, results: number, spent: number, remaining: number, active: number }

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'In review', ACTIVE: 'Running', PAUSED: 'Paused', COMPLETED: 'Ended', REJECTED: 'Rejected', ARCHIVED: 'Archived', DRAFT: 'Draft'
}
const EDITABLE = ['PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'REJECTED']
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'ACTIVE', label: 'Running' },
  { value: 'PENDING_REVIEW', label: 'In review' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'ended', label: 'Ended / rejected' }
]

const campaigns = ref<CampaignRow[]>([])
const totals = ref<Totals>({ impressions: 0, clicks: 0, results: 0, spent: 0, remaining: 0, active: 0 })
const balance = ref(0)
const loading = ref(true)
const error = ref('')
const busy = ref('')
const filter = ref('all')

const shown = computed(() => campaigns.value.filter((c) => {
  if (filter.value === 'all') return true
  if (filter.value === 'ended') return ['COMPLETED', 'REJECTED', 'ARCHIVED'].includes(c.status)
  return c.status === filter.value
}))

const fmt = (n: number | string) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const ctr = (clicks: number, impressions: number) => impressions ? `${((clicks / impressions) * 100).toFixed(2)}%` : '—'
const pct = (spent: number, total: number) => `${Math.min(100, total ? (Number(spent) / Number(total)) * 100 : 0)}%`
const message = (e: unknown) => (e as { data?: { statusMessage?: string }, statusMessage?: string })?.data?.statusMessage
  ?? (e as { statusMessage?: string })?.statusMessage ?? 'Something went wrong'

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [list, wallet] = await Promise.all([
      $fetch<{ campaigns: CampaignRow[], totals: Totals }>('/api/ads/campaigns'),
      $fetch<{ balance: number }>('/api/wallet/balance').catch(() => ({ balance: 0 }))
    ])
    campaigns.value = list.campaigns
    totals.value = list.totals
    balance.value = Number(wallet.balance ?? 0)
  } catch (e) {
    error.value = message(e)
  } finally {
    loading.value = false
  }
}

const setStatus = async (c: CampaignRow, action: 'pause' | 'resume') => {
  busy.value = c.id
  try {
    await $fetch(`/api/ads/campaigns/${c.id}/status`, { method: 'POST', body: { action } })
    await load()
  } catch (e) {
    error.value = message(e)
  } finally {
    busy.value = ''
  }
}

onMounted(load)
</script>

<style scoped>
.cmps-home { max-width: 860px; margin: 0 auto; padding: 20px 16px 80px; color: #e2e8f0; }
.head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
h1 { font-size: 1.5rem; font-weight: 800; }
.muted { color: #94a3b8; font-size: 0.9rem; margin: 6px 0 14px; }
.stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin: 12px 0; }
.stat { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; }
.stat small { color: #94a3b8; }
.stat strong { font-size: 1.05rem; }
.filters { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 8px 0 12px; }
.chip { flex-shrink: 0; background: #1e293b; border: 1px solid #334155; color: #cbd5e1; border-radius: 999px; padding: 6px 12px; cursor: pointer; }
.chip.on { background: #2563eb; border-color: #2563eb; color: #fff; }
.list { display: flex; flex-direction: column; gap: 10px; }
.card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 14px; }
.campaign { display: flex; gap: 12px; flex-wrap: wrap; }
.thumb { width: 72px; height: 72px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
.info { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 4px; }
.info small { color: #94a3b8; }
.title { font-weight: 700; color: #fff; text-decoration: none; }
.status { align-self: flex-start; font-size: 0.75rem; padding: 2px 8px; border-radius: 999px; background: #334155; }
.status.active { background: #166534; }
.status.pending_review { background: #854d0e; }
.status.paused { background: #475569; }
.status.rejected { background: #7f1d1d; }
.metrics { display: flex; flex-wrap: wrap; gap: 10px; font-size: 0.8rem; color: #cbd5e1; }
.bar { height: 6px; background: #0f172a; border-radius: 999px; overflow: hidden; }
.bar div { height: 100%; background: #3b82f6; }
.actions { display: flex; gap: 6px; align-items: flex-start; flex-wrap: wrap; }
.btn { background: #2563eb; color: #fff; border: none; border-radius: 999px; padding: 0.55rem 1.1rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
.btn.small { padding: 0.35rem 0.8rem; font-size: 0.8rem; flex-shrink: 0; }
.btn.ghost { background: transparent; border: 1px solid #475569; color: #e2e8f0; }
.btn:disabled { opacity: .6; }
.error { color: #f87171; font-size: 0.85rem; }
</style>
