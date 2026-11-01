<template>
  <main class="live-directory">
    <header class="directory-header">
      <div>
        <h1>Live now</h1>
        <p class="subtitle">Streams and battles happening right now</p>
      </div>
      <div class="header-actions">
        <NuxtLink to="/stream/broadcast" class="btn-primary">Go live</NuxtLink>
        <NuxtLink to="/stream/history" class="btn-secondary">History</NuxtLink>
        <NuxtLink to="/stream/settings" class="btn-secondary">Settings</NuxtLink>
      </div>
    </header>

    <p v-if="pending" class="state">Loading live streams…</p>
    <p v-else-if="error" class="state error">Could not load live streams.</p>
    <p v-else-if="!streams.length" class="state">
      Nobody is live yet. <NuxtLink to="/stream/broadcast">Start the first stream.</NuxtLink>
    </p>

    <div v-else class="stream-grid">
      <NuxtLink v-for="stream in streams" :key="stream.id" :to="`/stream/${stream.id}`" class="stream-card">
        <div class="thumb">
          <span class="live-badge">LIVE</span>
          <span class="viewers">{{ stream.viewers }} watching</span>
        </div>
        <div class="meta">
          <img :src="stream.creatorAvatar || '/default-avatar.svg'" :alt="stream.creatorName || 'Streamer'" class="creator-avatar" />
          <div>
            <h2>{{ stream.title }}</h2>
            <p class="creator">{{ stream.creatorName || 'Unknown' }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LiveStreamCard } from '~/server/api/stream/index.get'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

const { data, pending, error } = await useFetch<{ success: boolean, data: LiveStreamCard[] }>(
  '/api/stream'
)

const streams = computed(() => data.value?.data ?? [])
</script>

<style scoped>
.live-directory {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.directory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #94a3b8;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 0.9rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.btn-primary {
  background: #e11d48;
  color: #fff;
}

.btn-secondary {
  background: #1e293b;
  color: #e2e8f0;
}

.state {
  color: #94a3b8;
}

.state.error {
  color: #f87171;
}

.stream-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.stream-card {
  display: block;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #0f172a;
  border: 1px solid #1e293b;
}

.thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.5rem;
}

.live-badge {
  background: #e11d48;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
}

.viewers {
  background: rgba(15, 23, 42, 0.8);
  color: #e2e8f0;
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
}

.meta {
  display: flex;
  gap: 0.65rem;
  padding: 0.75rem;
}

.creator-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  object-fit: cover;
  flex: 0 0 auto;
  background-color: #334155;
}

.meta h2 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.creator {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: #94a3b8;
}
.live-directory { padding: 0.75rem; }
.directory-header { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.directory-header h1 { margin: 0; font-size: 1.3rem; }
.header-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.btn-primary { background: linear-gradient(90deg, #ef4444, #ec4899) !important; border-radius: 999px !important; font-weight: 700; }
.stream-grid { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; gap: 0.5rem !important; }
.stream-card { position: relative; display: block; aspect-ratio: 9 / 16; border-radius: 12px; overflow: hidden; background: linear-gradient(160deg, #1e293b, #0f172a); text-decoration: none; color: #fff; }
.stream-card .thumb { position: absolute; inset: 0; height: auto !important; background: none !important; display: flex; justify-content: space-between; align-items: flex-start; padding: 0.4rem; }
.stream-card .live-badge { background: #ef4444; font-size: 0.65rem; font-weight: 800; padding: 1px 6px; border-radius: 4px; }
.stream-card .viewers { background: #0008; font-size: 0.68rem; padding: 1px 6px; border-radius: 4px; }
.stream-card .meta { position: absolute; left: 0; right: 0; bottom: 0; padding: 0.5rem; display: flex; gap: 0.4rem; align-items: center; background: linear-gradient(transparent, #000c); }
.stream-card .meta h2 { font-size: 0.8rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stream-card .meta > div { min-width: 0; }
.stream-card .creator { font-size: 0.7rem; margin: 0; opacity: 0.8; }
.stream-card .creator-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid #ef4444; }
</style>
