<template>
  <div class="min-h-screen bg-[#0a0a0a] text-white">
    <div class="max-w-4xl mx-auto px-6 py-12">

      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Monetization Portal: Requirements & Terms of Service</h1>
        <p class="mt-4 text-zinc-400 text-[15px] leading-relaxed max-w-3xl">
          Welcome to the Creator Monetization Program. To unlock payouts and withdrawal capabilities, your account must comply with our application ecosystem health, safety, and engagement rules.
        </p>
      </div>

      <!-- Overall -->
      <section class="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 md:p-6 mb-6">
        <div v-if="prog" class="flex flex-col gap-2">
          <div class="flex justify-between items-baseline gap-2">
            <h2 class="text-lg font-semibold">Your eligibility</h2>
            <span class="text-sm font-bold" :class="overall >= prog.passPct ? 'text-emerald-400' : 'text-amber-400'">{{ overall }}% · {{ metCount }}/{{ allCriteria.length }} met</span>
          </div>
          <div class="h-2.5 rounded-full bg-zinc-800 overflow-hidden relative">
            <div class="h-full" :class="overall >= prog.passPct ? 'bg-emerald-500' : 'bg-amber-500'" :style="{ width: overall + '%' }" />
            <div class="absolute top-0 bottom-0 w-0.5 bg-white/70" :style="{ left: prog.passPct + '%' }" />
          </div>
          <p class="text-[12.5px] text-zinc-400">You need {{ prog.passPct }}% of the requirements below to request a payout.<span v-if="prog.waived" class="text-emerald-400 font-semibold"> An admin waiver is active on your account.</span></p>
        </div>
        <p v-else-if="progErr" class="text-sm text-zinc-500">{{ progErr }}</p>
        <p v-else class="text-sm text-zinc-500">Loading your progress…</p>
      </section>

      <!-- Core Legal -->
      <section class="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8 mb-8">
        <h2 class="flex items-center gap-2 text-lg font-semibold mb-6">
          <span>⚖️</span> Core Legal Terms & Conditions
        </h2>
        <div class="space-y-5 text-[14.5px] leading-relaxed">
          <div v-for="(t, i) in LEGAL" :key="t.key" class="flex gap-3">
            <span class="font-bold text-zinc-200">{{ i + 1 }}.</span>
            <div class="flex-1 min-w-0">
              <span class="font-semibold text-white">{{ t.title }}:</span> <span class="text-zinc-400">{{ t.text }}</span>
              <ProgressRow v-if="byKey[t.key]" :c="byKey[t.key]!" />
            </div>
          </div>
        </div>
      </section>

      <!-- Veep views -->
      <section class="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8 mb-8">
        <h2 class="text-lg font-semibold mb-2">Veep views requirement</h2>
        <p class="text-[13.5px] text-zinc-400 mb-4 leading-relaxed">
          {{ veep ? veep.target.toLocaleString() : '200,000' }} engaged views in {{ veep?.days ?? 30 }} days from authentic, original videos. Copyrighted videos don't count and clipped videos are reviewed.
          Standard views ({{ veep?.thresholds.standard_s ?? 5 }}s) don't count; only engaged views ({{ veep?.thresholds.engaged_s ?? 25 }}s or watched to the end) do.
        </p>
        <div v-if="veep">
          <div class="flex justify-between text-sm mb-1"><span>{{ veep.engaged.toLocaleString() }} / {{ veep.target.toLocaleString() }} engaged views</span><span>{{ veep.progress }}%</span></div>
          <div class="h-2 rounded-full bg-zinc-800 overflow-hidden"><div class="h-full bg-emerald-500" :style="{ width: veep.progress + '%' }" /></div>
          <p class="mt-2 text-[12px] text-zinc-500">Standard views in the same period (not counted): {{ veep.standard.toLocaleString() }}</p>
        </div>
        <p v-else class="text-sm text-zinc-500">Sign in to see your progress.</p>
      </section>

      <!-- Eligibility Progress -->
      <section class="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8 mb-8">
        <h2 class="text-lg font-semibold mb-2">Monetization Eligibility Progress</h2>
        <p class="text-[13.5px] text-zinc-400 mb-6 leading-relaxed">
          Our system runs automated background checks tracking your feature usage. You must fulfill a minimum of {{ prog?.passPct ?? 70 }}% global app feature use to submit a payout request. The Admin Team holds strict override privileges and can manually waive any or all requirements for your profile.
        </p>
        <div class="mb-6">
          <h3 class="flex items-center gap-2 text-[14px] font-semibold text-emerald-400 mb-3">
            <span class="w-3 h-3 rounded-sm bg-emerald-400 inline-block"></span> Fulfilled Criteria (Passed Automated Checks)
          </h3>
          <ul class="space-y-4">
            <li v-for="c in fulfilled" :key="c.key"><ProgressRow :c="c" titled /></li>
            <li v-if="prog && !fulfilled.length" class="text-sm text-zinc-500">None yet.</li>
          </ul>
        </div>
        <div>
          <h3 class="flex items-center gap-2 text-[14px] font-semibold text-amber-400 mb-3">
            <span class="w-3 h-3 rounded-sm bg-amber-400 inline-block"></span> Pending Criteria (Currently In-Progress)
          </h3>
          <ul class="space-y-4">
            <li v-for="c in pendingList" :key="c.key"><ProgressRow :c="c" titled /></li>
            <li v-if="prog && !pendingList.length" class="text-sm text-zinc-500">Everything is fulfilled.</li>
          </ul>
        </div>
      </section>

      <!-- Admin Notes -->
      <section class="rounded-2xl border border-zinc-800 bg-[#111] p-6">
        <h3 class="font-semibold mb-3 text-[15px]">Admin Status Notes</h3>
        <div class="flex gap-3 rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-[13.5px] leading-relaxed text-zinc-400">
          <span class="text-lg">ℹ️</span>
          <p>
            <span class="font-semibold text-zinc-200">Special Waiver Note:</span> The system status gauges above depend on live feature event logs. If you do not meet the strict 70% threshold, your application can still be pushed to manual review. Platform Administrators have the authority to issue Global Rule Waivers based on original content quality and other valid considerations.
          </p>
        </div>
      </section>

      <div class="mt-10 text-center text-[12px] text-zinc-600">
        VIORP • Creator Monetization Program • v1.0
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })
useHead({ title: 'Monetization Portal - Requirements & Terms' })

