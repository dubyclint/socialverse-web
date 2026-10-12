<template>
  <Teleport to="body">
    <div v-if="src" class="lightbox" role="dialog" aria-modal="true" aria-label="Full photo" @click="$emit('close')">
      <button class="lightbox-close" aria-label="Close" @click.stop="$emit('close')">
        <Icon name="x" />
      </button>
      <img :src="src" :alt="alt || ''" class="lightbox-img" @click.stop />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ src: string | null, alt?: string }>()
const emit = defineEmits<{ close: [] }>()

const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.src) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
}
.lightbox-img {
  max-width: 100vw;
  max-height: 100dvh;
  width: auto;
  height: auto;
  object-fit: contain;
}
.lightbox-close {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
