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
</style>
