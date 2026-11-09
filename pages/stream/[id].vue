<template>
  <div class="live" @dblclick="like">
    <video ref="videoEl" class="live-video" autoplay playsinline :muted="muted" />
    <div class="shade-top" /><div class="shade-bottom" />
    <p v-if="pending" class="center-msg">Loading live…</p>
    <p v-else-if="!stream" class="center-msg">This live is not available. <NuxtLink to="/stream">Back to Live</NuxtLink></p>
    <template v-else>
      <header class="top">
        <div class="host-pill">
          <NuxtLink :to="host?.username ? `/profile/${host.username}` : '#'"><img :src="host?.avatar_url || '/default-avatar.svg'" :alt="host?.name || 'Host'" /></NuxtLink>
          <div class="host-txt">
            <strong>{{ host?.name || 'Host' }} <VerifiedBadge v-if="host?.is_verified" :type="host.verified_type" :size="12" /></strong>
            <small>{{ fmt(room.likes.value) }} likes</small>
          </div>
          <SocialFollowButton v-if="host?.id && host.id !== myId" :user-id="host.id" compact />
        </div>
        <div class="top-right">
          <button class="viewer-stack count-pill" style="padding:3px 8px" @click="viewersOpen = true">
            <img v-for="v in room.topViewers.value.slice(0, 3)" :key="v.id" :src="v.avatar || '/default-avatar.svg'" :alt="v.name" />
            <span style="margin-left:4px">👁 {{ fmt(room.viewerCount.value || stream.current_viewer_count || 0) }}</span>
          </button>
          <button class="x" aria-label="Close" @click="navigateTo('/stream')">✕</button>
        </div>
      </header>
      <div class="badges"><span class="live-tag">LIVE</span><span v-if="stream.title" class="stat-tag">{{ stream.title }}</span></div>
      <StreamBattle v-if="matchId" :match-id="matchId" class="battle" />
      <LiveGiftGame v-if="game" :game="game" :board="board" :winners="winners" closable @close="game = null" />
      <div v-if="onScreen.length" class="badges" style="top:calc(env(safe-area-inset-top) + 80px);left:auto;right:12px;justify-content:flex-end;max-width:60%" @dblclick.stop>
        <button v-for="g in onScreen" :key="g.id" class="stat-tag" style="border:0;color:#fff;cursor:pointer" @click="g.id !== myId ? (giftTarget = { id: g.id, name: g.name }) : null">{{ g.role === 'cohost' ? '⭐' : '🎙️' }} {{ g.name }}{{ g.id !== myId ? ' 🎁' : '' }}</button>
      </div>
      <video v-show="guestMedia" ref="selfEl" class="self-bubble" autoplay playsinline muted />
      <audio ref="returnEl" autoplay />
      <div v-if="myGuest?.status === 'invited'" class="confirm" @dblclick.stop>
        <div>
          <strong>{{ host?.name }} invited you {{ myGuest.role === 'cohost' ? 'to co-host' : 'on screen as a guest' }}</strong>
          <button class="btn" :disabled="guestBusy" @click="guestAction('accept')">Join on screen</button>
          <button class="btn ghost" :disabled="guestBusy" @click="guestAction('decline')">Not now</button>
        </div>
      </div>
      <p v-if="waitingForStream && !isEnded" class="center-msg">Waiting for the host…</p>
      <button v-if="muted && !isEnded && room.remoteStream.value" class="unmute" @click.stop="unmute">🔇 Tap to unmute</button>

      <div class="gift-toasts">
        <div v-for="g in giftToasts" :key="g.key" class="gift-toast">
          <img :src="g.avatar || '/default-avatar.svg'" alt="" />
          <div><strong>{{ g.name }}</strong><small>sent {{ g.gift }}{{ g.qty > 1 ? ` ×${g.qty}` : '' }}</small></div>
          <img v-if="g.icon" :src="g.icon" class="gift-icon" alt="" /><span v-else class="gift-emoji">🎁</span>
        </div>
      </div>
      <div class="hearts"><span v-for="h in hearts" :key="h.id" class="heart" :style="{ left: h.x + 'px', animationDuration: h.d + 'ms' }">{{ h.e }}</span></div>

      <section class="chat-overlay">
        <div v-if="pinned" class="pinned">📌 <strong>{{ pinned.user?.name }}</strong> {{ pinned.message_text }}</div>
        <div ref="chatBox" class="chat-scroll">
          <p v-for="m in messages" :key="m.id" class="chat-line" @click.stop="openMessage(m)">
            <img :src="m.user?.avatar_url || '/default-avatar.svg'" alt="" />
            <span><strong :class="{ host: m.user_id === stream.creator_id }">{{ m.user?.name || 'Viewer' }}</strong>{{ m.message_text }}</span>
          </p>
        </div>
      </section>

      <aside class="actions" @dblclick.stop>
        <button aria-label="Like" @click="like"><span class="ic">❤️</span><small>{{ fmt(room.likes.value) }}</small></button>
        <button v-if="canGift" aria-label="Gift" @click="giftOpen = true"><span class="ic">🎁</span><small>Gift</small></button>
        <button v-if="!isHost && !isEnded && (!myGuest || myGuest.status === 'requested')" :disabled="guestBusy" aria-label="Join on screen" @click="guestAction(myGuest?.status === 'requested' ? 'cancel' : 'request')"><span class="ic">👋</span><small>{{ myGuest?.status === 'requested' ? 'Requested' : 'Join' }}</small></button>
        <button v-if="myGuest?.status === 'active'" class="off" aria-label="Leave seat" @click="guestAction('leave')"><span class="ic">📴</span><small>Leave</small></button>
        <button aria-label="Share" @click="share"><span class="ic">↗</span><small>Share</small></button>
        <NuxtLink :to="`/support?stream=${stream.id}`" aria-label="Report"><span class="ic">⚑</span><small>Report</small></NuxtLink>
      </aside>

      <p v-if="chatError" class="chat-error">{{ chatError }}</p>
      <form class="composer" @submit.prevent="sendMessage" @dblclick.stop>
        <input v-model="chatInput" maxlength="300" placeholder="Add comment…" :disabled="isEnded" />
        <button type="submit" :disabled="!chatInput.trim() || isEnded">Send</button>
      </form>

      <div v-if="isEnded" class="ended">
        <img :src="host?.avatar_url || '/default-avatar.svg'" alt="" />
        <strong>{{ host?.name }}</strong>
        <p>This LIVE has ended.</p>
        <SocialFollowButton v-if="host?.id && host.id !== myId" :user-id="host.id" />
        <div class="btn-row"><NuxtLink to="/stream" class="btn">More LIVEs</NuxtLink><NuxtLink v-if="host?.username" :to="`/profile/${host.username}`" class="btn ghost">View profile</NuxtLink></div>
      </div>
    </template>

    <div v-if="giftOpen && stream" class="live-sheet-bg" @click.self="giftOpen = false" @dblclick.stop>
      <div class="live-sheet">
        <header>Send a gift <button @click="giftOpen = false">✕</button></header>
        <GiftPicker target-type="stream" :stream-id="stream.id" :recipient-id="stream.creator_id" @gift-sent="giftOpen = false" />
      </div>
    </div>
    <div v-if="giftTarget && stream" class="live-sheet-bg" @click.self="giftTarget = null" @dblclick.stop>
      <div class="live-sheet">
        <header>Gift {{ giftTarget.name }} <button @click="giftTarget = null">✕</button></header>
        <p class="note">{{ hostPct }}% of this gift goes to the host and {{ 100 - hostPct }}% to {{ giftTarget.name }}, after the gift fee.</p>
        <GiftPicker target-type="stream" :stream-id="stream.id" :recipient-id="giftTarget.id" @gift-sent="giftTarget = null" />
      </div>
    </div>
    <div v-if="msgSheet && stream" class="live-sheet-bg" @click.self="msgSheet = null" @dblclick.stop>
      <div class="live-sheet">
        <header>{{ msgSheet.user?.name || 'Viewer' }} <button @click="msgSheet = null">✕</button></header>
        <button v-if="msgSheet.user_id !== myId && msgSheet.user_id !== stream.creator_id && canGift" class="opt" @click="giftTarget = { id: msgSheet.user_id, name: msgSheet.user?.name || 'Viewer' }; msgSheet = null">🎁 Gift this comment</button>
        <NuxtLink v-if="msgSheet.user?.username" class="opt" :to="`/profile/${msgSheet.user.username}`">View profile</NuxtLink>
        <template v-if="isHost">
          <button class="opt" @click="moderate(msgSheet.is_pinned ? 'unpin' : 'pin', msgSheet)">{{ msgSheet.is_pinned ? 'Unpin' : 'Pin comment' }}</button>
          <button class="opt danger" @click="moderate('delete', msgSheet)">Delete comment</button>
          <button v-if="msgSheet.user_id !== myId" class="opt danger" @click="moderate('mute', msgSheet)">Mute in this LIVE</button>
        </template>
      </div>
    </div>
    <div v-if="viewersOpen" class="live-sheet-bg" @click.self="viewersOpen = false" @dblclick.stop>
      <div class="live-sheet">
        <header>Viewers ({{ room.viewerCount.value }}) <button @click="viewersOpen = false">✕</button></header>
        <div v-for="v in room.topViewers.value" :key="v.id" class="viewer-row"><img :src="v.avatar || '/default-avatar.svg'" alt="" />{{ v.name }}</div>
        <p v-if="!room.topViewers.value.length" class="note">No viewers yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import StreamBattle from '~/components/streaming/stream-battle.vue'
