<template>
  <section class="vcard">
    <div class="vhead">
      <h3>Verification</h3>
      <VerifiedBadge v-if="state?.verified" :type="state.type" :size="24" />
    </div>
    <p v-if="loading" class="muted">Loading…</p>
    <p v-else-if="state?.verified" class="muted">Verified as {{ label(state.type) }}.</p>
    <p v-else-if="state?.request?.status === 'pending'" class="muted">Your {{ label(state.request.category) }} request is under review.</p>
    <template v-else>
      <p v-if="state?.request?.status === 'rejected'" class="error">
        Last request was not approved<span v-if="state.request.review_note">: {{ state.request.review_note }}</span>
      </p>
      <button v-if="!open" type="button" class="btn" @click="open = true">Request a verification badge</button>
      <form v-else class="vform" @submit.prevent="submit">
        <div class="types">
          <label v-for="t in BADGE_TYPES" :key="t.value" :class="['type', { active: form.category === t.value }]">
            <input v-model="form.category" type="radio" :value="t.value" />
            <VerifiedBadge :type="t.value" :size="20" /> {{ t.label }}
          </label>
        </div>
        <textarea v-model.trim="form.reason" rows="3" maxlength="1000" placeholder="Why should this account be verified? (at least 20 characters)" required />
        <input v-model.trim="form.links" placeholder="Official links (https://…, comma separated)" />
        <label class="muted">Supporting document (ID, registration certificate…)
          <input type="file" accept="image/*,application/pdf" @change="onDoc" />
        </label>
        <p v-if="docName" class="muted">Attached: {{ docName }}</p>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="row">
          <button type="submit" class="btn" :disabled="busy || uploading">{{ busy ? 'Sending…' : 'Send request' }}</button>
          <button type="button" class="btn secondary" @click="open = false">Cancel</button>
        </div>
      </form>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import VerifiedBadge from '~/components/VerifiedBadge.vue'
import { BADGE_TYPES, type BadgeType } from '~/utils/staff-permissions'

const props = defineProps<{ pageId?: string | null }>()

interface State {
  verified: boolean
  type: string | null
  request: { status: string, category: string | null, review_note: string | null } | null
}

const state = ref<State | null>(null)
const loading = ref(true)
const open = ref(false)
const busy = ref(false)
const uploading = ref(false)
const error = ref('')
const docName = ref('')
const docPath = ref('')
const form = reactive<{ category: BadgeType, reason: string, links: string }>({
  category: props.pageId ? 'business' : 'personal', reason: '', links: ''
})

const label = (t: string | null | undefined) => BADGE_TYPES.find(b => b.value === t)?.label.toLowerCase() ?? 'individual'

const load = async () => {
  loading.value = true
  try {
    state.value = await $fetch<State>('/api/verification/status', { query: props.pageId ? { pageId: props.pageId } : {} })
  } catch {
    state.value = null
  } finally {
    loading.value = false
  }
}

const onDoc = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { error.value = 'Document must be under 10MB'; return }
  uploading.value = true
  error.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await $fetch<{ path: string, name: string }>('/api/verification/document', { method: 'POST', body: fd })
    docPath.value = res.path
    docName.value = res.name
  } catch (err) {
    const e = err as { data?: { statusMessage?: string } }
    error.value = e.data?.statusMessage || 'Upload failed'
  } finally {
    uploading.value = false
  }
}

const submit = async () => {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/verification/request', {
      method: 'POST',
      body: {
        pageId: props.pageId ?? null,
        category: form.category,
        reason: form.reason,
        links: form.links.split(',').map(s => s.trim()).filter(Boolean),
        documents: docPath.value ? [{ name: docName.value, path: docPath.value }] : []
      }
    })
    open.value = false
    await load()
  } catch (err) {
    const e = err as { data?: { statusMessage?: string }, statusMessage?: string }
    error.value = e.data?.statusMessage || e.statusMessage || 'Could not send the request'
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.vcard { background: var(--bg-card, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 12px; padding: 14px; margin: 12px 0; }
.vhead { display: flex; align-items: center; gap: 8px; }
.vhead h3 { margin: 0; font-size: 1rem; }
.vform { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.types { display: flex; flex-wrap: wrap; gap: 6px; }
.type { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border: 1px solid var(--border-color, #e5e7eb); border-radius: 999px; cursor: pointer; font-size: .85rem; }
.type input { display: none; }
.type.active { border-color: #7c3aed; background: rgba(124, 58, 237, .08); }
textarea, input:not([type=radio]):not([type=file]) { width: 100%; padding: 8px 10px; border: 1px solid var(--border-color, #e5e7eb); border-radius: 8px; font: inherit; background: transparent; color: inherit; }
.row { display: flex; gap: 8px; }
.btn { padding: 8px 14px; border-radius: 8px; border: 0; background: #7c3aed; color: #fff; cursor: pointer; }
.btn.secondary { background: transparent; color: inherit; border: 1px solid var(--border-color, #e5e7eb); }
.btn:disabled { opacity: .6; }
.muted { color: var(--text-secondary, #6b7280); font-size: .85rem; margin: 6px 0; }
.error { color: #dc2626; font-size: .85rem; margin: 6px 0; }
</style>
