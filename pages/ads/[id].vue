<template>
  <div class="detail">
    <NuxtLink
      to="/ads"
      class="back"
    >
      ← Ads Manager
    </NuxtLink>
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
      Loading…
    </div>

    <template v-else-if="data">
      <header class="head">
        <div>
          <h1>{{ c.title }}</h1>
          <small class="muted">{{ GOAL_LABELS[c.goal as AdGoal] ?? c.goal }} · {{ c.adset_name }}</small>
        </div>
        <span
          class="status"
          :class="c.status.toLowerCase()"
        >{{ STATUS_LABELS[c.status] ?? c.status }}</span>
      </header>
      <p
        v-if="c.status === 'PENDING_REVIEW'"
        class="notice"
      >
        Your ad is in review. It starts running once approved.
      </p>
      <p
        v-if="c.status === 'REJECTED'"
        class="error"
      >
        Rejected{{ c.review_note ? `: ${c.review_note}` : '' }}. Unspent budget was returned. Edit the ad to resubmit.
      </p>

      <section class="stats">
        <div class="stat">
          <small>Impressions</small><strong>{{ n(c.impressions_count) }}</strong>
        </div>
        <div class="stat">
          <small>Clicks</small><strong>{{ n(c.clicks_count) }}</strong>
        </div>
        <div class="stat">
          <small>Results</small><strong>{{ n(c.results_count) }}</strong>
        </div>
        <div class="stat">
          <small>CTR</small><strong>{{ ctr }}</strong>
        </div>
        <div class="stat">
          <small>Spent</small><strong>{{ fmt(c.spent) }} PEW</strong>
        </div>
        <div class="stat">
          <small>Remaining</small><strong>{{ fmt(c.remaining_budget) }} PEW</strong>
        </div>
        <div class="stat">
          <small>Cost / result</small><strong>{{ costPerResult }}</strong>
        </div>
        <div class="stat">
          <small>CPM</small><strong>{{ fmt(c.bid_per_unit) }} PEW</strong>
        </div>
      </section>

      <div class="actions">
        <button
          v-if="c.status === 'ACTIVE'"
          class="btn ghost"
          :disabled="busy"
          @click="act('pause')"
        >
          Pause
        </button>
        <button
          v-if="c.status === 'PAUSED'"
          class="btn"
          :disabled="busy"
          @click="act('resume')"
        >
          Resume
        </button>
        <NuxtLink
          v-if="EDITABLE.includes(c.status)"
          :to="`/ads/create?edit=${c.id}`"
          class="btn ghost"
        >
          Edit
        </NuxtLink>
        <button
          v-if="['ACTIVE', 'PAUSED', 'PENDING_REVIEW'].includes(c.status)"
          class="btn ghost"
          :disabled="busy"
          @click="act('end')"
        >
          End &amp; refund
        </button>
        <button
          class="btn danger"
          :disabled="busy"
          @click="remove"
        >
          Delete
        </button>
      </div>

      <section
        v-if="['ACTIVE', 'PAUSED', 'PENDING_REVIEW'].includes(c.status)"
        class="card row"
      >
        <input
          v-model.number="topUp"
          type="number"
          min="1"
          placeholder="Add budget (PEW)"
        >
        <button
          class="btn"
          :disabled="busy || !topUp"
          @click="addBudget"
        >
          Add budget
        </button>
      </section>

      <section class="card">
        <h2>Last 30 days</h2>
        <div
          v-if="!data.daily.length"
          class="muted"
        >
          No activity yet.
        </div>
        <div
          v-else
          class="chart"
        >
          <div
            v-for="d in data.daily"
            :key="d.day"
            class="bar-col"
            :title="`${d.day}: ${d.impressions} impressions, ${d.clicks} clicks, ${d.results} results, ${fmt(d.spend)} PEW`"
          >
            <div
              class="bar"
              :style="{ height: `${(d.impressions / maxImpr) * 100}%` }"
            />
            <small>{{ d.day.slice(5) }}</small>
          </div>
        </div>
        <table
          v-if="data.daily.length"
          class="table"
        >
          <thead><tr><th>Day</th><th>Impr.</th><th>Clicks</th><th>Results</th><th>Spend</th></tr></thead>
          <tbody>
            <tr
              v-for="d in [...data.daily].reverse()"
              :key="d.day"
            >
              <td>{{ d.day }}</td><td>{{ n(d.impressions) }}</td><td>{{ n(d.clicks) }}</td><td>{{ n(d.results) }}</td><td>{{ fmt(d.spend) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section
        v-if="c.conversion_location === 'INSTANT_FORM'"
        class="card"
      >
        <div class="row between">
          <h2>Leads ({{ data.leads.length }})</h2>
          <a
            v-if="data.leads.length"
            :href="`/api/ads/campaigns/${c.id}/leads`"
            class="btn small ghost"
            download
          >Download CSV</a>
        </div>
        <div
          v-if="!data.leads.length"
          class="muted"
        >
          No leads yet.
        </div>
        <div
          v-for="lead in data.leads"
          :key="lead.id"
          class="lead"
        >
          <small class="muted">{{ new Date(lead.created_at).toLocaleString() }}</small>
          <div
            v-for="(value, key) in lead.answers"
            :key="key"
          >
            <strong>{{ key }}:</strong> {{ value }}
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Preview</h2>
        <div class="preview">
          <SponsoredAd
            v-if="data.preview"
            :ad="data.preview"
            preview
          />
        </div>
        <small class="muted">Runs {{ new Date(c.starts_at).toLocaleString() }} → {{ new Date(c.ends_at).toLocaleString() }} · charged per impression · highest-volume bidding</small>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SponsoredAd from '~/components/ads/sponsored-ad.vue'
import { GOAL_LABELS } from '~/utils/ad-options'
import type { AdGoal, AdView } from '~/utils/ad-options'

definePageMeta({ middleware: ['auth'] })

interface Campaign {
  id: string
  title: string
  goal: string
  adset_name: string | null
  status: string
  review_note: string | null
  conversion_location: string
  impressions_count: number
  clicks_count: number
  results_count: number
  spent: number
  remaining_budget: number
  bid_per_unit: number
  starts_at: string
  ends_at: string
}
interface Detail {
  campaign: Campaign
  preview: AdView | null
  daily: { day: string, impressions: number, clicks: number, results: number, spend: number }[]
  leads: { id: string, answers: Record<string, string>, created_at: string }[]
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'In review', ACTIVE: 'Running', PAUSED: 'Paused', COMPLETED: 'Ended', REJECTED: 'Rejected', ARCHIVED: 'Archived'
}
const EDITABLE = ['PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'REJECTED']

const route = useRoute()
const router = useRouter()
const data = ref<Detail | null>(null)
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const topUp = ref<number | null>(null)

const c = computed(() => data.value!.campaign)
const n = (v: number | string) => Number(v || 0).toLocaleString()
const fmt = (v: number | string) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })
const ctr = computed(() => (c.value.impressions_count ? `${((c.value.clicks_count / c.value.impressions_count) * 100).toFixed(2)}%` : '—'))
const costPerResult = computed(() => {
  const results = Number(c.value.results_count) + Number(c.value.clicks_count)
  return results ? `${fmt(Number(c.value.spent) / results)} PEW` : '—'
})
const maxImpr = computed(() => Math.max(1, ...(data.value?.daily ?? []).map(d => d.impressions)))
const message = (e: unknown) => (e as { data?: { statusMessage?: string } })?.data?.statusMessage
  ?? (e as { statusMessage?: string })?.statusMessage ?? 'Something went wrong'

const load = async () => {
  error.value = ''
  try {
    data.value = await $fetch<Detail>(`/api/ads/campaigns/${route.params.id}`)
  } catch (e) {
    error.value = message(e)
  } finally {
    loading.value = false
  }
}

const act = async (action: 'pause' | 'resume' | 'end') => {
  if (action === 'end' && !confirm('End this campaign? Unspent PEW goes back to the wallet that paid for it.')) return
  busy.value = true
  try {
    await $fetch(`/api/ads/campaigns/${c.value.id}/status`, { method: 'POST', body: { action } })
    await load()
  } catch (e) {
    error.value = message(e)
  } finally {
    busy.value = false
  }
}

const addBudget = async () => {
  busy.value = true
  try {
    await $fetch(`/api/ads/campaigns/${c.value.id}/budget`, { method: 'POST', body: { amount: topUp.value } })
    topUp.value = null
    await load()
  } catch (e) {
    error.value = message(e)
  } finally {
    busy.value = false
  }
}

const remove = async () => {
  if (!confirm('Delete this campaign? Unspent PEW is refunded and the ad stops immediately.')) return
  busy.value = true
  try {
    await $fetch(`/api/ads/campaigns/${c.value.id}`, { method: 'DELETE' })
    await router.push('/ads')
  } catch (e) {
    error.value = message(e)
    busy.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.detail { max-width: 860px; margin: 0 auto; padding: 20px 16px 80px; color: #e2e8f0; display: flex; flex-direction: column; gap: 12px; }
.back { color: #93c5fd; text-decoration: none; font-size: 0.9rem; }
.head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
h1 { font-size: 1.4rem; font-weight: 800; }
h2 { font-size: 1.05rem; font-weight: 700; }
.muted { color: #94a3b8; font-size: 0.85rem; }
.notice { background: #422006; color: #fde68a; border-radius: 10px; padding: 10px 12px; font-size: 0.9rem; }
.status { font-size: 0.8rem; padding: 3px 10px; border-radius: 999px; background: #334155; flex-shrink: 0; }
.status.active { background: #166534; }
.status.pending_review { background: #854d0e; }
.status.rejected { background: #7f1d1d; }
.stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
.stat { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; }
.stat small { color: #94a3b8; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.row { flex-direction: row; align-items: center; gap: 8px; }
.between { justify-content: space-between; }
input { background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 10px 12px; flex: 1; min-width: 0; }
.chart { display: flex; align-items: flex-end; gap: 4px; height: 140px; overflow-x: auto; }
.bar-col { flex: 1; min-width: 18px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; }
.bar { width: 100%; background: #3b82f6; border-radius: 4px 4px 0 0; min-height: 2px; }
.bar-col small { font-size: 0.6rem; color: #94a3b8; }
.table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.table th, .table td { text-align: left; padding: 6px; border-bottom: 1px solid #334155; }
.lead { border-top: 1px solid #334155; padding-top: 8px; font-size: 0.88rem; }
.preview { max-width: 420px; }
.btn { background: #2563eb; color: #fff; border: none; border-radius: 999px; padding: 0.5rem 1.1rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
.btn.small { padding: 0.35rem 0.8rem; font-size: 0.8rem; }
.btn.ghost { background: transparent; border: 1px solid #475569; color: #e2e8f0; }
.btn.danger { background: #b91c1c; }
.btn:disabled { opacity: .6; }
.error { color: #f87171; font-size: 0.88rem; }
</style>
