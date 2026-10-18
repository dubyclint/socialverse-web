<!-- Security & audit: staff list and every logged staff action. -->
<template>
  <div class="sa">
    <header class="sa-top">
      <NuxtLink to="/admin" class="sa-back"><Icon name="arrow-left" size="18" /> Control</NuxtLink>
      <h1>Security &amp; audit log</h1>
    </header>
    <p v-if="error" class="sa-error">{{ error }}</p>
    <section class="sa-card">
      <h3 style="margin-top:0">Staff</h3>
      <div v-for="s in staffList" :key="s.user_id" class="sa-row" style="margin-bottom:6px">
        <NuxtLink :to="`/profile/${s.user_id}`" class="sa-name">@{{ s.username }}</NuxtLink>
        <span class="sa-chip">{{ s.role }}</span>
        <span v-if="s.role === 'manager'" class="sa-muted">{{ (s.manager_permissions ?? []).join(', ') || 'no sections granted' }}</span>
      </div>
    </section>
    <div v-for="a in actions" :key="a.id" class="sa-card">
      <div class="sa-row">
        <span class="sa-name">@{{ a.staff?.username ?? 'unknown' }}</span>
        <span class="sa-chip">{{ a.action }}</span>
        <span class="sa-muted">{{ a.target_type }} {{ a.target_id }}</span>
        <span class="sa-muted" style="margin-left:auto">{{ new Date(a.created_at).toLocaleString() }}</span>
      </div>
      <p v-if="a.details && Object.keys(a.details).length" class="sa-muted">{{ JSON.stringify(a.details) }}</p>
    </div>
    <button v-if="more" class="sa-btn secondary" :disabled="loading" @click="load(true)">{{ loading ? 'Loading…' : 'Older' }}</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import '~/assets/css/staff-admin.css'

definePageMeta({ middleware: ['auth', 'route-guard'], layout: 'default' })
useHead({ title: 'Security & audit' })

interface Action { id: string, action: string, target_type: string | null, target_id: string | null, details: Record<string, unknown> | null, created_at: string, staff: { username: string } | null }
interface Staff { user_id: string, username: string, role: string, manager_permissions: string[] | null }

const actions = ref<Action[]>([])
const staffList = ref<Staff[]>([])
const loading = ref(false)
const more = ref(false)
const error = ref('')

const load = async (older = false) => {
  loading.value = true
  try {
    const before = older ? actions.value.at(-1)?.created_at : undefined
    const res = await $fetch<{ actions: Action[], staff: Staff[] }>('/api/admin/audit', { query: before ? { before } : {} })
    actions.value = older ? [...actions.value, ...res.actions] : res.actions
    staffList.value = res.staff
    more.value = res.actions.length === 100
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage || 'Could not load the audit log'
  } finally {
    loading.value = false
  }
}
onMounted(() => load())
</script>
