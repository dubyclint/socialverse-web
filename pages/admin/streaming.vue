<template>
  <div class="streaming-admin">
    <header class="page-header">
      <h1>Streaming Transport</h1>
      <p>
        Browser mesh keeps every viewer connected directly to the broadcaster, so it only holds up
        for small rooms. Point the app at a WebRTC media server (Cloudflare Stream, Dolby, LiveKit
        Cloud or any WHIP/WHEP endpoint) and the provider fans the stream out to large audiences.
      </p>
    </header>

    <p v-if="error" class="alert error">{{ error }}</p>
    <p v-if="notice" class="alert ok">{{ notice }}</p>

    <form class="config-form" @submit.prevent="save">
      <label>
        <span>Transport</span>
        <select v-model="form.provider">
          <option value="mesh">Browser mesh (development / small rooms)</option>
          <option value="cloudflare">Cloudflare Stream (scales to large audiences)</option>
          <option value="whip">Other WHIP / WHEP media server</option>
        </select>
      </label>

      <p v-if="form.provider === 'cloudflare'" class="hint">
        Each broadcast provisions its own Cloudflare live input automatically. Set
        <code>CLOUDFLARE_ACCOUNT_ID</code> and <code>CLOUDFLARE_STREAM_TOKEN</code> (token needs
        Stream:Edit) in the deployment environment; until they are present streams fall back to mesh.
      </p>

      <template v-if="form.provider === 'whip'">
        <label>
          <span>WHIP ingest URL</span>
          <input
            v-model="form.whip_ingest_url"
            placeholder="https://provider.example/live/{streamKey}/whip"
            required
          >
        </label>
        <label>
          <span>WHEP playback URL</span>
          <input
            v-model="form.whep_playback_url"
            placeholder="https://provider.example/live/{streamKey}/whep"
            required
          >
        </label>
        <label>
          <span>Bearer token (optional)</span>
          <input v-model="form.bearer_token" type="password" autocomplete="off">
        </label>
        <p class="hint">
          <code>{streamKey}</code> and <code>{streamId}</code> are substituted per stream. The
          ingest URL is only ever sent to the broadcaster.
        </p>
      </template>

      <button type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

definePageMeta({
  middleware: ['auth', 'profile-completion'],
  layout: 'default'
})

useHead({ title: 'Streaming Transport' })

interface StreamingConfig {
  provider: 'mesh' | 'whip' | 'cloudflare'
  whip_ingest_url: string
  whep_playback_url: string
  bearer_token: string
}

const form = reactive<StreamingConfig>({
  provider: 'mesh',
  whip_ingest_url: '',
  whep_playback_url: '',
  bearer_token: ''
})

const saving = ref(false)
const error = ref('')
const notice = ref('')

const message = (err: unknown, fallback: string) =>
  (err as { data?: { statusMessage?: string } })?.data?.statusMessage || fallback

onMounted(async () => {
  try {
    const res = await $fetch<{ data: StreamingConfig }>('/api/admin/streaming-config')
    Object.assign(form, res.data)
  } catch (err) {
    error.value = message(err, 'Failed to load streaming configuration')
  }
})

const save = async () => {
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    await $fetch('/api/admin/streaming-config', { method: 'POST', body: { ...form } })
    notice.value = 'Saved — new streams negotiate over this transport.'
  } catch (err) {
    error.value = message(err, 'Failed to save streaming configuration')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.streaming-admin {
  padding: 1.5rem;
  max-width: 720px;
}

.page-header p {
  color: #94a3b8;
  font-size: 0.9rem;
}

.config-form {
  display: grid;
  gap: 0.9rem;
  margin-top: 1.25rem;
}

label {
  display: grid;
  gap: 0.3rem;
  font-size: 0.85rem;
}

input,
select {
  padding: 0.5rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color, #1e293b);
  background: transparent;
  color: inherit;
}

.hint {
  font-size: 0.78rem;
  color: #94a3b8;
}

button {
  justify-self: start;
  padding: 0.55rem 1.1rem;
  border-radius: 0.5rem;
  border: none;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
}

.alert {
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
}

.alert.error {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
}

.alert.ok {
  background: rgba(34, 197, 94, 0.12);
  color: #86efac;
}
</style>
