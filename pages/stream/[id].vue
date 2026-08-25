<template>
  <div class="stream-view">
    <NuxtLink to="/stream" class="back">← All live streams</NuxtLink>

    <div v-if="pending" class="loading">Loading stream…</div>
    <div v-else-if="!stream" class="empty">This stream is not available.</div>

    <template v-else>
      <header>
        <h1>{{ stream.title }}</h1>
        <p>{{ stream.current_viewer_count }} watching · {{ stream.broadcast_status }}</p>
      </header>

      <div class="player">
        <video ref="videoEl" class="player-video" autoplay playsinline />
        <p v-if="waitingForBroadcaster" class="player-overlay">Waiting for the broadcaster…</p>
      </div>

      <StreamBattle v-if="matchId" :match-id="matchId" />

      <section class="chat">
        <h3>Live chat</h3>
        <div class="chat-list">
          <p v-for="message in messages" :key="message.id" class="chat-line">
            <strong>{{ message.user_id.slice(0, 8) }}</strong> {{ message.message_text }}
          </p>
        </div>
        <form class="chat-form" @submit.prevent="sendMessage">
          <input v-model="chatInput" type="text" placeholder="Say something…" maxlength="300" />
          <button type="submit" :disabled="!chatInput.trim()">Send</button>
        </form>
      </section>

      <GiftPicker target-type="stream" :stream-id="stream.id" :recipient-id="stream.creator_id" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import StreamBattle from '~/components/streaming/stream-battle.vue'
import GiftPicker from '~/components/financial/gifts/pewgift-picker.vue'
import { useStreamViewerPeer } from '~/composables/use-stream-webrtc'

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

interface StreamChatRow {
  id: string
  user_id: string
  message_text: string
  created_at: string
}

const route = useRoute()
const streamId = computed(() => String(route.params.id))
const matchId = ref<string | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const chatInput = ref('')
const messages = ref<StreamChatRow[]>([])

const { join, leave, remoteStream, waitingForBroadcaster } = useStreamViewerPeer()

const { data, pending } = await useFetch<{ data: StreamRow }>(() => `/api/stream/${streamId.value}`)
const stream = computed(() => data.value?.data ?? null)

watch(remoteStream, (media) => {
  if (videoEl.value && media) videoEl.value.srcObject = media
})

const loadChat = async () => {
  try {
    const res = await $fetch<{ data: StreamChatRow[] }>(`/api/stream/${streamId.value}/chat?limit=50`)
    messages.value = [...(res.data || [])].reverse()
  } catch (error) {
    console.error('[Stream] chat load failed', error)
  }
}

const sendMessage = async () => {
  const content = chatInput.value.trim()
  if (!content) return
  chatInput.value = ''
  try {
    await $fetch(`/api/stream/${streamId.value}/chat`, { method: 'POST', body: { content } })
    await loadChat()
  } catch (error) {
    console.error('[Stream] chat send failed', error)
  }
}

let chatPoll: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  join(streamId.value)

  try {
    await $fetch(`/api/stream/${streamId.value}/viewers`, { method: 'POST', body: { action: 'join' } })
  } catch (error) {
    console.error('[Stream] viewer join failed', error)
  }

  await loadChat()
  chatPoll = setInterval(loadChat, 4000)

  try {
    const res = await $fetch<{ items: { streamId: string, matchId: string | null }[] }>('/api/discovery/live')
    matchId.value = res.items.find(item => item.streamId === streamId.value)?.matchId ?? null
  } catch (error) {
    console.error('[Stream] match lookup failed', error)
  }
})

onUnmounted(() => {
  leave()
  if (chatPoll) clearInterval(chatPoll)
  void $fetch(`/api/stream/${streamId.value}/viewers`, { method: 'POST', body: { action: 'leave' } }).catch(() => {})
})
</script>

<style scoped>
.stream-view { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; max-width: 900px; margin: 0 auto; }
.back { font-size: 0.85rem; }
.loading, .empty { color: #777; }
.player { position: relative; background: #000; border-radius: 0.75rem; overflow: hidden; aspect-ratio: 16 / 9; }
.player-video { width: 100%; height: 100%; object-fit: contain; }
.player-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #cbd5e1; }
.chat-list { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.25rem; }
.chat-line { margin: 0; font-size: 0.9rem; }
.chat-form { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.chat-form input { flex: 1; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #334155; background: transparent; color: inherit; }
</style>
