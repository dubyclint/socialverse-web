<template>
  <div class="mx-auto max-w-3xl p-4 text-zinc-100">
    <NuxtLink to="/admin/creator-revenue" class="text-sm text-blue-400">← Creator revenue</NuxtLink>
    <h1 class="mt-2 text-xl font-bold">Creator payouts</h1>
    <p class="text-xs text-zinc-400">Earnings are statemented every {{ data?.period_days ?? 7 }} days and paid from @{{ data?.payout_wallet }} when you release them.</p>
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <button v-for="s in ['pending', 'released'] as const" :key="s" class="rounded-full px-3 py-1 text-sm" :class="tab === s ? 'bg-blue-600' : 'bg-zinc-800'" @click="tab = s; load()">{{ s === 'pending' ? 'To review' : 'Released' }}</button>
      <button class="ml-auto rounded bg-zinc-800 px-3 py-1 text-sm" :disabled="busy" @click="load(true)">Close period now ({{ data?.unstatemented_events ?? 0 }} unstatemented views)</button>
    </div>
    <p v-if="msg" class="mt-2 text-sm" :class="ok ? 'text-emerald-400' : 'text-red-400'">{{ msg }}</p>
    <p v-if="data && !data.payouts.length" class="mt-6 text-center text-sm text-zinc-400">Nothing here yet.</p>
    <div v-for="p in data?.payouts ?? []" :key="p.id" class="mt-3 rounded-lg bg-zinc-900 p-3 text-sm">
      <div class="flex items-center justify-between gap-2">
        <span class="min-w-0 truncate font-semibold">{{ p.name || p.username }} <small class="text-zinc-400">@{{ p.username }}</small></span>
        <span class="shrink-0 font-bold text-emerald-400">{{ fmt(p.status === 'released' ? p.released_amount : p.total) }} PEW</span>
      </div>
      <p class="text-xs text-zinc-400">{{ day(p.period_start) }} – {{ day(p.period_end) }} · {{ p.events_count }} engaged views</p>
      <table class="mt-2 w-full text-xs">
        <tbody>
          <tr><td>External ads (Monetag/Appodeal)</td><td class="text-right">{{ fmt(p.external_amount) }}</td></tr>
          <tr><td>Internal ads</td><td class="text-right">{{ fmt(p.internal_amount) }}</td></tr>
          <tr><td>Platform fund ({{ p.breakdown?.fund_views ?? 0 }} views)</td><td class="text-right">{{ fmt(p.fund_amount) }}</td></tr>
          <tr v-for="(v, k) in p.breakdown?.by_type ?? {}" :key="k" class="text-zinc-400"><td class="pl-3">· {{ k }} × {{ v.count }}</td><td class="text-right">{{ fmt(v.amount) }}</td></tr>
          <tr><td>Admin adjustment</td><td class="text-right" :class="Number(p.adjustment) < 0 ? 'text-red-400' : ''">{{ fmt(p.adjustment) }}</td></tr>
        </tbody>
      </table>
      <p v-if="p.note" class="mt-1 text-xs text-amber-300">Note: {{ p.note }}</p>
      <p v-if="p.status === 'released'" class="mt-1 text-xs text-zinc-400">Released {{ day(p.released_at) }} by @{{ p.released_by_username }}</p>
      <div v-else class="mt-2 space-y-2">
        <div class="flex gap-2">
          <input v-model.number="edits[p.id]!.adjustment" type="number" step="0.0001" placeholder="+/- PEW" class="w-28 rounded bg-zinc-800 px-2 py-1">
          <input v-model="edits[p.id]!.note" placeholder="Note (required)" class="min-w-0 flex-1 rounded bg-zinc-800 px-2 py-1">
          <button class="rounded bg-zinc-700 px-3" :disabled="busy" @click="act(p.id, 'adjust')">Save</button>
        </div>
        <button class="w-full rounded bg-emerald-600 py-2 font-semibold" :disabled="busy" @click="act(p.id, 'release')">Release {{ fmt(p.total) }} PEW</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'route-guard'], layout: 'default' })

interface Payout {
  id: string
  username: string
  name: string
  period_start: string
  period_end: string
  events_count: number
  external_amount: number
  internal_amount: number
  fund_amount: number
  adjustment: number
  note: string | null
  total: number
  status: 'pending' | 'released'
  released_amount: number | null
  released_at: string | null
  released_by_username: string
  breakdown?: { by_type?: Record<string, { count: number, amount: number }>, fund_views?: number }
}
const tab = ref<'pending' | 'released'>('pending')
const data = ref<{ period_days: number, payout_wallet: string, unstatemented_events: number, payouts: Payout[] } | null>(null)
const edits = reactive<Record<string, { adjustment: number, note: string }>>({})
const busy = ref(false); const msg = ref(''); const ok = ref(false)
const fmt = (n: number | null | undefined) => (Number(n) || 0).toFixed(4)
const day = (s: string | null) => s ? new Date(s).toLocaleDateString() : ''

const load = async (close = false) => {
  busy.value = true
  try {
    data.value = await $fetch('/api/admin/creator-payouts', { query: { status: tab.value, close: close ? '1' : undefined } })
    for (const p of data.value!.payouts) edits[p.id] = { adjustment: Number(p.adjustment) || 0, note: p.note ?? '' }
  } catch (e) { ok.value = false; msg.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Failed to load' }
  busy.value = false
}
const act = async (id: string, action: 'adjust' | 'release') => {
  busy.value = true; msg.value = ''
  try {
    await $fetch(`/api/admin/creator-payouts/${id}`, { method: 'POST', body: { action, ...edits[id] } })
    ok.value = true; msg.value = action === 'release' ? 'Released to the creator wallet.' : 'Adjustment saved.'
    busy.value = false
    await load()
  } catch (e) { ok.value = false; msg.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Failed'; busy.value = false }
}
onMounted(() => load())
</script>
