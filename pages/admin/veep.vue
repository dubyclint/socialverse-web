<template>
  <div class="mx-auto max-w-xl p-4 text-white">
    <NuxtLink to="/admin" class="text-sm text-blue-400">← Control</NuxtLink>
    <h1 class="mt-2 text-xl font-bold">Veep views & monetization</h1>
    <p class="mb-4 text-sm text-zinc-400">A view counts once watched this long. Engaged views (or watching to the end) count toward monetization; standard views don't.</p>
    <form class="space-y-3" @submit.prevent="save">
      <label v-for="f in fields" :key="f.key" class="flex items-center justify-between gap-3 rounded-lg bg-zinc-900 p-3 text-sm">
        <span>{{ f.label }}</span>
        <input v-model.number="form[f.key]" type="number" min="1" class="w-32 rounded bg-zinc-800 px-2 py-1 text-right">
      </label>
      <button class="w-full rounded-lg bg-blue-600 py-2 font-semibold" :disabled="busy">{{ busy ? 'Saving…' : 'Save' }}</button>
      <p v-if="msg" class="text-sm" :class="ok ? 'text-emerald-400' : 'text-red-400'">{{ msg }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'route-guard'], layout: 'default' })
type Key = 'standard_s' | 'engaged_s' | 'high_s' | 'monetize_views' | 'monetize_days'
const fields: { key: Key, label: string }[] = [
  { key: 'standard_s', label: 'Standard view (seconds)' },
  { key: 'engaged_s', label: 'Engaged view (seconds)' },
  { key: 'high_s', label: 'High-tier engagement (seconds)' },
  { key: 'monetize_views', label: 'Monetization: engaged views needed' },
  { key: 'monetize_days', label: 'Monetization window (days)' }
]
const form = reactive<Record<Key, number>>({ standard_s: 5, engaged_s: 25, high_s: 1800, monetize_views: 200000, monetize_days: 30 })
const busy = ref(false); const msg = ref(''); const ok = ref(false)
onMounted(async () => { Object.assign(form, await $fetch('/api/veep/settings')) })
const save = async () => {
  busy.value = true; msg.value = ''
  try { Object.assign(form, await $fetch('/api/admin/veep-settings', { method: 'PUT', body: { ...form } })); ok.value = true; msg.value = 'Saved' } catch (e: unknown) { ok.value = false; msg.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Save failed' } finally { busy.value = false }
}
</script>
