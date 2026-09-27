<template>
  <div v-if="media.length" class="post-media" :class="`count-${Math.min(media.length, 4)}`">
    <template v-for="(url, index) in media.slice(0, 4)" :key="url">
      <video
        v-if="isVideo(url)"
        :src="url"
        class="media-item media-video"
        controls
        playsinline
        preload="metadata"
      />
      <img
        v-else
        :src="url"
        class="media-item"
        :alt="`Post media ${index + 1}`"
        loading="lazy"
        @click="$emit('open', url)"
      />
    </template>
    <span v-if="media.length > 4" class="media-more">+{{ media.length - 4 }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ media: string[] }>()
defineEmits<{ open: [url: string] }>()

const isVideo = (url: string) => /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(url)
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
.count-1 .media-item {
  max-height: 70vh;
  object-fit: contain;
}

.count-2 .media-item,
.count-3 .media-item,
.count-4 .media-item {
  aspect-ratio: 1 / 1;
}

.media-video {
  cursor: default;
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
  .count-1 .media-item { max-height: 60vh; }
}
</style>
