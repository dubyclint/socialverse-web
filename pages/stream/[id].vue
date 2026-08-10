<template>
  <div class="stream-view">
    <NuxtLink to="/feed" class="back">← Back to feed</NuxtLink>

    <div v-if="pending" class="loading">Loading stream…</div>
    <div v-else-if="!stream" class="empty">This stream is not available.</div>

    <template v-else>
      <header>
        <h1>{{ stream.title }}</h1>
        <p>{{ stream.current_viewer_count }} watching · {{ stream.broadcast_status }}</p>
      </header>

      <StreamBattle v-if="matchId" :match-id="matchId" />

      <GiftPicker target-type="stream" :stream-id="stream.id" :recipient-id="stream.creator_id" />
    </template>
  </div>
</template>

<script setup lang="ts">
import StreamBattle from '~/components/streaming/stream-battle.vue'
import GiftPicker from '~/components/financial/gifts/pewgift-picker.vue'

definePageMeta({
  middleware: ['auth', 'profile-completion'],
  layout: 'default'
})

interface StreamRow {
  id: string
  title: string
  creator_id: string
  current_viewer_count: number
  broadcast_status: string
}

const route = useRoute()
const streamId = computed(() => String(route.params.id))
const matchId = ref<string | null>(null)

const { data, pending } = await useFetch<{ data: StreamRow }>(() => `/api/stream/${streamId.value}`)
const stream = computed(() => data.value?.data ?? null)

onMounted(async () => {
  const res = await $fetch<{ items: { streamId: string; matchId: string | null }[] }>('/api/discovery/live')
  matchId.value = res.items.find((item) => item.streamId === streamId.value)?.matchId ?? null
})
</script>

<style scoped>
.stream-view { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; max-width: 900px; margin: 0 auto; }
.back { font-size: 0.85rem; }
.loading, .empty { color: #777; }
</style>
