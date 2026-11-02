<template>
  <div class="mx-auto max-w-xl p-4 text-white">
    <NuxtLink to="/admin" class="text-sm text-blue-400">← Control</NuxtLink>
    <h1 class="mt-2 text-xl font-bold">Creator ad revenue</h1>
    <p class="mb-4 text-sm text-zinc-400">A creator earns when a view lasts the engaged time and an ad renders: eCPM ÷ 1000 × creator share. Three sources: external ads (Monetag/Appodeal, above the DAU gate), internal ads, and the platform fund programme (CPM per 1,000 engaged views, e.g. 0.001; 0 = off).</p>
    <div v-if="stats" class="mb-4 grid grid-cols-2 gap-2 text-sm">
      <div class="rounded-lg bg-zinc-900 p-3">DAU (24h)<b class="block text-lg">{{ stats.dau }}</b><small :class="stats.networksActive ? 'text-emerald-400' : 'text-amber-400'">{{ stats.networksActive ? 'Ad networks active' : `House ads only (gate ${stats.config.dau_gate})` }}</small></div>
      <div class="rounded-lg bg-zinc-900 p-3">Render rate (24h)<b class="block text-lg">{{ stats.last24h.renderRate }}%</b><small class="text-zinc-400">{{ stats.last24h.rendered }} / {{ stats.last24h.requests }} requests</small></div>
      <div class="rounded-lg bg-zinc-900 p-3">No-ad / timeouts (24h)<b class="block text-lg" :class="stats.last24h.noAd ? 'text-red-400' : ''">{{ stats.last24h.noAd }}</b></div>
      <div class="rounded-lg bg-zinc-900 p-3">Creator credits<b class="block text-lg">{{ stats.totals.lifetime.toFixed(4) }}</b><small class="text-zinc-400">Unpaid {{ stats.totals.pending.toFixed(4) }}</small></div>
    </div>
    <form class="space-y-2" @submit.prevent="save">
      <label v-for="f in fields" :key="f.key" class="flex items-center justify-between gap-3 rounded-lg bg-zinc-900 p-3 text-sm">
        <span>{{ f.label }}</span>
        <input v-model.number="form[f.key]" type="number" step="any" min="0" class="w-32 rounded bg-zinc-800 px-2 py-1 text-right">
      </label>
      <h2 class="pt-2 text-sm font-semibold text-zinc-300">eCPM per ad type (USD)</h2>
      <label v-for="k in ecpmKeys" :key="k" class="flex items-center justify-between gap-3 rounded-lg bg-zinc-900 p-3 text-sm">
        <span>{{ k === 'house_ad' ? 'internal ad' : k.replace('_', ' ') }}</span>
        <input v-model.number="ecpm[k]" type="number" step="0.01" min="0" class="w-32 rounded bg-zinc-800 px-2 py-1 text-right">
      </label>
      <button class="w-full rounded-lg bg-blue-600 py-2 font-semibold" :disabled="busy">{{ busy ? 'Saving…' : 'Save' }}</button>
      <p v-if="msg" class="text-sm" :class="ok ? 'text-emerald-400' : 'text-red-400'">{{ msg }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'route-guard'], layout: 'default' })
type Key = 'creator_share_pct' | 'internal_share_pct' | 'platform_fund_cpm' | 'dau_gate' | 'engaged_seconds' | 'fill_timeout_ms' | 'view_padding'
type EcpmKey = 'interstitial' | 'rewarded' | 'native_banner' | 'house_ad'
interface Stats { dau: number, networksActive: boolean, config: Record<Key, number> & { ecpm: Record<EcpmKey, number> }, last24h: { requests: number, rendered: number, noAd: number, renderRate: number }, totals: { pending: number, lifetime: number } }
const fields: { key: Key, label: string }[] = [
  { key: 'creator_share_pct', label: 'External ad creator share (%)' },
  { key: 'internal_share_pct', label: 'Internal ad creator share (%)' },
  { key: 'platform_fund_cpm', label: 'Platform fund CPM (PEW per 1,000 engaged views)' },
  { key: 'dau_gate', label: 'DAU needed for Monetag/Appodeal' },
  { key: 'engaged_seconds', label: 'Engaged view (seconds)' },
  { key: 'fill_timeout_ms', label: 'Ad fill timeout (ms)' },
  { key: 'view_padding', label: 'Public view padding (+views)' }
]
const ecpmKeys: EcpmKey[] = ['interstitial', 'rewarded', 'native_banner', 'house_ad']
const form = reactive<Record<Key, number>>({ creator_share_pct: 60, internal_share_pct: 60, platform_fund_cpm: 0, dau_gate: 10000, engaged_seconds: 6, fill_timeout_ms: 3500, view_padding: 0 })
const ecpm = reactive<Record<EcpmKey, number>>({ interstitial: 2, rewarded: 3, native_banner: 1.5, house_ad: 1 })
const stats = ref<Stats | null>(null)
const busy = ref(false); const msg = ref(''); const ok = ref(false)
const load = async () => {
  stats.value = await $fetch<Stats>('/api/admin/creator-revenue')
  const { ecpm: e, ...rest } = stats.value.config
  Object.assign(form, rest); Object.assign(ecpm, e)
}
onMounted(() => load().catch((e: { data?: { statusMessage?: string } }) => { msg.value = e?.data?.statusMessage || 'Could not load'; ok.value = false }))
const save = async () => {
  busy.value = true; msg.value = ''
  try {
    await $fetch('/api/admin/creator-revenue', { method: 'PUT', body: { ...form, ecpm } })
    await load(); ok.value = true; msg.value = 'Saved'
  } catch (e) { ok.value = false; msg.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Save failed' } finally { busy.value = false }
}
</script>
