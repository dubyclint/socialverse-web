<template>
  <div class="ss">
    <header class="ss-top">
      <NuxtLink to="/admin" class="ss-back"><Icon name="arrow-left" size="18" /> Control</NuxtLink>
      <h1>Statuses</h1>
    </header>
    <div class="ss-card">
      <label for="ss-hours">How long a new status stays visible (hours)</label>
      <input id="ss-hours" v-model.number="hours" type="number" min="1" max="168" step="0.25" />
      <p class="ss-muted">Between 1 and 168 hours (7 days). Applies to statuses posted after you save; existing ones keep their time.</p>
      <button :disabled="busy" @click="save">{{ busy ? 'Saving…' : 'Save' }}</button>
      <p v-if="notice" class="ss-ok">{{ notice }}</p>
      <p v-if="error" class="ss-err">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
definePageMeta({ middleware: ['auth', 'admin-only'], layout: 'default' })
useHead({ title: 'Status settings' })

const hours = ref(24)
const busy = ref(false)
const notice = ref('')
const error = ref('')

onMounted(async () => {
  const s = await $fetch<{ duration_hours: number }>('/api/status/settings').catch(() => null)
  if (s) hours.value = s.duration_hours
})

const save = async () => {
  busy.value = true
  notice.value = ''
  error.value = ''
  try {
    const s = await $fetch<{ duration_hours: number }>('/api/admin/status-settings', { method: 'POST', body: { duration_hours: hours.value } })
    hours.value = s.duration_hours
    notice.value = `New statuses now last ${s.duration_hours} hours.`
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage || 'Could not save'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.ss { max-width: 640px; margin: 0 auto; padding: 0 16px 60px; color: var(--text-primary, #e2e8f0); }
.ss-top { display: flex; align-items: center; gap: 12px; padding: 14px 0; }
.ss-top h1 { margin: 0; font-size: 1.2rem; }
.ss-back { display: inline-flex; align-items: center; gap: 4px; color: inherit; text-decoration: none; }
.ss-card { background: var(--bg-card, #1e293b); border: 1px solid rgba(148,163,184,.2); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.ss-card input { padding: 10px; border-radius: 8px; border: 1px solid rgba(148,163,184,.3); background: transparent; color: inherit; max-width: 160px; }
.ss-card button { align-self: flex-start; background: #2563eb; color: #fff; border: 0; padding: 10px 18px; border-radius: 8px; font-weight: 600; }
.ss-muted { color: #94a3b8; font-size: .85rem; margin: 0; }
.ss-ok { color: #22c55e; margin: 0; }
.ss-err { color: #ef4444; margin: 0; }
</style>
