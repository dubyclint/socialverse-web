<template>
  <div class="live" :class="{ setup: phase === 'setup' }">
    <video ref="videoEl" class="live-video" :class="{ mirror: facing === 'user' && studio.mode.value !== 'clip' && studio.mode.value !== 'screen' && !compositor.output.value }" autoplay playsinline muted />
    <div class="shade-top" /><div class="shade-bottom" />
    <p v-if="camError" class="center-msg">{{ camError }} <button class="btn ghost" @click="startCamera">Retry</button></p>

    <template v-if="phase === 'setup'">
      <header class="top">
        <button class="x" aria-label="Back" @click="navigateTo('/stream')">←</button>
        <div class="top-right">
          <NuxtLink to="/stream/history" class="chip">History</NuxtLink>
          <NuxtLink to="/stream/settings" class="chip">Settings</NuxtLink>
        </div>
      </header>
      <div v-if="liveAccess?.mode === 'trial'" class="trial">
        Free live trial: <strong>{{ trialClock }}</strong> left · <NuxtLink to="/stream/requirements">Requirements</NuxtLink>
      </div>
    </template>

    <template v-if="phase === 'live' || phase === 'ending'">
      <header class="top">
        <div class="host-pill">
          <img :src="me.avatar || '/default-avatar.svg'" alt="" />
          <div class="host-txt"><strong>{{ me.name }}</strong><small>{{ clock }}</small></div>
        </div>
        <div class="top-right">
          <button class="viewer-stack count-pill" style="padding:3px 8px" @click="viewersOpen = true">
            <img v-for="v in room.topViewers.value.slice(0, 3)" :key="v.id" :src="v.avatar || '/default-avatar.svg'" :alt="v.name" />
            <span style="margin-left:4px">👁 {{ room.viewerCount.value }}</span>
          </button>
          <button class="x" aria-label="End LIVE" @click="phase = 'ending'">✕</button>
        </div>
      </header>
      <div class="badges">
        <span class="live-tag">LIVE</span>
        <span class="stat-tag">❤️ {{ fmt(room.likes.value) }}</span>
        <span class="stat-tag">🎁 {{ giftTotal }} PEW</span>
        <span class="stat-tag">{{ stats.bitrate }} kbps · {{ stats.fps }} fps</span>
        <button v-if="studio.mode.value === 'clip'" class="stat-tag" style="border:0;color:#fff;cursor:pointer" @click="studio.toggleClip()">{{ studio.clipPlaying.value ? '⏸ Pause clip' : '▶ Play clip' }}</button>
        <button v-if="studio.mode.value === 'clip'" class="stat-tag" style="border:0;color:#fff;cursor:pointer" @click="studio.toggleClipSound()">{{ studio.clipMuted.value ? '🔇 Clip' : '🔊 Clip' }}</button>
        <span v-if="trialEndsAt" class="stat-tag" style="background:#f59e0bcc;color:#111">Trial {{ trialClock }}</span>
      </div>
      <div class="gift-toasts">
        <div v-for="g in giftToasts" :key="g.key" class="gift-toast">
          <img :src="g.avatar || '/default-avatar.svg'" alt="" />
          <div><strong>{{ g.name }}</strong><small>sent {{ g.gift }}{{ g.qty > 1 ? ` ×${g.qty}` : '' }} · {{ g.cost }} PEW</small></div>
          <img v-if="g.icon" :src="g.icon" class="gift-icon" alt="" /><span v-else class="gift-emoji">🎁</span>
        </div>
      </div>
      <div class="hearts"><span v-for="h in hearts" :key="h.id" class="heart" :style="{ left: h.x + 'px', animationDuration: h.d + 'ms' }">{{ h.e }}</span></div>
      <section class="chat-overlay">
        <div v-if="pinned" class="pinned">📌 <strong>{{ pinned.user?.name }}</strong> {{ pinned.message_text }}</div>
        <div ref="chatBox" class="chat-scroll">
          <p v-for="m in messages" :key="m.id" class="chat-line" @click="msgSheet = m">
            <img :src="m.user?.avatar_url || '/default-avatar.svg'" alt="" />
            <span><strong :class="{ host: m.user_id === myId }">{{ m.user?.name || 'Viewer' }}</strong>{{ m.message_text }}</span>
          </p>
          <p v-if="!messages.length" class="chat-line" style="cursor:default">Comments from viewers appear here.</p>
        </div>
      </section>
      <p v-if="error" class="chat-error">{{ error }}</p>
      <form class="composer" @submit.prevent="sendChat">
        <input v-model="chatInput" maxlength="300" placeholder="Say something to your viewers…" />
        <button type="submit" :disabled="!chatInput.trim()">Send</button>
      </form>
      <div v-if="phase === 'ending'" class="confirm">
        <div>
          <strong>End your LIVE?</strong>
          <button class="btn" :disabled="busy" @click="endLive">End LIVE</button>
          <button class="btn ghost" @click="phase = 'live'">Keep going</button>
        </div>
      </div>
    </template>

    <aside v-if="phase !== 'summary'" class="actions">
      <button :disabled="!canFlip" aria-label="Flip camera" @click="flip"><span class="ic">🔄</span><small>Flip</small></button>
      <button :class="{ off: !micOn }" aria-label="Microphone" @click="toggleMic"><span class="ic">{{ micOn ? '🎙️' : '🔇' }}</span><small>Mic</small></button>
      <button :class="{ off: !camOn }" aria-label="Camera" @click="toggleCam"><span class="ic">{{ camOn ? '📷' : '🚫' }}</span><small>Camera</small></button>
      <button v-if="torchSupported" :class="{ off: torchOn }" aria-label="Flash" @click="toggleTorch"><span class="ic">🔦</span><small>Flash</small></button>
      <button :class="{ off: studio.mode.value !== 'none' }" aria-label="Background Studio" @click="studioOpen = true"><span class="ic">🎨</span><small>Studio</small></button>
      <button v-if="phase === 'live'" aria-label="Guests" @click="guestsOpen = true"><span class="ic">👥</span><small>Guests{{ requests.length ? ` (${requests.length})` : '' }}</small></button>
      <button v-if="phase === 'live'" aria-label="Gift game" @click="gameOpen = true"><span class="ic">🏆</span><small>Game</small></button>
    </aside>

    <LiveGiftGame v-if="game && (phase === 'live' || phase === 'ending')" :game="game" :board="board" :winners="winners" closable @close="game = null" />

    <div v-if="guestsOpen" class="live-sheet-bg" @click.self="guestsOpen = false">
      <div class="live-sheet">
        <header>Guests &amp; co-hosts <button @click="guestsOpen = false">✕</button></header>
        <p class="note" style="color:#cbd5e1">Multi-guest: {{ seatCount('guest') }}/8 viewers on screen · Co-host: {{ seatCount('cohost') + 1 }}/4 creators on screen.</p>
        <template v-if="requests.length">
          <strong style="font-size:13px">Requests to join</strong>
          <div v-for="g in requests" :key="g.id" class="viewer-row"><img :src="g.avatar_url || '/default-avatar.svg'" alt="" /><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">{{ g.name }}</span>
            <button class="chip" style="background:#16a34a;border:0;color:#fff;border-radius:999px;padding:4px 10px" @click="guestAction('approve', g.id)">Approve</button>
            <button class="chip" style="background:#334155;border:0;color:#fff;border-radius:999px;padding:4px 10px" @click="guestAction('remove', g.id)">Decline</button></div>
        </template>
        <template v-if="activeGuests.length">
          <strong style="font-size:13px">On screen</strong>
          <div v-for="g in activeGuests" :key="g.id" class="viewer-row"><img :src="g.avatar_url || '/default-avatar.svg'" alt="" /><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">{{ g.name }} · {{ g.role === 'cohost' ? 'Co-host' : 'Guest' }}{{ room.guestStreams.value.some(s => s.userId === g.id) ? '' : ' (connecting…)' }}</span>
            <button class="chip" style="background:#b91c1c;border:0;color:#fff;border-radius:999px;padding:4px 10px" @click="guestAction('remove', g.id)">Remove</button></div>
        </template>
        <template v-if="invited.length">
          <strong style="font-size:13px">Invited</strong>
          <div v-for="g in invited" :key="g.id" class="viewer-row"><img :src="g.avatar_url || '/default-avatar.svg'" alt="" /><span style="flex:1">{{ g.name }} · {{ g.role === 'cohost' ? 'Co-host' : 'Guest' }}</span>
            <button class="chip" style="background:#334155;border:0;color:#fff;border-radius:999px;padding:4px 10px" @click="guestAction('remove', g.id)">Cancel</button></div>
        </template>
        <strong style="font-size:13px">Invite from viewers</strong>
        <div v-for="v in invitable" :key="v.id" class="viewer-row"><img :src="v.avatar || '/default-avatar.svg'" alt="" /><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">{{ v.name }}</span>
          <button class="chip" style="background:#2563eb;border:0;color:#fff;border-radius:999px;padding:4px 10px" @click="guestAction('invite', v.id, 'guest')">Guest</button>
          <button class="chip" style="background:#7c3aed;border:0;color:#fff;border-radius:999px;padding:4px 10px" @click="guestAction('invite', v.id, 'cohost')">Co-host</button></div>
        <p v-if="!invitable.length" class="note">No other viewers to invite yet.</p>
        <p v-if="error" class="note" style="color:#f87171">{{ error }}</p>
      </div>
    </div>

    <div v-if="gameOpen" class="live-sheet-bg" @click.self="gameOpen = false">
      <div class="live-sheet">
        <header>Top gift getter game <button @click="gameOpen = false">✕</button></header>
        <p class="note" style="color:#cbd5e1">Whoever receives the most gift value in this LIVE (you or your guests) before the timer ends wins. Ties share the win.</p>
        <template v-if="game?.status === 'live'">
          <button class="opt" @click="gameAction('end')">End now and show winner</button>
          <button class="opt danger" @click="gameAction('cancel')">Cancel game</button>
        </template>
        <template v-else>
          <button v-for="d in [60, 180, 300, 600]" :key="d" class="opt" @click="gameAction('start', d)">Start · {{ d / 60 }} min</button>
        </template>
        <p v-if="error" class="note" style="color:#f87171">{{ error }}</p>
      </div>
    </div>

    <div v-if="studioOpen" class="live-sheet-bg" @click.self="studioOpen = false">
      <div class="live-sheet">
        <header>Background Studio <button @click="studioOpen = false">✕</button></header>
        <p class="note" style="color:#cbd5e1">Processed on your device. Viewers see the new background.</p>
        <label class="opt">🖼️ Upload photo<input type="file" accept="image/*" hidden @change="applyStudio('image', $event)" /></label>
        <label class="opt">🎬 Upload video<input type="file" accept="video/*" hidden @change="applyStudio('video', $event)" /></label>
        <label class="opt">📽️ Show a clip (you talk from a bubble)<input type="file" accept="video/*" hidden @change="applyStudio('clip', $event)" /></label>
        <button v-if="canShareScreen" class="opt" @click="applyStudio('screen')">🖥️ Share screen (you talk from a bubble)</button>
        <button class="opt" :style="studio.mode.value === 'blur' ? 'color:#60a5fa' : ''" @click="applyStudio('blur')">🌫️ Blur background</button>
        <button class="opt" :style="studio.mode.value === 'none' ? 'color:#60a5fa' : ''" @click="applyStudio('none')">↺ Original</button>
        <p v-if="studio.loading.value" class="note">Loading Background Studio…</p>
        <p v-if="studio.error.value" class="note" style="color:#f87171">{{ studio.error.value }}</p>
      </div>
    </div>

    <div v-if="phase === 'setup'" class="setup-panel">
      <input v-model="title" maxlength="80" placeholder="Add a title to your LIVE" />
      <label>Video quality
        <select v-model="quality" @change="startCamera">
          <option value="480">480p · saves data</option>
          <option value="720">720p HD</option>
          <option value="1080">1080p Full HD</option>
        </select>
      </label>
      <button class="go-live" :disabled="!media || busy" @click="goLive">{{ busy ? 'Starting…' : 'Go LIVE' }}</button>
      <p v-if="error" class="err">{{ error }}</p>
    </div>

    <div v-if="phase === 'countdown'" class="countdown">{{ countdown }}</div>

    <div v-if="phase === 'summary' && summary" class="summary">
      <img :src="me.avatar || '/default-avatar.svg'" alt="" />
      <strong>Your LIVE has ended</strong>
      <div class="summary-grid">
        <div><strong>{{ summary.duration }}</strong><small>Duration</small></div>
        <div><strong>{{ summary.peak }}</strong><small>Peak viewers</small></div>
        <div><strong>{{ fmt(summary.likes) }}</strong><small>Likes</small></div>
        <div><strong>{{ summary.gifts }}</strong><small>Gifts (PEW)</small></div>
        <div><strong>{{ summary.giftCount }}</strong><small>Gifts sent</small></div>
        <div><strong>{{ summary.comments }}</strong><small>Comments</small></div>
      </div>
      <div class="btn-row">
        <button class="btn" @click="resetToSetup">Go LIVE again</button>
        <NuxtLink to="/stream/history" class="btn ghost">History</NuxtLink>
        <NuxtLink to="/stream" class="btn ghost">Done</NuxtLink>
      </div>
    </div>

    <div v-if="msgSheet" class="live-sheet-bg" @click.self="msgSheet = null">
      <div class="live-sheet">
        <header>{{ msgSheet.user?.name || 'Viewer' }} <button @click="msgSheet = null">✕</button></header>
        <p class="note" style="color:#cbd5e1">{{ msgSheet.message_text }}</p>
        <button class="opt" @click="moderate(msgSheet.is_pinned ? 'unpin' : 'pin', msgSheet)">{{ msgSheet.is_pinned ? 'Unpin' : '📌 Pin comment' }}</button>
        <button class="opt danger" @click="moderate('delete', msgSheet)">Delete comment</button>
        <button v-if="msgSheet.user_id !== myId" class="opt danger" @click="moderate('mute', msgSheet)">Mute in this LIVE</button>
        <button v-if="msgSheet.user_id !== myId" class="opt" @click="moderate('unmute', msgSheet)">Unmute</button>
      </div>
    </div>
    <div v-if="viewersOpen" class="live-sheet-bg" @click.self="viewersOpen = false">
      <div class="live-sheet">
        <header>Viewers ({{ room.viewerCount.value }}) <button @click="viewersOpen = false">✕</button></header>
        <div v-for="v in room.topViewers.value" :key="v.id" class="viewer-row"><img :src="v.avatar || '/default-avatar.svg'" alt="" />{{ v.name }}</div>
        <p v-if="!room.topViewers.value.length" class="note">No viewers yet. Share your LIVE so people can join.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useUserStore } from '~/stores/user'
