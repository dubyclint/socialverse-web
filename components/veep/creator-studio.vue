<template>
  <div class="studio">
    <p class="studio-note">Creator Studio (staff preview). Earnings come from ads (external or internal) that render during an engaged view.</p>
    <p v-if="error" class="state-card">{{ error }}</p>
    <template v-else-if="data">
      <div class="studio-grid">
        <div><small>Total plays</small><b>{{ data.plays }}</b></div>
        <div><small>Ad-interacted engaged views</small><b>{{ data.adInteractedEngagedViews }}</b></div>
        <div><small>Reach the {{ data.engagedSeconds }}s ad window</small><b>{{ data.reachAdWindowPct }}%</b></div>
        <div><small>Ad earnings (PEW)</small><b>{{ Number(data.balance.lifetime_amount).toFixed(4) }}</b><small>Unpaid {{ Number(data.balance.pending_amount).toFixed(4) }}</small></div>
      </div>
      <h4>Audience drop-off</h4>
      <svg viewBox="0 0 300 120" class="studio-chart" role="img" aria-label="Retention by second">
        <line x1="30" x2="30" y1="10" y2="12" />
        <line :x1="x(data.engagedSeconds)" :x2="x(data.engagedSeconds)" y1="5" y2="105" class="mark" />
        <text :x="x(data.engagedSeconds) + 3" y="14" class="mark-label">{{ data.engagedSeconds }}s ad window</text>
        <polyline :points="data.curve.map(p => `${x(p.t)},${y(p.pct)}`).join(' ')" />
        <text x="2" y="14">100%</text><text x="8" y="106">0</text><text x="276" y="118">60s</text>
      </svg>
      <h4>Revenue ledger</h4>
      <p v-if="!data.ledger.length" class="state-card">No ad-share credits yet.</p>
      <ul v-else class="studio-ledger">
        <li v-for="r in data.ledger" :key="r.ad_request_id">
          <NuxtLink :to="`/veep?start=${r.post_id}`">Veep {{ r.post_id.slice(0, 8) }}</NuxtLink>
          <span>{{ r.network_source === 'internal_house' ? 'internal ad' : r.network_source }} · eCPM {{ Number(r.current_network_ecpm).toFixed(2) }}<template v-if="Number(r.fund_credit_amount)"> · fund +{{ Number(r.fund_credit_amount).toFixed(4) }}</template></span>
          <b>+{{ (Number(r.wallet_credit_amount) + Number(r.fund_credit_amount)).toFixed(6) }}</b>
        </li>
      </ul>
    </template>
    <p v-else class="state-card">Loading…</p>
  </div>
</template>

<script setup lang="ts">
interface Ledger { ad_request_id: string, post_id: string, ad_type_served: string, current_network_ecpm: number, wallet_credit_amount: number, fund_credit_amount: number, network_source: string }
interface Studio { engagedSeconds: number, plays: number, adInteractedEngagedViews: number, reachAdWindowPct: number, curve: { t: number, pct: number }[], ledger: Ledger[], balance: { pending_amount: number, lifetime_amount: number } }
const props = defineProps<{ userId: string }>()
const data = ref<Studio | null>(null)
const error = ref('')
const x = (t: number) => 30 + (t / 60) * 265
const y = (pct: number) => 105 - pct * 0.95
watch(() => props.userId, async (id) => {
  data.value = null; error.value = ''
  try { data.value = await $fetch<Studio>('/api/creator/analytics', { query: { userId: id } }) } catch (e) { error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not load analytics' }
}, { immediate: true })
</script>

<style scoped>
.studio { padding: 8px 0; }
.studio-note { font-size: 12px; opacity: .7; margin: 0 0 8px; }
.studio-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.studio-grid div { display: flex; flex-direction: column; padding: 10px; border-radius: 10px; background: var(--surface-2, rgba(127,127,127,.12)); min-width: 0; }
.studio-grid small { font-size: 11px; opacity: .75; }
.studio-grid b { font-size: 18px; }
h4 { margin: 14px 0 6px; font-size: 14px; }
.studio-chart { width: 100%; height: auto; background: var(--surface-2, rgba(127,127,127,.12)); border-radius: 10px; }
.studio-chart polyline { fill: none; stroke: #3b82f6; stroke-width: 2; }
.studio-chart .mark { stroke: #f59e0b; stroke-dasharray: 3 3; }
.studio-chart text { font-size: 8px; fill: currentColor; opacity: .7; }
.studio-chart .mark-label { fill: #f59e0b; opacity: 1; }
.studio-ledger { list-style: none; padding: 0; margin: 0; }
.studio-ledger li { display: flex; gap: 8px; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(127,127,127,.2); font-size: 12px; min-width: 0; }
.studio-ledger span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: .8; }
.studio-ledger b { color: #10b981; flex-shrink: 0; }
</style>
