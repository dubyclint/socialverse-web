<template>
  <div>
    <h4>Live Metrics</h4>
    <p>Impressions: {{ metrics.impressions }}</p>
    <p>Clicks: {{ metrics.clicks }}</p>
    <p>Conversions: {{ metrics.conversions }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const props = defineProps({ adId: String })
const metrics = ref({ impressions: 0, clicks: 0, conversions: 0 })

onMounted(() => {
  const socket = new WebSocket(`wss://yourdomain/ws/ad-metrics`)
  socket.onopen = () => socket.send(JSON.stringify({ adId: props.adId }))
  socket.onmessage = (e) => metrics.value = JSON.parse(e.data)
})
</script>
