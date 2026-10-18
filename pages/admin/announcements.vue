<!-- Global announcements: publish a notice shown to every user; retire or re-activate past ones. -->
<template>
  <div class="sa">
    <header class="sa-top">
      <NuxtLink to="/admin" class="sa-back"><Icon name="arrow-left" size="18" /> Control</NuxtLink>
      <h1>Global announcement</h1>
    </header>
    <form class="sa-card sa-grid" @submit.prevent="publish">
      <input v-model.trim="form.title" class="sa-input" maxlength="100" placeholder="Title" required />
      <textarea v-model.trim="form.message" class="sa-textarea" rows="4" maxlength="1000" placeholder="Message everyone will see" required />
      <div class="sa-row">
        <select v-model="form.level" class="sa-select">
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <input v-model.trim="form.linkUrl" class="sa-input" style="flex:1;min-width:180px" placeholder="Optional link (https://… or /page)" />
        <label class="sa-muted">Ends <input v-model="form.endsAt" type="datetime-local" class="sa-input" style="width:auto" /></label>
      </div>
      <p class="sa-muted">Publishing replaces the current announcement. Each user can dismiss it once.</p>
      <p v-if="error" class="sa-error">{{ error }}</p>
      <p v-if="notice" class="sa-ok">{{ notice }}</p>
      <div><button class="sa-btn" :disabled="busy">{{ busy ? 'Publishing…' : 'Publish to everyone' }}</button></div>
    </form>

    <h3>History</h3>
    <div v-for="a in list" :key="a.id" class="sa-card sa-grid">
      <div class="sa-row">
        <span class="sa-name">{{ a.title }}</span>
        <span :class="['sa-chip', { red: a.level !== 'info' }]">{{ a.level }}</span>
        <span v-if="a.active" class="sa-chip">live</span>
        <span class="sa-muted" style="margin-left:auto">{{ new Date(a.created_at).toLocaleString() }}</span>
      </div>
      <p class="sa-muted">{{ a.message }}</p>
      <div><button class="sa-btn secondary" :disabled="busy" @click="toggle(a)">{{ a.active ? 'Retire' : 'Re-activate' }}</button></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import '~/assets/css/staff-admin.css'

definePageMeta({ middleware: ['auth', 'route-guard'], layout: 'default' })
useHead({ title: 'Global announcement' })

interface Announcement { id: number, title: string, message: string, level: string, active: boolean, created_at: string }

const form = reactive({ title: '', message: '', level: 'info', linkUrl: '', endsAt: '' })
const list = ref<Announcement[]>([])
const busy = ref(false)
const error = ref('')
const notice = ref('')
const msg = (err: unknown, fallback: string) => (err as { data?: { statusMessage?: string } }).data?.statusMessage || fallback

const load = async () => {
  try {
    list.value = (await $fetch<{ announcements: Announcement[] }>('/api/admin/announcements')).announcements
  } catch (err) {
    error.value = msg(err, 'Could not load announcements')
  }
}
const publish = async () => {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await $fetch('/api/admin/announcements', {
      method: 'POST',
      body: { ...form, linkUrl: form.linkUrl || null, endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null }
    })
    notice.value = 'Published. Users will see it within a minute.'
    Object.assign(form, { title: '', message: '', level: 'info', linkUrl: '', endsAt: '' })
    await load()
  } catch (err) {
    error.value = msg(err, 'Could not publish')
  } finally {
    busy.value = false
  }
}
const toggle = async (a: Announcement) => {
  busy.value = true
  try {
    await $fetch('/api/admin/announcements', { method: 'POST', body: { id: a.id, active: !a.active } })
    await load()
  } catch (err) {
    error.value = msg(err, 'Could not update')
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
