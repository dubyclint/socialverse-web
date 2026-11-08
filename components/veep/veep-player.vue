<template>
  <div class="vp" @click="togglePlay">
    <video
      v-if="video"
      ref="el"
      class="vp-media"
      :src="playSrc"
      :poster="poster || BLANK_POSTER"
      :preload="preload"
      playsinline
      webkit-playsinline
      loop
      muted
      disablepictureinpicture
      disableremoteplayback
      controlslist="nodownload noplaybackrate noremoteplayback"
      @contextmenu.prevent
      @timeupdate="onTime"
      @ended="loops++"
      @waiting="stalled = true"
      @playing="stalled = false"
    />
    <img v-else class="vp-media" :src="src" :loading="near ? 'eager' : 'lazy'" alt="" decoding="async">
    <div v-if="video && stalled && active" class="vp-spin" />
    <div v-if="video && paused && active" class="vp-play" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { acquireMediaBlob, releaseMediaBlob } from '~/composables/useMediaBlob'
/** One full-screen Veep media canvas: pre-buffers when near, plays when active, crossfades audio, reports watch time. */
const props = defineProps<{ src: string, video: boolean, active: boolean, near: boolean, muted: boolean, lowData: boolean, poster?: string, engagedSeconds?: number }>()
const emit = defineEmits<{ watched: [{ watchMs: number, completed: boolean, loops: number }], engaged: [seconds: number] }>()
let engagedSent = false
// A transparent poster stops Android WebView from drawing its large grey play placeholder before playback.
const BLANK_POSTER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const el = ref<HTMLVideoElement | null>(null)
// The video plays from a blob: URL fetched when near, so download detectors don't list it.
const playSrc = ref<string | undefined>()
let heldSrc: string | null = null
const holdSrc = () => {
  if (!props.video || heldSrc === props.src || !(props.near || props.active)) return
  if (heldSrc) releaseMediaBlob(heldSrc)
  const want = props.src
  heldSrc = want
  playSrc.value = undefined
  void acquireMediaBlob(want).then((s) => { if (heldSrc === want) playSrc.value = s })
}
watch(() => [props.src, props.near, props.active, props.video], holdSrc, { immediate: true })
watch(playSrc, async (s) => {
  await nextTick()
  const v = el.value
  if (!s || !v || !props.active) return
  v.muted = props.muted
  try { await v.play() } catch { v.muted = true; await v.play().catch(() => {}) }
})
const stalled = ref(false)
const paused = ref(false)
const loops = ref(0)
let startedAt = 0
let watchedMs = 0
let completed = false
let fade: ReturnType<typeof setInterval> | null = null

// Next two items sit at frame zero (preload=auto); on poor networks only metadata is pre-fetched.
const preload = computed(() => props.active ? 'auto' : props.near ? (props.lowData ? 'metadata' : 'auto') : 'none')

const fadeOut = (v: HTMLVideoElement) => {
  if (fade) clearInterval(fade)
  const step = v.volume / 6
  fade = setInterval(() => {
    v.volume = Math.max(0, v.volume - step)
    if (v.volume <= 0.01) { clearInterval(fade!); fade = null; v.pause(); v.volume = 1 }
  }, 25)
}

const flush = () => {
  if (startedAt) { watchedMs += Date.now() - startedAt; startedAt = 0 }
  if (watchedMs > 300 || completed) emit('watched', { watchMs: watchedMs, completed, loops: loops.value })
  watchedMs = 0; completed = false; loops.value = 0; engagedSent = false
}

watch(() => props.active, async (on) => {
  const v = el.value
  if (on) {
    startedAt = Date.now()
    if (!v) return
    if (fade) { clearInterval(fade); fade = null }
    v.volume = 1
    v.muted = props.muted
    paused.value = false
    try { await v.play() } catch { v.muted = true; await v.play().catch(() => {}) }
  } else {
    if (v && !v.paused) fadeOut(v)
    flush()
  }
}, { immediate: true, flush: 'post' })

watch(() => props.near, (n) => { if (n && el.value && el.value.readyState === 0) el.value.load() })
watch(() => props.muted, (m) => { if (el.value && props.active) el.value.muted = m })

const onTime = () => {
  const v = el.value
  if (v && v.duration && v.currentTime / v.duration > 0.95) completed = true
  if (v && !engagedSent && (v.currentTime >= (props.engagedSeconds ?? 6) || completed)) { engagedSent = true; emit('engaged', v.currentTime) }
}

const togglePlay = () => {
  const v = el.value
  if (!v || !props.active) return
  if (v.paused) { v.play().catch(() => {}); paused.value = false; startedAt = Date.now() } else { v.pause(); paused.value = true; if (startedAt) { watchedMs += Date.now() - startedAt; startedAt = 0 } }
}

onBeforeUnmount(() => { if (props.active) flush(); if (fade) clearInterval(fade); if (heldSrc) releaseMediaBlob(heldSrc) })
</script>

<style scoped>
.vp { position: absolute; inset: 0; background: #000; }
.vp-media { width: 100%; height: 100%; object-fit: cover; display: block; }
.vp-spin { position: absolute; top: 50%; left: 50%; width: 36px; height: 36px; margin: -18px; border: 3px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: vps .8s linear infinite; }
.vp-play { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: rgba(0,0,0,.35); color: rgba(255,255,255,.9); pointer-events: none; }
@keyframes vps { to { transform: rotate(360deg) } }
</style>