import { useLiveRoom, type LiveEvent } from '~/composables/use-live-room'
import { useBackgroundStudio, type StudioMode } from '~/composables/use-background-studio'
import { useLiveCompositor } from '~/composables/use-live-compositor'
import LiveGiftGame from '~/components/streaming/live-gift-game.vue'
import '~/assets/css/live.css'

definePageMeta({ middleware: ['auth', 'profile-completion', 'language-check', 'status-middleware'], layout: false })
useHead({ title: 'Go LIVE · Viorp' })

interface ChatRow { id: string, user_id: string, message_text: string, is_pinned?: boolean, created_at: string, user: { name: string, avatar_url?: string | null } | null }
type Phase = 'setup' | 'countdown' | 'live' | 'ending' | 'summary'

const userStore = useUserStore()
const myId = computed(() => userStore.userId ?? '')
const me = computed(() => {
  const p = (userStore.profile ?? {}) as { display_name?: string, full_name?: string, username?: string, avatar_url?: string }
  return { name: p.display_name || p.full_name || p.username || 'You', avatar: p.avatar_url || null, username: p.username || '' }
})
const room = useLiveRoom()
const studio = useBackgroundStudio()
const studioOpen = ref(false)
const compositor = useLiveCompositor()
interface Guest { id: string, name: string, username: string | null, avatar_url: string | null, role: 'guest' | 'cohost', status: 'requested' | 'invited' | 'active' }
interface GameEntry { id: string, name: string, avatar_url: string | null, total: number }
const guests = ref<Guest[]>([])
const guestsOpen = ref(false)
const gameOpen = ref(false)
const game = ref<{ status: string, ends_at: string } | null>(null)
const board = ref<GameEntry[]>([])
const winners = ref<GameEntry[]>([])
const activeGuests = computed(() => guests.value.filter(g => g.status === 'active'))
const requests = computed(() => guests.value.filter(g => g.status === 'requested'))
const invited = computed(() => guests.value.filter(g => g.status === 'invited'))
const seatCount = (role: 'guest' | 'cohost') => activeGuests.value.filter(g => g.role === role).length
const invitable = computed(() => room.topViewers.value.filter(v => !guests.value.some(g => g.id === v.id)))
room.setGuestPolicy(uid => activeGuests.value.some(g => g.id === uid), uid => compositor.returnTrackFor(uid))
const baseStream = () => studio.output.value ?? media.value
const isLive = () => phase.value === 'live' || phase.value === 'ending'
const showStream = async (out: MediaStream) => {
  if (videoEl.value && videoEl.value.srcObject !== out) { videoEl.value.srcObject = out; await videoEl.value.play().catch(() => {}) }
}
const recompose = async () => {
  const base = baseStream()
  if (!base || !isLive()) return
  const gs = room.guestStreams.value.filter(g => activeGuests.value.some(a => a.id === g.userId))
  let out: MediaStream = base
  if (gs.length) {
    out = compositor.update([{ key: 'host', name: me.value.name, stream: base }, ...gs.map(g => ({ key: g.userId, name: activeGuests.value.find(a => a.id === g.userId)?.name || 'Guest', stream: g.stream }))]) ?? base
    await room.refreshReturnAudio()
  } else if (compositor.output.value) compositor.stop()
  await showStream(out)
  await room.replaceStream(out)
}
watch([() => room.guestStreams.value, activeGuests], () => { void recompose() })
const guestAction = async (action: string, userId: string, role?: 'guest' | 'cohost') => {
  error.value = ''
  try { await $fetch(`/api/stream/${streamId.value}/guests`, { method: 'POST', body: { action, userId, role } }) } catch (e) { error.value = msgOf(e, 'Could not update guests') }
}
const gameAction = async (action: 'start' | 'end' | 'cancel', durationSeconds?: number) => {
  error.value = ''
  try {
    const r = await $fetch<{ game: typeof game.value, board: GameEntry[], winners: GameEntry[] }>(`/api/stream/${streamId.value}/game`, { method: 'POST', body: { action, durationSeconds } })
    game.value = r.game; board.value = r.board; winners.value = r.winners
    gameOpen.value = false
  } catch (e) { error.value = msgOf(e, 'Gift game failed') }
}
const canShareScreen = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getDisplayMedia) && !/Android|iPhone|iPad/i.test(navigator.userAgent)
studio.whenReverted(() => { void applyStudio('none') })
const videoEl = ref<HTMLVideoElement | null>(null)
const chatBox = ref<HTMLElement | null>(null)
const media = shallowRef<MediaStream | null>(null)
const facing = ref<'user' | 'environment'>('user')
const canFlip = ref(true)
const micOn = ref(true)
const camOn = ref(true)
const torchOn = ref(false)
const torchSupported = ref(false)
const quality = ref<'480' | '720' | '1080'>('720')
const title = ref('')
const phase = ref<Phase>('setup')
const countdown = ref(3)
const busy = ref(false)
const error = ref('')
const camError = ref('')
const streamId = ref<string | null>(null)
const startedAt = ref(0)
const now = ref(Date.now())
const stats = ref({ bitrate: 0, fps: 0 })
const messages = ref<ChatRow[]>([])
const chatInput = ref('')
const msgSheet = ref<ChatRow | null>(null)
const viewersOpen = ref(false)
const giftTotal = ref(0)
const giftCount = ref(0)
const peak = ref(0)
const giftToasts = ref<{ key: number, name: string, avatar: string | null, gift: string, icon: string | null, qty: number, cost: number }[]>([])
const hearts = ref<{ id: number, x: number, d: number, e: string }[]>([])
const summary = ref<{ duration: string, peak: number, likes: number, gifts: number, giftCount: number, comments: number } | null>(null)
const liveAccess = ref<{ mode: string, canGoLive: boolean, trialSecondsLeft: number } | null>(null)
const trialEndsAt = ref<number | null>(null)
let seq = 0
let tick: ReturnType<typeof setInterval> | null = null
let statsTimer: ReturnType<typeof setInterval> | null = null

