<template>
  <div class="live-req">
    <NuxtLink to="/stream" class="back">← Live streams</NuxtLink>
    <h1>Going live on Viorp</h1>

    <p v-if="pending" class="muted">Checking your live access…</p>
    <p v-else-if="loadError" class="alert">{{ loadError }}</p>

    <template v-else-if="access">
      <section class="status" :class="access.mode">
        <template v-if="access.mode === 'denied'">
          <h2>Live streaming is turned off for your account</h2>
          <p>An admin has disabled going live on this account. Contact support if you think this is a mistake.</p>
        </template>
        <template v-else-if="access.mode === 'waived'">
          <h2>You can go live</h2>
          <p>An admin has granted you live access.</p>
        </template>
        <template v-else-if="access.mode === 'qualified'">
          <h2>You qualify to go live</h2>
          <p>Keep meeting the requirements below; access is checked every time you start a stream.</p>
        </template>
        <template v-else-if="access.mode === 'trial'">
          <h2>Free trial: {{ formatDuration(access.trialSecondsLeft) }} left</h2>
          <p>Every account gets {{ access.rules.trial_minutes }} minutes of live streaming in total to try it out.</p>
        </template>
        <template v-else>
          <h2>Your free {{ access.rules.trial_minutes }}-minute trial is used up</h2>
          <p>To keep going live, your account needs to meet all of the requirements below, or be approved by an admin.</p>
        </template>
        <NuxtLink v-if="access.canGoLive" to="/stream/broadcast" class="btn-primary">Go live</NuxtLink>
      </section>

      <section class="rules">
        <h3>Requirements</h3>
        <div v-for="item in requirements" :key="item.label" class="rule" :class="{ met: item.met }">
          <div class="rule-head">
            <span>{{ item.met ? '✓' : '○' }} {{ item.label }}</span>
            <span class="rule-value">{{ item.value }}</span>
          </div>
          <div class="bar"><i :style="{ width: `${item.pct}%` }" /></div>
        </div>
      </section>

      <section class="terms">
        <h3>Rules for live access</h3>
        <ul>
          <li>Access is re-checked every time you start a stream. If your activity, transactions or followers drop below the requirements, live access is paused until you qualify again.</li>
          <li>Followers only count from active (not suspended) accounts. Buying followers, fake engagement or self-gifting can lead to live access being removed.</li>
          <li>One live broadcast at a time per account. Trial streams end automatically when the trial time runs out.</li>
          <li>Admins can grant, pause or remove live access for any account and reset the trial at any time.</li>
          <li>Live content must follow the <NuxtLink to="/terms-and-policy">Policy &amp; Terms</NuxtLink>. Nudity, violence, harassment, scams and copyrighted broadcasts are removed and can cost you live access.</li>
          <li>Watching, chatting and gifting in other people's live streams is open to everyone.</li>
          <li>Gifts to the host go to the host. Gifts to another person or their comment during a live are split 80% to the host and 20% to that person, after the normal gift fee.</li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({ middleware: ['auth'], layout: 'default' })
useHead({ title: 'Live requirements' })

interface LiveAccess {
  mode: 'waived' | 'qualified' | 'trial' | 'locked' | 'denied'
  canGoLive: boolean
  trialSecondsLeft: number
  progress: { accountDays: number, followers: number, pewAdded: number, pewReceived: number, activeDays: number, transactions: number }
  rules: { trial_minutes: number, min_followers: number, min_account_days: number, min_pew_added: number, min_pew_received: number, min_active_days: number, min_transactions: number, window_days: number }
}

const { data, pending, error } = await useFetch<{ data: LiveAccess }>('/api/stream/live-access')
const access = computed(() => data.value?.data ?? null)
const loadError = computed(() => (error.value ? 'Could not load your live access. Please try again.' : ''))

const pct = (value: number, target: number) => (target <= 0 ? 100 : Math.min(100, Math.round((value / target) * 100)))
const num = (value: number) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })

const requirements = computed(() => {
  if (!access.value) return []
  const { progress: p, rules: r } = access.value
  const pewPct = Math.max(pct(p.pewAdded, r.min_pew_added), pct(p.pewReceived, r.min_pew_received))
  return [
    { label: `Account at least ${r.min_account_days} days old`, value: `${p.accountDays} days`, pct: pct(p.accountDays, r.min_account_days), met: p.accountDays >= r.min_account_days },
    { label: `${num(r.min_followers)} active followers`, value: num(p.followers), pct: pct(p.followers, r.min_followers), met: p.followers >= r.min_followers },
    { label: `Added ${num(r.min_pew_added)} PEW, or received ${num(r.min_pew_received)} PEW`, value: `${num(p.pewAdded)} added · ${num(p.pewReceived)} received`, pct: pewPct, met: pewPct >= 100 },
    { label: `Active on ${r.min_active_days} days in the last ${r.window_days} days`, value: `${p.activeDays} days`, pct: pct(p.activeDays, r.min_active_days), met: p.activeDays >= r.min_active_days },
    { label: `${r.min_transactions} wallet transactions in the last ${r.window_days} days`, value: num(p.transactions), pct: pct(p.transactions, r.min_transactions), met: p.transactions >= r.min_transactions }
  ]
})

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>

<style scoped>
.live-req { max-width: 760px; margin: 0 auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; color: #e2e8f0; }
.back { font-size: 0.85rem; color: #93c5fd; }
h1 { margin: 0; font-size: 1.5rem; }
.muted { color: #94a3b8; }
.alert { color: #fca5a5; }
.status { border-radius: 16px; padding: 1rem 1.25rem; background: #1e293b; border: 1px solid #334155; display: flex; flex-direction: column; gap: 0.5rem; }
.status.locked, .status.denied { border-color: #b91c1c; }
.status.trial { border-color: #d97706; }
.status.qualified, .status.waived { border-color: #16a34a; }
.status h2 { margin: 0; font-size: 1.15rem; }
.status p { margin: 0; color: #cbd5e1; }
.btn-primary { align-self: flex-start; background: #dc2626; color: #fff; padding: 0.5rem 1.1rem; border-radius: 999px; font-weight: 600; text-decoration: none; }
.rules, .terms { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 1rem 1.25rem; }
.rules h3, .terms h3 { margin: 0 0 0.75rem; }
.rule { margin-bottom: 0.85rem; }
.rule-head { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.92rem; }
.rule.met .rule-head span:first-child { color: #4ade80; }
.rule-value { color: #94a3b8; white-space: nowrap; }
.bar { height: 6px; border-radius: 999px; background: #1e293b; margin-top: 0.35rem; overflow: hidden; }
.bar i { display: block; height: 100%; background: linear-gradient(90deg, #f97316, #dc2626); }
.rule.met .bar i { background: #22c55e; }
.terms ul { margin: 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: 0.5rem; color: #cbd5e1; font-size: 0.9rem; }
</style>