import GiftPicker from '~/components/financial/gifts/pewgift-picker.vue'
import VerifiedBadge from '~/components/VerifiedBadge.vue'
import { useUserStore } from '~/stores/user'
import { useLiveRoom, type LiveEvent } from '~/composables/use-live-room'
import LiveGiftGame from '~/components/streaming/live-gift-game.vue'
import '~/assets/css/live.css'

definePageMeta({ middleware: ['auth', 'profile-completion'], layout: false })

interface HostCard { id: string, name: string, username: string | null, avatar_url: string | null, is_verified?: boolean | null, verified_type?: string | null }
interface StreamRow { id: string, title: string, creator_id: string, current_viewer_count: number, broadcast_status: string, creator?: HostCard, viewer_gift_host_pct?: number }
interface ChatRow { id: string, user_id: string, message_text: string, is_pinned?: boolean, created_at: string, user: (Partial<HostCard> & { name: string }) | null }

const route = useRoute()
const streamId = computed(() => String(route.params.id))
const userStore = useUserStore()
const myId = computed(() => userStore.userId ?? '')
const room = useLiveRoom()
const videoEl = ref<HTMLVideoElement | null>(null)
const chatBox = ref<HTMLElement | null>(null)
const muted = ref(false)
const messages = ref<ChatRow[]>([])
const chatInput = ref('')
const chatError = ref('')
const giftOpen = ref(false)
const viewersOpen = ref(false)
const giftTarget = ref<{ id: string, name: string } | null>(null)
const msgSheet = ref<ChatRow | null>(null)
const matchId = ref<string | null>(null)
const giftToasts = ref<{ key: number, name: string, avatar: string | null, gift: string, icon: string | null, qty: number }[]>([])
const hearts = ref<{ id: number, x: number, d: number, e: string }[]>([])
let seq = 0
interface Guest { id: string, name: string, username: string | null, avatar_url: string | null, role: 'guest' | 'cohost', status: 'requested' | 'invited' | 'active' }
interface GameEntry { id: string, name: string, avatar_url: string | null, total: number }
const guests = ref<Guest[]>([])
const game = ref<{ status: string, ends_at: string } | null>(null)
const board = ref<GameEntry[]>([])
const winners = ref<GameEntry[]>([])
const selfEl = ref<HTMLVideoElement | null>(null)
const returnEl = ref<HTMLAudioElement | null>(null)
const guestMedia = shallowRef<MediaStream | null>(null)
const guestBusy = ref(false)
const myGuest = computed(() => guests.value.find(g => g.id === myId.value) ?? null)
const onScreen = computed(() => guests.value.filter(g => g.status === 'active'))
const guestAction = async (action: string) => {
  chatError.value = ''
  guestBusy.value = true
  try { await $fetch(`/api/stream/${streamId.value}/guests`, { method: 'POST', body: { action } }) } catch (err) { chatError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not update your seat' } finally { guestBusy.value = false }
}
const startGuest = async () => {
  if (guestMedia.value) return
  try {
    if (await useMediaPermission().prepare(true) === 'blocked') throw new Error('Allow camera and microphone for Viorp in phone Settings → Apps → Viorp → Permissions.')
    const m = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: { echoCancellation: true, noiseSuppression: true } })
    guestMedia.value = m
    await nextTick()
    if (selfEl.value) { selfEl.value.srcObject = m; await selfEl.value.play().catch(() => {}) }
    await room.startGuestUplink(m)
    // You hear the host and other guests through the return channel, not your own delayed voice.
    if (videoEl.value) videoEl.value.muted = true
  } catch (err) {
    chatError.value = err instanceof Error ? err.message : 'Could not start your camera'
    void guestAction('leave')
  }
}
const stopGuest = () => {
  room.stopGuestUplink()
  guestMedia.value?.getTracks().forEach(t => t.stop())
  guestMedia.value = null
  if (videoEl.value && !muted.value) videoEl.value.muted = false
}
watch(() => myGuest.value?.status, (st) => { if (st === 'active') void startGuest(); else if (guestMedia.value) stopGuest() })
watch(() => room.returnAudio.value, async (a) => { if (returnEl.value) { returnEl.value.srcObject = a; await returnEl.value.play().catch(() => {}) } })

