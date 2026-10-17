<template>
  <div class="admin-ads">
    <h1>Ads review &amp; settings</h1>
    <p
      v-if="error"
      class="error"
    >
      {{ error }}
    </p>
    <p
      v-if="notice"
      class="ok"
    >
      {{ notice }}
    </p>

    <div class="filters">
      <button
        v-for="s in STATUSES"
        :key="s.value"
        class="chip"
        :class="{ on: status === s.value }"
        @click="status = s.value; load()"
      >
        {{ s.label }}
      </button>
    </div>

    <div
      v-if="loading"
      class="card muted"
    >
      Loading…
    </div>
    <div
      v-else-if="!campaigns.length"
      class="card muted"
    >
      No campaigns.
    </div>
    <article
      v-for="c in campaigns"
      :key="c.id"
      class="card campaign"
    >
      <div class="preview">
        <SponsoredAd
          v-if="c.preview"
          :ad="c.preview"
          preview
        />
      </div>
      <div class="meta">
        <h3>{{ c.title }}</h3>
        <small>{{ c.status }} · {{ c.goal }} → {{ c.conversion_location }} · {{ c.funding_source === 'PAGE' ? 'Page wallet' : 'User wallet' }}</small>
        <small
          v-if="c.special_category"
          class="warn"
        >Special category: {{ c.special_category }}</small>
        <small>Budget {{ c.total_budget }} PEW · spent {{ c.spent }} · {{ c.impressions_count }} impressions · {{ c.clicks_count }} clicks</small>
        <small v-if="c.target_destination_url">Link: <a
          :href="c.target_destination_url"
          target="_blank"
          rel="noopener noreferrer"
        >{{ c.target_destination_url }}</a></small>
        <small>Runs {{ new Date(c.starts_at).toLocaleString() }} → {{ new Date(c.ends_at).toLocaleString() }}</small>
        <template v-if="c.status === 'PENDING_REVIEW'">
          <textarea
            v-model="notes[c.id]"
            rows="2"
            placeholder="Note to advertiser (required to reject)"
          />
          <div class="row">
            <button
              class="btn"
              :disabled="busy === c.id"
              @click="review(c.id, 'approve')"
            >
              Approve
            </button>
            <button
              class="btn danger"
              :disabled="busy === c.id"
              @click="review(c.id, 'reject')"
            >
              Reject &amp; refund
            </button>
          </div>
        </template>
        <div
          v-else-if="['ACTIVE', 'PAUSED'].includes(c.status)"
          class="row"
        >
          <button
            class="btn ghost"
            :disabled="busy === c.id"
            @click="setStatus(c.id, c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')"
          >
            {{ c.status === 'ACTIVE' ? 'Pause' : 'Resume' }}
          </button>
          <button
            class="btn danger"
            :disabled="busy === c.id"
            @click="setStatus(c.id, 'COMPLETED')"
          >
            End &amp; refund
          </button>
        </div>
      </div>
    </article>

    <section class="card">
      <h2>Pricing</h2>
      <div class="grid">
        <label>CPM (PEW per 1,000 impressions)<input
          v-model.number="pricing.cpm_pew"
          type="number"
          min="0.01"
          step="0.01"
        ></label>
        <label>Minimum budget (PEW)<input
          v-model.number="pricing.min_budget_pew"
          type="number"
          min="1"
        ></label>
        <label>Minimum daily max (PEW)<input
          v-model.number="pricing.min_daily_pew"
          type="number"
          min="0"
        ></label>
      </div>

      <h2>Feed serving</h2>
      <div class="grid">
        <label class="check"><input
          v-model="serving.enabled"
          type="checkbox"
        > Ads enabled</label>
        <label>One ad every N posts (5–7)<input
          v-model.number="serving.every_n_items"
          type="number"
          min="5"
          max="7"
        ></label>
        <label>First ad after post #<input
          v-model.number="serving.first_slot"
          type="number"
          min="1"
        ></label>
        <label class="check"><input
          v-model="serving.external_fallback"
          type="checkbox"
        > External network fallback</label>
      </div>

      <h2>External networks</h2>
      <p class="muted">
        Monetag runs on Web/PWA only, Appodeal on the native apps only. Never shown on wallet, deposit, withdrawal, gifting or checkout screens. No rewards are given for viewing ads.
      </p>
      <div class="grid">
        <label class="check"><input
          v-model="external.monetag_enabled"
          type="checkbox"
        > Monetag enabled (Web/PWA)</label>
        <label>Monetag push domain<input v-model="external.monetag_domain"></label>
        <label>Monetag push zone ID<input v-model="external.monetag_zone_id"></label>
        <label>Monetag social bar script URL<input
          v-model="external.monetag_social_bar_src"
          placeholder="https://…"
        ></label>
        <label>Monetag smartlink URL<input
          v-model="external.monetag_smartlink_url"
          placeholder="https://…"
        ></label>
        <label>Transition cooldown (minutes)<input
          v-model.number="external.transition_cooldown_minutes"
          type="number"
          min="1"
        ></label>
        <label class="check"><input
          v-model="external.appodeal_enabled"
          type="checkbox"
        > Appodeal enabled (Android/iOS)</label>
        <label>Appodeal app key<input v-model="external.appodeal_app_key"></label>
      </div>
      <button
        class="btn"
        :disabled="saving"
        @click="save"
      >
        {{ saving ? 'Saving…' : 'Save settings' }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import SponsoredAd from '~/components/ads/sponsored-ad.vue'
import type { AdView } from '~/utils/ad-options'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'route-guard'],
  layout: 'default'
})

