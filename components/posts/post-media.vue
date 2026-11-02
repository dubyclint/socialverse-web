<template>
  <div v-if="media.length" class="post-media" :class="`count-${Math.min(media.length, 4)}`">
    <template v-for="(url, index) in media.slice(0, 4)" :key="url">
      <div v-if="isVideo(url)" class="media-video-wrap">
        <video
          :src="url"
          class="media-item media-video"
          :ref="el => registerVideo(el as HTMLVideoElement | null)"
          playsinline
          :muted="feedMuted"
          loop
          preload="metadata"
          title="Tap to watch in Veep"
          @click.stop="openVeep"
        />
        <button type="button" class="media-sound" :aria-label="feedMuted ? 'Unmute' : 'Mute'" @click.stop="toggleSound">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path v-if="feedMuted" d="m23 9-6 6M17 9l6 6" /><path v-else d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>
        </button>
      </div>
      <img
        v-else
        :src="url"
        class="media-item"
        :alt="`Post media ${index + 1}`"
        loading="lazy"
        decoding="async"
        title="Tap to view full photo"
        @click.stop="fullSrc = url"
      />
    </template>
    <span v-if="media.length > 4" class="media-more" @click.stop="$emit('open', media[4] ?? '')">+{{ media.length - 4 }}</span>
    <MediaLightbox :src="fullSrc" alt="" @close="fullSrc = null" />
  </div>
</template>

<script setup lang="ts">
import MediaLightbox from '~/components/chat/media-lightbox.vue'

const props = defineProps<{ media: string[], postId?: string }>()
const openVeep = (e: Event) => {
  if (props.postId) navigateTo(`/veep?start=${props.postId}`)
  else (e.target as HTMLVideoElement).play().catch(() => {})
}
const fullSrc = ref<string | null>(null)

// Feed videos autoplay with sound (shared on/off choice) while mostly on screen and pause when scrolled away, like Veep.
// Only one feed video plays at a time. Browsers block sound until the first tap, so we fall back to muted until then.
const feedMuted = useState('feed-video-muted', () => false)
const videos = new Set<HTMLVideoElement>()
let observer: IntersectionObserver | null = null
const playWithSound = (v: HTMLVideoElement) => {
  if (activeFeedVideo && activeFeedVideo !== v) activeFeedVideo.pause()
  activeFeedVideo = v
  v.muted = feedMuted.value
  v.play().catch(() => {
    v.muted = true
    void v.play().catch(() => {})
    armUnmuteOnGesture()
  })
}
const ensureObserver = () => {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target as HTMLVideoElement
      if (e.isIntersecting && e.intersectionRatio >= 0.6) playWithSound(v)
      else { v.pause(); if (activeFeedVideo === v) activeFeedVideo = null }
    }
  }, { threshold: [0, 0.6, 1] })
  return observer
}
const toggleSound = () => {
  feedMuted.value = !feedMuted.value
  if (activeFeedVideo) activeFeedVideo.muted = feedMuted.value
}
const registerVideo = (el: HTMLVideoElement | null) => {
  if (!el || videos.has(el)) return
  videos.add(el)
  ensureObserver()?.observe(el)
}
onBeforeUnmount(() => { observer?.disconnect(); observer = null; videos.clear() })
defineEmits<{ open: [url: string] }>()

const isVideo = (url: string) => /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(url)
</script>

<script lang="ts">
let activeFeedVideo: HTMLVideoElement | null = null
let gestureArmed = false
/** After the first tap anywhere, unmute the playing feed video (browser autoplay-with-sound policy). */
const armUnmuteOnGesture = () => {
  if (gestureArmed || typeof document === 'undefined') return
  gestureArmed = true
  const onGesture = () => {
    gestureArmed = false
    const muted = useState<boolean>('feed-video-muted', () => false)
    if (activeFeedVideo && !muted.value) activeFeedVideo.muted = false
  }
  document.addEventListener('pointerdown', onGesture, { once: true, capture: true })
}
</script>

<style scoped>
.post-media {
  position: relative;
  display: grid;
  gap: 2px;
  background: #000;
  width: 100%;
}

.post-media.count-1 { grid-template-columns: 1fr; }
.post-media.count-2 { grid-template-columns: 1fr 1fr; }
.post-media.count-3,
.post-media.count-4 { grid-template-columns: 1fr 1fr; }

.media-item {
  width: 100%;
  display: block;
  object-fit: cover;
  cursor: pointer;
  background: #000;
}

/* A single media item leads the card: tall enough to dominate the viewport
   without pushing the action bar off screen. */
/* Best fit: the whole photo/video is shown at its natural aspect ratio,
   never upscaled past its own resolution and never taller than the screen. */
.count-1 .media-item {
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: min(80vh, 900px);
  margin: 0 auto;
  object-fit: contain;
}
.count-1 .media-video { width: 100%; }

.count-2 .media-item,
.count-3 .media-item,
.count-4 .media-item {
  aspect-ratio: 1 / 1;
}

.media-video {
  cursor: default;
}

.media-video-wrap {
  position: relative;
  min-width: 0;
}

.media-video-wrap .media-item {
  width: 100%;
}

.media-sound {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: 9999px;
  background: rgba(10, 15, 30, 0.65);
  color: #fff;
}

.media-more {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 2px 10px;
  border-radius: 9999px;
  background: rgba(10, 15, 30, 0.8);
  color: var(--text-primary, #f0fffb);
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .count-1 .media-item { max-height: 75vh; }
}
</style>
