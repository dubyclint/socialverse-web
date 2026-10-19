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
        <p v-if="waitingForStream" class="player-overlay">Waiting for the broadcaster…</p>
      </div>

      <StreamBattle v-if="matchId" :match-id="matchId" />

      <section class="chat">
        <h3>Live chat</h3>
        <div class="chat-list">
          <p v-for="message in messages" :key="message.id" class="chat-line">
            <strong>{{ message.user?.name || 'Viewer' }}</strong>
            <VerifiedBadge v-if="message.user?.is_verified" :type="message.user.verified_type" :size="12" />
            {{ message.message_text }}
            <button
              v-if="message.user_id !== myId && message.user_id !== stream.creator_id"
              type="button"
              class="gift-line"
              title="Gift this comment (80% goes to the host)"
              @click="giftTarget = { id: message.user_id, name: message.user?.name || 'Viewer' }"
            >🎁</button>
          </p>
        </div>
        <form class="chat-form" @submit.prevent="sendMessage">
          <input v-model="chatInput" type="text" placeholder="Say something…" maxlength="300" />
          <button type="submit" :disabled="!chatInput.trim()">Send</button>
        </form>
      </section>

      <p v-if="stream.broadcast_status !== 'LIVE'" class="ended">This live stream has ended.</p>
      <template v-else-if="stream.creator_id !== myId">
        <h3>Gift the host</h3>
        <GiftPicker target-type="stream" :stream-id="stream.id" :recipient-id="stream.creator_id" @gift-sent="loadChat" />
      </template>

      <div v-if="giftTarget" class="gift-modal" @click.self="giftTarget = null">
        <div class="gift-modal-body">
          <header class="gift-modal-head">
            <strong>Gift {{ giftTarget.name }}</strong>
            <button type="button" @click="giftTarget = null">✕</button>
          </header>
          <p class="split-note">80% of this gift goes to the host and 20% to {{ giftTarget.name }}, after the gift fee.</p>
          <GiftPicker target-type="stream" :stream-id="stream.id" :recipient-id="giftTarget.id" @gift-sent="giftTarget = null; loadChat()" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import StreamBattle from '~/components/streaming/stream-battle.vue'
import GiftPicker from '~/components/financial/gifts/pewgift-picker.vue'
import VerifiedBadge from '~/components/VerifiedBadge.vue'
import { useUserStore } from '~/stores/user'
import { useStreamViewerPeer } from '~/composables/use-stream-webrtc'
import { fetchStreamTransport, useWhepViewer } from '~/composables/use-stream-whip'

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
  user: { name: string, is_verified?: boolean | null, verified_type?: string | null } | null
}

const route = useRoute()
const streamId = computed(() => String(route.params.id))
const matchId = ref<string | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const chatInput = ref('')
const messages = ref<StreamChatRow[]>([])
const giftTarget = ref<{ id: string, name: string } | null>(null)
const userStore = useUserStore()
const myId = computed(() => userStore.userId ?? '')

const { join, leave, remoteStream, waitingForBroadcaster } = useStreamViewerPeer()
const { play: playFromMediaServer, stop: stopMediaServer, remoteStream: providerStream } = useWhepViewer()

const { data, pending } = await useFetch<{ data: StreamRow }>(() => `/api/stream/${streamId.value}`)
const stream = computed(() => data.value?.data ?? null)

const waitingForStream = computed(() =>
  providerStream.value ? false : waitingForBroadcaster.value
)

watch([remoteStream, providerStream], ([mesh, provider]) => {
  const media = provider ?? mesh
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
  try {
    const transport = await fetchStreamTransport(streamId.value)
    if (transport.mode === 'whip') {
      await playFromMediaServer(transport)
    } else {
      join(streamId.value)
    }
  } catch (error) {
    console.error('[Stream] transport negotiation failed', error)
    join(streamId.value)
  }

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
  stopMediaServer()
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
.gift-line { background: none; border: none; cursor: pointer; font-size: 0.9rem; padding: 0 0.25rem; opacity: 0.8; }
.ended { color: #94a3b8; }
.gift-modal { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; }
.gift-modal-body { width: min(520px, 100%); max-height: 85vh; overflow-y: auto; background: #0f172a; border-radius: 16px 16px 0 0; padding: 1rem; }
.gift-modal-head { display: flex; justify-content: space-between; align-items: center; }
.gift-modal-head button { background: none; border: none; color: inherit; font-size: 1.1rem; cursor: pointer; }
.split-note { font-size: 0.85rem; color: #fbbf24; }
</style>