const fmt = (v: number) => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : String(v ?? 0)
const mmss = (s: number) => `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ':' : ''}${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const clock = computed(() => startedAt.value ? mmss((now.value - startedAt.value) / 1000) : '00:00')
const trialSecondsShown = computed(() => trialEndsAt.value ? Math.max(0, Math.round((trialEndsAt.value - now.value) / 1000)) : (liveAccess.value?.trialSecondsLeft ?? 0))
const trialClock = computed(() => mmss(trialSecondsShown.value))
const pinned = computed(() => messages.value.find(m => m.is_pinned) ?? null)
const msgOf = (e: unknown, fallback: string) => (e as { data?: { statusMessage?: string }, message?: string })?.data?.statusMessage || (e as Error)?.message || fallback

const DIMS = { 480: [854, 480], 720: [1280, 720], 1080: [1920, 1080] } as const
const startCamera = async () => {
  camError.value = ''
  const [w, h] = DIMS[Number(quality.value) as 480 | 720 | 1080]
  try {
    const next = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing.value, width: { ideal: w }, height: { ideal: h }, frameRate: { ideal: 30 } },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    })
    next.getAudioTracks().forEach(t => { t.enabled = micOn.value })
    next.getVideoTracks().forEach(t => { t.enabled = camOn.value })
    const vt = next.getVideoTracks()[0]
    torchSupported.value = Boolean((vt?.getCapabilities?.() as { torch?: boolean } | undefined)?.torch)
    torchOn.value = false
    const old = media.value
    media.value = next
    await studio.setSource(next)
    const shown = studio.output.value ?? next
    if (compositor.output.value && isLive()) await recompose()
    else {
      if (videoEl.value) { videoEl.value.srcObject = shown; await videoEl.value.play().catch(() => {}) }
      if (isLive()) await room.replaceStream(shown)
    }
    old?.getTracks().forEach(t => t.stop())
    const cams = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput')
    canFlip.value = cams.length > 1
  } catch (e) {
    camError.value = (e as DOMException)?.name === 'NotAllowedError' ? 'Allow camera and microphone access to go LIVE.' : 'Could not start the camera.'
  }
}
const flip = () => { facing.value = facing.value === 'user' ? 'environment' : 'user'; void startCamera() }
const toggleMic = () => { micOn.value = !micOn.value; media.value?.getAudioTracks().forEach(t => { t.enabled = micOn.value }) }
const toggleCam = () => { camOn.value = !camOn.value; media.value?.getVideoTracks().forEach(t => { t.enabled = camOn.value }) }
const toggleTorch = async () => {
  const t = media.value?.getVideoTracks()[0]
  if (!t) return
  try { await t.applyConstraints({ advanced: [{ torch: !torchOn.value } as MediaTrackConstraintSet] }); torchOn.value = !torchOn.value } catch { torchSupported.value = false }
}

const scrollChat = () => nextTick(() => { if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight })
const addMessage = (m: ChatRow) => {
  if (messages.value.some(x => x.id === m.id)) return
  messages.value = [...messages.value, m].slice(-150)
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
room.on((e: LiveEvent) => {
  if (e.type === 'chat' && e.message) addMessage(e.message as ChatRow)
  else if (e.type === 'likes' && e.delta) burst(Number(e.delta))
  else if (e.type === 'viewers') peak.value = Math.max(peak.value, Number(e.count) || 0)
  else if (e.type === 'guests') guests.value = e.guests as Guest[]
  else if (e.type === 'game') { game.value = e.game; board.value = e.board ?? []; winners.value = e.winners ?? [] }
  else if (e.type === 'replaced') { error.value = 'This LIVE was opened on another device.'; room.disconnect() }
  else if (e.type === 'gift') {
    if (e.recipientId === myId.value) { giftTotal.value = Math.round((giftTotal.value + Number(e.totalCost || 0)) * 100) / 100; giftCount.value += Number(e.quantity || 1) }
    const key = ++seq
    giftToasts.value = [...giftToasts.value, { key, name: e.sender?.name || 'Someone', avatar: e.sender?.avatar_url ?? null, gift: e.gift?.name || 'a gift', icon: e.gift?.iconUrl ?? null, qty: e.quantity || 1, cost: Number(e.totalCost || 0) }].slice(-3)
    setTimeout(() => { giftToasts.value = giftToasts.value.filter(g => g.key !== key) }, 4500)
    burst(6)
  } else if (e.type === 'moderation') {
    if (e.action === 'delete') messages.value = messages.value.filter(m => m.id !== e.messageId)
    else if (e.action === 'pin' || e.action === 'unpin') messages.value = messages.value.map(m => ({ ...m, is_pinned: e.action === 'pin' ? m.id === e.messageId : (m.id === e.messageId ? false : m.is_pinned) }))
  }
})

const goLive = async () => {
  if (!media.value) return
  error.value = ''
  busy.value = true
  phase.value = 'countdown'
  for (countdown.value = 3; countdown.value > 0; countdown.value--) await new Promise(r => setTimeout(r, 1000))
  try {
    const defaultTitle = await $fetch<{ data: { defaultTitle?: string } }>('/api/stream/settings').then(r => r.data.defaultTitle).catch(() => '')
    const created = await $fetch<{ data: { id: string } }>('/api/stream', { method: 'POST', body: { action: 'create', title: title.value.trim() || defaultTitle || `${me.value.name} is LIVE` } })
    streamId.value = created.data.id
    const started = await $fetch<{ access?: { mode: string, trialSecondsLeft: number | null } }>('/api/stream', { method: 'POST', body: { action: 'start', stream_id: created.data.id } })
    trialEndsAt.value = started.access?.mode === 'trial' && started.access.trialSecondsLeft ? Date.now() + started.access.trialSecondsLeft * 1000 : null
    await room.connect(created.data.id, 'broadcaster', studio.output.value ?? media.value)
    startedAt.value = Date.now()
    messages.value = []
    giftTotal.value = 0; giftCount.value = 0; peak.value = 0
    phase.value = 'live'
    statsTimer = setInterval(async () => { stats.value = await room.sampleStats() }, 2000)
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    if (status === 403) { await navigateTo('/stream/requirements'); return }
    error.value = msgOf(e, 'Could not start your LIVE')
    if (streamId.value) await $fetch('/api/stream', { method: 'POST', body: { action: 'end', stream_id: streamId.value } }).catch(() => {})
    room.disconnect()
    streamId.value = null
    phase.value = 'setup'
  } finally { busy.value = false }
}

const endLive = async () => {
  busy.value = true
  const id = streamId.value
  const duration = startedAt.value ? mmss((Date.now() - startedAt.value) / 1000) : '00:00'
  const likes = room.likes.value
  try { if (id) await $fetch('/api/stream', { method: 'POST', body: { action: 'end', stream_id: id } }) } catch (e) { error.value = msgOf(e, 'Could not end the LIVE') }
  if (statsTimer) clearInterval(statsTimer)
  room.disconnect()
  compositor.stop()
  guests.value = []
  game.value = null
  summary.value = { duration, peak: peak.value, likes, gifts: giftTotal.value, giftCount: giftCount.value, comments: messages.value.length }
  if (id) {
    const s = await $fetch<{ data?: { totalGiftValue?: number, chatMessageCount?: number, peakViewerCount?: number } }>(`/api/stream/${id}/stats`).catch(() => null)
    if (s?.data?.totalGiftValue != null) summary.value.gifts = Number(s.data.totalGiftValue)
    if (s?.data?.chatMessageCount != null) summary.value.comments = Number(s.data.chatMessageCount)
    if (s?.data?.peakViewerCount) summary.value.peak = Math.max(summary.value.peak, Number(s.data.peakViewerCount))
  }
  streamId.value = null
  startedAt.value = 0
  trialEndsAt.value = null
  phase.value = 'summary'
  busy.value = false
}
const applyStudio = async (next: StudioMode, ev?: Event) => {
  const input = ev?.target as HTMLInputElement | undefined
  const file = input?.files?.[0]
  if (input) input.value = ''
  if ((next === 'image' || next === 'video' || next === 'clip') && !file) return
  const out = await studio.setBackground(next, file)
  const shown = out ?? media.value
  if (!shown) return
  if (compositor.output.value && isLive()) await recompose()
  else {
    if (videoEl.value) { videoEl.value.srcObject = shown; await videoEl.value.play().catch(() => {}) }
    if (isLive()) await room.replaceStream(shown)
  }
  if (!studio.error.value) studioOpen.value = false
}
const resetToSetup = () => { summary.value = null; phase.value = 'setup'; void startCamera() }

const sendChat = async () => {
  const content = chatInput.value.trim()
  if (!content || !streamId.value) return
  chatInput.value = ''
  try {
    const r = await $fetch<{ data: ChatRow }>(`/api/stream/${streamId.value}/chat`, { method: 'POST', body: { content } })
    if (r.data) addMessage(r.data)
  } catch (e) { error.value = msgOf(e, 'Could not send'); chatInput.value = content }
}
const moderate = async (action: 'pin' | 'unpin' | 'delete' | 'mute' | 'unmute', m: ChatRow) => {
  msgSheet.value = null
  if (!streamId.value) return
  try { await $fetch(`/api/stream/${streamId.value}/moderate`, { method: 'POST', body: { action, messageId: m.id, userId: m.user_id } }) } catch (e) { error.value = msgOf(e, 'Action failed') }
}

const endOnUnload = () => {
  if (!streamId.value) return
  navigator.sendBeacon?.('/api/stream', new Blob([JSON.stringify({ action: 'end', stream_id: streamId.value })], { type: 'application/json' }))
}

onMounted(async () => {
  if (!userStore.profile) await userStore.fetchProfile?.()
  try {
    const res = await $fetch<{ data: { mode: string, canGoLive: boolean, trialSecondsLeft: number } }>('/api/stream/live-access')
    liveAccess.value = res.data
    if (!res.data.canGoLive) { await navigateTo('/stream/requirements', { replace: true }); return }
  } catch (e) { console.error('[Go LIVE] access check failed', e) }
  await startCamera()
  window.addEventListener('pagehide', endOnUnload)
  tick = setInterval(() => {
    now.value = Date.now()
    if (trialEndsAt.value && now.value >= trialEndsAt.value && streamId.value) {
      trialEndsAt.value = null
      error.value = 'Your free live trial has ended.'
      void endLive().then(() => { void navigateTo('/stream/requirements') })
    }
  }, 1000)
})
onBeforeUnmount(() => {
  window.removeEventListener('pagehide', endOnUnload)
  if (tick) clearInterval(tick)
  if (statsTimer) clearInterval(statsTimer)
  if (streamId.value) void $fetch('/api/stream', { method: 'POST', body: { action: 'end', stream_id: streamId.value } }).catch(() => {})
  room.disconnect()
  studio.dispose()
  compositor.stop()
  media.value?.getTracks().forEach(t => t.stop())
})
</script>