const { data, pending } = await useFetch<{ data: StreamRow | null }>(() => `/api/stream/${streamId.value}`)
const stream = computed(() => data.value?.data ?? null)
useHead({ title: () => `${stream.value?.creator?.name ?? 'Live'} · LIVE · Viorp` })
const host = computed(() => stream.value?.creator ?? null)
const hostPct = computed(() => Number(stream.value?.viewer_gift_host_pct ?? 80))
const isHost = computed(() => !!stream.value && stream.value.creator_id === myId.value)
const isEnded = computed(() => room.ended.value || (!!stream.value && stream.value.broadcast_status !== 'LIVE'))
const canGift = computed(() => !!stream.value && !isEnded.value && stream.value.creator_id !== myId.value)
const waitingForStream = computed(() => !room.remoteStream.value)
const pinned = computed(() => messages.value.find(m => m.is_pinned) ?? null)
const fmt = (v: number) => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : String(v ?? 0)

const scrollChat = () => nextTick(() => { if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight })
const addMessage = (m: ChatRow) => {
  if (messages.value.some(x => x.id === m.id)) return
  messages.value = [...messages.value, m].slice(-120)
  scrollChat()
}
const burst = (n: number) => {
  const emojis = ['❤️', '💖', '💕', '💗', '🧡', '💜']
  for (let i = 0; i < Math.min(n, 8); i++) {
    const id = ++seq
    hearts.value.push({ id, x: Math.random() * 40, d: 1800 + Math.random() * 1200, e: emojis[id % emojis.length]! })
    setTimeout(() => { hearts.value = hearts.value.filter(h => h.id !== id) }, 3200)
  }
}

