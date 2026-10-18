<template>
  <span v-if="isOnline(userId)" class="presence-dot" :style="{ width: `${size}px`, height: `${size}px` }" title="Online" aria-label="Online" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useOnlineStatus } from '~/composables/useOnlineStatus'

const props = withDefaults(defineProps<{ userId?: string | null, size?: number }>(), { userId: null, size: 12 })
const { watchUser, isOnline } = useOnlineStatus()

let timer: ReturnType<typeof setInterval> | null = null
watch(() => props.userId, id => watchUser(id), { immediate: true })
onMounted(() => { timer = setInterval(() => watchUser(props.userId), 50_000) })
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.presence-dot {
  position: absolute;
  right: 0;
  bottom: 0;
  border-radius: 999px;
  background: #22c55e;
  border: 2px solid var(--color-surface, #0f172a);
  box-sizing: border-box;
  pointer-events: none;
  z-index: 1;
}
</style>
