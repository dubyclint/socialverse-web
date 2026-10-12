<template>
  <div class="trimmer">
    <div ref="waveRef" class="wave" />
    <p v-if="loading" class="muted">Loading waveform…</p>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="controls">
      <button type="button" class="play" :disabled="loading || !!error" @click="togglePlay">{{ playing ? 'Pause' : 'Play clip' }}</button>
      <span class="muted">{{ fmt(startTime) }} – {{ fmt(startTime + duration) }} ({{ duration.toFixed(1) }}s, max 15s)</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type WaveSurfer from 'wavesurfer.js'
import type { Region } from 'wavesurfer.js/dist/plugins/regions.esm.js'

export interface TrimChange {
  startTime: number
  duration: number
  sourceType: 'royalty-free' | 'custom-device'
}

const props = defineProps<{ defaultAudioUrl: string, sourceType: TrimChange['sourceType'] }>()
const emit = defineEmits<{ onTrimChange: [TrimChange] }>()

const MAX_LENGTH = 15
const waveRef = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref('')
const playing = ref(false)
const startTime = ref(0)
const duration = ref(0)
let ws: WaveSurfer | null = null
let region: Region | null = null

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

const report = (r: Region) => {
  const length = Math.min(MAX_LENGTH, r.end - r.start)
  if (r.end - r.start > MAX_LENGTH) r.setOptions({ start: r.start, end: r.start + MAX_LENGTH })
  startTime.value = r.start
  duration.value = length
  emit('onTrimChange', { startTime: r.start, duration: length, sourceType: props.sourceType })
}

const togglePlay = () => {
  if (!ws || !region) return
  if (ws.isPlaying()) ws.pause()
  else region.play()
}

onMounted(async () => {
  if (!waveRef.value) return
  const [{ default: WaveSurferCtor }, { default: RegionsPlugin }] = await Promise.all([
    import('wavesurfer.js'),
    import('wavesurfer.js/dist/plugins/regions.esm.js')
  ])
  const regions = RegionsPlugin.create()
  ws = WaveSurferCtor.create({
    container: waveRef.value,
    url: props.defaultAudioUrl,
    height: 72,
    waveColor: '#475569',
    progressColor: '#60a5fa',
    cursorColor: '#f59e0b',
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    plugins: [regions]
  })
  ws.on('decode', (total) => {
    loading.value = false
    region = regions.addRegion({
      start: 0,
      end: Math.min(MAX_LENGTH, total),
      drag: true,
      resize: true,
      maxLength: MAX_LENGTH,
      minLength: 1,
      color: 'rgba(96, 165, 250, 0.25)'
    })
    report(region)
  })
  ws.on('error', () => {
    loading.value = false
    error.value = 'This audio could not be loaded'
  })
  ws.on('play', () => { playing.value = true })
  ws.on('pause', () => { playing.value = false })
  ws.on('audioprocess', (time) => {
    if (region && time >= region.end) ws?.setTime(region.start)
  })
  regions.on('region-updated', r => report(r))
})

onBeforeUnmount(() => {
  ws?.destroy()
  ws = null
  region = null
})
</script>

<style scoped>
.trimmer { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 10px; touch-action: pan-y; }
.wave { width: 100%; }
.controls { display: flex; align-items: center; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
.play { background: #2563eb; color: #fff; border: none; border-radius: 999px; padding: 0.4rem 0.9rem; font-weight: 600; min-height: 36px; }
.play:disabled { opacity: .5; }
.muted { color: #94a3b8; font-size: 0.8rem; }
.error { color: #f87171; font-size: 0.85rem; }
</style>