watch(() => room.remoteStream.value, async (media) => {
  const v = videoEl.value
  if (!v) return
  v.srcObject = media
  if (!media) return
  try { v.muted = false; muted.value = false; await v.play() } catch { muted.value = true; v.muted = true; await v.play().catch(() => {}) }
})
const unmute = async () => { muted.value = false; if (videoEl.value) { videoEl.value.muted = false; await videoEl.value.play().catch(() => {}) } }

const loadChat = async () => {
  try {
    const res = await $fetch<{ data: ChatRow[] }>(`/api/stream/${streamId.value}/chat?limit=60`)
    const fresh = [...(res.data || [])].reverse()
    const known = new Set(fresh.map(m => m.id))
    messages.value = [...fresh, ...messages.value.filter(m => !known.has(m.id) && m.created_at > (fresh.at(-1)?.created_at ?? ''))].slice(-120)
    scrollChat()
  } catch (err) { console.error('[Live] chat load failed', err) }
}

const sendMessage = async () => {
  const content = chatInput.value.trim()
  if (!content) return
  chatInput.value = ''
  chatError.value = ''
  try {
    const res = await $fetch<{ data: ChatRow }>(`/api/stream/${streamId.value}/chat`, { method: 'POST', body: { content } })
    if (res.data) addMessage(res.data)
  } catch (err) {
    chatError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not send'
    chatInput.value = content
  }
}

