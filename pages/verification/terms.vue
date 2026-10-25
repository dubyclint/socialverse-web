<template>
  <div class="vt">
    <header class="vt-head">
      <button class="vt-back" aria-label="Back" @click="goBack"><Icon name="arrow-left" size="20" /></button>
      <h1>Verified Badge — Terms &amp; Fees</h1>
    </header>
    <p class="vt-lead">A VIORP Verified Badge shows that an account is authentic, trustworthy and follows our rules. Read these terms before you apply. Fees are paid in PEW from your in-app wallet (or the Page wallet for Pages).</p>

    <div class="vt-badges">
      <span><VerifiedBadge type="personal" :size="20" /> Personal</span>
      <span><VerifiedBadge type="business" :size="20" /> Business</span>
      <span><VerifiedBadge type="government" :size="20" /> Government</span>
    </div>

    <table v-if="fees" class="vt-table">
      <thead><tr><th>Class</th><th>Monthly</th><th>Yearly</th></tr></thead>
      <tbody>
        <tr v-for="(label, tier) in tiers" :key="tier">
          <td>{{ label }}</td>
          <td>{{ fmt(fees[`${tier}_monthly`]) }}</td>
          <td>{{ fmt(fees[`${tier}_yearly`]) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="vt-muted">Loading fees…</p>

    <div class="vt-warn">
      <strong>Mandatory wallet balance</strong>
      <p>Your wallet must hold the full fee before you apply. Your balance: <b>{{ balance ?? '…' }} PEW</b>. <NuxtLink to="/add-funds">Add funds</NuxtLink></p>
    </div>

    <ol class="vt-terms">
      <li>The fee is deducted from your wallet when you submit the request and is <b>non-refundable</b>, including when a request is not approved.</li>
      <li>A badge is valid for the plan you choose: 1 month (monthly) or 12 months (yearly).</li>
      <li>You must give true information and genuine proof (official links, ID or registration documents). False or borrowed identities lead to rejection and may lead to a ban.</li>
      <li>Personal Pages: owning a verified personal profile first is encouraged but not required.</li>
      <li>Business: SME and sole-owner businesses use the SME rate; large businesses and corporations use the corporate rate.</li>
      <li>Government badges are yearly and only for official government bodies and offices.</li>
      <li>VIORP can remove a badge at any time for impersonation, policy violations, a name or ownership change, or inactivity. After a badge is removed you can apply again.</li>
      <li>Fees can change. The fees shown on this page are always the current ones.</li>
      <li>A badge is not an endorsement by VIORP and gives no extra rights over other users.</li>
    </ol>

    <NuxtLink :to="backTo" class="vt-cta">Continue to application →</NuxtLink>
    <p class="vt-muted">By continuing you agree to the Verified Badge T&amp;C and the wallet deduction policy.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
definePageMeta({ middleware: ['auth'], layout: 'default' })
useHead({ title: 'Verified Badge - Terms & Fees' })

const route = useRoute()
const router = useRouter()
const fees = ref<Record<string, number | null> | null>(null)
const tiers = ref<Record<string, string>>({})
const balance = ref<number | null>(null)
const backTo = computed(() => (typeof route.query.back === 'string' && route.query.back.startsWith('/') ? route.query.back : '/profile'))
const fmt = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${v} PEW`)
const goBack = () => (window.history.length > 1 ? router.back() : navigateTo('/feed'))

onMounted(async () => {
  const [f, w] = await Promise.all([
    $fetch<{ fees: Record<string, number | null>, tiers: Record<string, string> }>('/api/verification/fees').catch(() => null),
    $fetch<{ balance?: number, data?: { balance?: number } }>('/api/wallet/balance').catch(() => null)
  ])
  if (f) { fees.value = f.fees; tiers.value = f.tiers }
  balance.value = Number(w?.balance ?? w?.data?.balance ?? 0)
})
</script>

<style scoped>
.vt { max-width: 720px; margin: 0 auto; padding: 0 16px 80px; color: var(--text-primary, #e2e8f0); }
.vt-head { display: flex; align-items: center; gap: 10px; padding: 14px 0; }
.vt-head h1 { font-size: 1.2rem; margin: 0; }
.vt-back { background: none; border: 0; color: inherit; }
.vt-lead { color: #cbd5e1; line-height: 1.5; }
.vt-badges { display: flex; gap: 16px; flex-wrap: wrap; margin: 12px 0; }
.vt-badges span { display: inline-flex; align-items: center; }
.vt-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: .92rem; }
.vt-table th, .vt-table td { padding: 10px 8px; border-bottom: 1px solid rgba(148,163,184,.2); text-align: left; }
.vt-warn { background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.4); border-radius: 12px; padding: 12px; margin: 14px 0; }
.vt-warn p { margin: 4px 0 0; }
.vt-terms { line-height: 1.55; padding-left: 20px; }
.vt-terms li { margin-bottom: 8px; }
.vt-cta { display: block; text-align: center; background: #2563eb; color: #fff; padding: 12px; border-radius: 12px; font-weight: 600; margin-top: 16px; text-decoration: none; }
.vt-muted { color: #94a3b8; font-size: .85rem; text-align: center; }
</style>