interface AdminCampaign {
  id: string
  title: string
  status: string
  goal: string
  conversion_location: string
  funding_source: string
  special_category: string | null
  total_budget: number
  spent: number
  impressions_count: number
  clicks_count: number
  target_destination_url: string | null
  starts_at: string
  ends_at: string
  preview: AdView | null
}

const STATUSES = [
  { value: 'PENDING_REVIEW', label: 'Review queue' },
  { value: 'ACTIVE', label: 'Running' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ALL', label: 'All' }
]

const status = ref('PENDING_REVIEW')
const campaigns = ref<AdminCampaign[]>([])
const notes = reactive<Record<string, string>>({})
const loading = ref(true)
const busy = ref('')
const saving = ref(false)
const error = ref('')
const notice = ref('')
const pricing = reactive({ cpm_pew: 2, min_budget_pew: 5, min_daily_pew: 1 })
const serving = reactive({ enabled: true, every_n_items: 6, first_slot: 3, external_fallback: true })
const external = reactive({
  monetag_enabled: true, monetag_domain: '', monetag_zone_id: '', monetag_social_bar_src: '', monetag_smartlink_url: '',
  appodeal_enabled: true, appodeal_app_key: '', transition_cooldown_minutes: 15
})

const message = (e: unknown) => (e as { data?: { statusMessage?: string } })?.data?.statusMessage
  ?? (e as { statusMessage?: string })?.statusMessage ?? 'Something went wrong'

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ campaigns: AdminCampaign[], pricing: typeof pricing, external: typeof external, serving: Partial<typeof serving> }>('/api/admin/ads', { query: { status: status.value } })
    campaigns.value = res.campaigns
    Object.assign(pricing, res.pricing)
    Object.assign(external, res.external)
    Object.assign(serving, res.serving)
  } catch (e) {
    error.value = message(e)
  } finally {
    loading.value = false
  }
}

const review = async (campaignId: string, action: 'approve' | 'reject') => {
  busy.value = campaignId
  notice.value = ''
  try {
    await $fetch('/api/admin/ads/review', { method: 'POST', body: { campaignId, action, note: notes[campaignId] } })
    notice.value = action === 'approve' ? 'Approved — the ad is now running.' : 'Rejected and refunded.'
    await load()
  } catch (e) {
    error.value = message(e)
  } finally {
    busy.value = ''
  }
}

const setStatus = async (campaignId: string, next: string) => {
  busy.value = campaignId
  try {
    await $fetch('/api/admin/campaigns/status', { method: 'POST', body: { campaignId, status: next } })
    await load()
  } catch (e) {
    error.value = message(e)
  } finally {
    busy.value = ''
  }
}

const save = async () => {
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    await $fetch('/api/admin/ads/settings', { method: 'PUT', body: { pricing, serving, external } })
    notice.value = 'Settings saved.'
  } catch (e) {
    error.value = message(e)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.admin-ads { max-width: 960px; margin: 0 auto; padding: 20px 16px 80px; color: #e2e8f0; display: flex; flex-direction: column; gap: 12px; }
h1 { font-size: 1.4rem; font-weight: 800; }
h2 { font-size: 1.05rem; font-weight: 700; margin-top: 6px; }
.muted { color: #94a3b8; font-size: 0.85rem; }
.filters { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
.chip { flex-shrink: 0; background: #1e293b; border: 1px solid #334155; color: #cbd5e1; border-radius: 999px; padding: 6px 12px; cursor: pointer; }
.chip.on { background: #2563eb; color: #fff; }
.card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.campaign { flex-direction: row; flex-wrap: wrap; }
.preview { width: 340px; max-width: 100%; }
.meta { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 6px; }
.meta small { color: #cbd5e1; word-break: break-all; }
.warn { color: #fbbf24 !important; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
label.check { flex-direction: row; align-items: center; gap: 8px; }
input, textarea { background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 8px 10px; font: inherit; }
.btn { align-self: flex-start; background: #2563eb; color: #fff; border: none; border-radius: 999px; padding: 0.5rem 1.1rem; font-weight: 600; cursor: pointer; }
.btn.ghost { background: transparent; border: 1px solid #475569; }
.btn.danger { background: #b91c1c; }
.btn:disabled { opacity: .6; }
.error { color: #f87171; }
.ok { color: #4ade80; }
</style>
