<template>
  <div v-if="offline" class="offline-banner" role="status">
    You're offline. Messages will send when you reconnect.
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const offline = ref(false)
const update = () => { offline.value = !navigator.onLine }
onMounted(() => {
  update()
  window.addEventListener('online', update)
  window.addEventListener('offline', update)
})
onUnmounted(() => {
  window.removeEventListener('online', update)
  window.removeEventListener('offline', update)
})
</script>

<style scoped>
.offline-banner {
  position: fixed; left: 0; right: 0; top: 0; z-index: 9999;
  padding: calc(6px + env(safe-area-inset-top)) 12px 6px;
  background: #b45309; color: #fff; font-size: .85rem; text-align: center;
}
</style>