const like = () => { if (isEnded.value) return; room.sendLike(1); burst(1) }
const share = async () => {
  const url = `${location.origin}/stream/${streamId.value}`
  try {
    if (navigator.share) await navigator.share({ title: stream.value?.title || 'Live on Viorp', url })
    else { await navigator.clipboard.writeText(url); chatError.value = 'Link copied' ; setTimeout(() => { chatError.value = '' }, 2000) }
  } catch { /* cancelled */ }
}
const openMessage = (m: ChatRow) => { msgSheet.value = m }
const moderate = async (action: 'pin' | 'unpin' | 'delete' | 'mute', m: ChatRow) => {
  msgSheet.value = null
  try { await $fetch(`/api/stream/${streamId.value}/moderate`, { method: 'POST', body: { action, messageId: m.id, userId: m.user_id } }) } catch (err) { chatError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Action failed' }
}

const onEvent = (e: LiveEvent) => {
  if (e.type === 'guests') guests.value = e.guests as Guest[]
  else if (e.type === 'game') { game.value = e.game; board.value = e.board ?? []; winners.value = e.winners ?? [] }
  else if (e.type === 'chat' && e.message) addMessage(e.message as ChatRow)
  else if (e.type === 'likes' && e.delta) burst(Number(e.delta))
  else if (e.type === 'gift') {
    const key = ++seq
    giftToasts.value = [...giftToasts.value, { key, name: e.sender?.name || 'Someone', avatar: e.sender?.avatar_url ?? null, gift: e.gift?.name || 'a gift', icon: e.gift?.iconUrl ?? null, qty: e.quantity || 1 }].slice(-3)
    setTimeout(() => { giftToasts.value = giftToasts.value.filter(g => g.key !== key) }, 4000)
    burst(6)
  } else if (e.type === 'moderation') {
    if (e.action === 'delete') messages.value = messages.value.filter(m => m.id !== e.messageId)
    else if (e.action === 'pin' || e.action === 'unpin') messages.value = messages.value.map(m => ({ ...m, is_pinned: e.action === 'pin' ? m.id === e.messageId : (m.id === e.messageId ? false : m.is_pinned) }))
    else if (e.action === 'mute' && e.userId === myId.value) chatError.value = 'The host muted you in this LIVE'
  }
}

let poll: ReturnType<typeof setInterval> | null = null
onMounted(async () => {
  room.on(onEvent)
  await loadChat()
  void $fetch<{ guests: Guest[] }>(`/api/stream/${streamId.value}/guests`).then(r => { guests.value = r.guests }).catch(() => {})
  void $fetch<{ game: typeof game.value, board: GameEntry[], winners: GameEntry[] }>(`/api/stream/${streamId.value}/game`).then(r => { game.value = r.game; board.value = r.board; winners.value = r.winners }).catch(() => {})
  if (!stream.value || isEnded.value) return
  try { await room.connect(streamId.value, 'viewer') } catch (err) { console.error('[Live] connect failed', err) }
  $fetch(`/api/stream/${streamId.value}/viewers`, { method: 'POST', body: { action: 'join' } }).catch(() => {})
  poll = setInterval(() => { if (!room.connected.value) void loadChat() }, 15000)
  try {
    const res = await $fetch<{ items: { streamId: string, matchId: string | null }[] }>('/api/discovery/live')
    matchId.value = res.items.find(i => i.streamId === streamId.value)?.matchId ?? null
  } catch { /* no battle */ }
})
onUnmounted(() => {
  if (myGuest.value?.status === 'active' || myGuest.value?.status === 'requested') void guestAction('leave')
  stopGuest()
  if (poll) clearInterval(poll)
  room.disconnect()
  void $fetch(`/api/stream/${streamId.value}/viewers`, { method: 'POST', body: { action: 'leave' } }).catch(() => {})
})
</script>