interface Criterion { key: string, group: 'legal' | 'activity', label: string, detail: string, current: number, target: number, unit: string, progress: number, met: boolean }

const LEGAL = [
  { key: 'age', title: 'Age Requirement', text: 'You must be 18 years or older to participate.' },
  { key: 'identity', title: 'Identity Verification', text: 'All monetized channels and Page Owners must complete KYC verification or possess an official platform Verified Badge.' },
  { key: 'wallet', title: 'Wallet Maintenance Policy', text: 'To keep your qualifications in active standing, a minimum total of 10 PEW must have been added through add fund methods within a period of 2 months. Note: While this wallet rule is non-binding during our early launch window, our Admin Team manually reviews your overall wallet activity prior to approving any outbound withdrawal cash-out request.' },
  { key: 'compliance', title: 'Platform Compliance Guardrails', text: 'Accounts with active community standard violations, safety flags, or fraudulent botting signatures are automatically disqualified. The Admin Team reserves the absolute right to modify criteria, freeze transactions, or reverse previous monetization approvals based on platform safety.' }
]

const ProgressRow = defineComponent({
  props: { c: { type: Object as () => Criterion, required: true }, titled: Boolean },
  setup(props) {
    return () => {
      const c = props.c
      const color = c.met ? 'bg-emerald-500' : c.progress >= 50 ? 'bg-amber-500' : 'bg-rose-500'
      const value = c.key === 'compliance' ? (c.met ? 'Clear' : `${c.current} open`) : c.key === 'identity' ? (c.met ? 'Verified' : c.progress === 50 ? 'In review' : 'Not started') : `${c.current.toLocaleString()} / ${c.target.toLocaleString()} ${c.unit}`
      return h('div', { class: 'mt-2' }, [
        props.titled ? h('div', { class: 'text-[14px] font-semibold text-zinc-200' }, c.label) : null,
        h('div', { class: 'flex justify-between gap-2 text-[12.5px] text-zinc-400 mb-1' }, [h('span', { class: 'min-w-0' }, c.detail), h('span', { class: 'shrink-0 font-semibold ' + (c.met ? 'text-emerald-400' : 'text-zinc-300') }, `${value} · ${Math.round(c.progress)}%`)]),
        h('div', { class: 'h-2 rounded-full bg-zinc-800 overflow-hidden' }, [h('div', { class: 'h-full ' + color, style: { width: c.progress + '%' } })])
      ])
    }
  }
})

const veep = ref<{ engaged: number, standard: number, target: number, days: number, progress: number, thresholds: { standard_s: number, engaged_s: number } } | null>(null)
const prog = ref<{ criteria: Criterion[], passPct: number, waived: boolean } | null>(null)
const progErr = ref('')
const veepCriterion = computed<Criterion | null>(() => veep.value ? { key: 'veep', group: 'activity', label: 'Veep engaged views', detail: `${veep.value.target.toLocaleString()} engaged views in ${veep.value.days} days.`, current: veep.value.engaged, target: veep.value.target, unit: 'views', progress: veep.value.progress, met: veep.value.progress >= 100 } : null)
const allCriteria = computed(() => [...(prog.value?.criteria ?? []), ...(veepCriterion.value ? [veepCriterion.value] : [])])
const byKey = computed(() => Object.fromEntries(allCriteria.value.map(c => [c.key, c])) as Record<string, Criterion | undefined>)
const activity = computed(() => allCriteria.value.filter(c => c.group === 'activity'))
const fulfilled = computed(() => activity.value.filter(c => c.met))
const pendingList = computed(() => activity.value.filter(c => !c.met))
const metCount = computed(() => allCriteria.value.filter(c => c.met).length)
const overall = computed(() => allCriteria.value.length ? Math.round((metCount.value / allCriteria.value.length) * 100) : 0)

onMounted(async () => {
  const [v, p] = await Promise.allSettled([$fetch<NonNullable<typeof veep.value>>('/api/veep/monetization'), $fetch<NonNullable<typeof prog.value>>('/api/monetization/progress')])
  veep.value = v.status === 'fulfilled' ? v.value : null
  if (p.status === 'fulfilled') prog.value = p.value
  else progErr.value = 'Sign in to see your progress.'
})
</script>
