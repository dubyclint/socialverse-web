<template>
  <div class="celebrate-layer" aria-hidden="true">
    <span
      v-for="p in particles"
      :key="p.id"
      :class="['celebrate-particle', p.kind]"
      :style="styleFor(p)"
    >{{ p.glyph }}</span>
  </div>
</template>

<script setup lang="ts">
import { useCelebrate, type CelebrateParticle } from '~/composables/use-celebrate'

const { particles } = useCelebrate()

const styleFor = (p: CelebrateParticle) => ({
  left: p.kind === 'cash' ? `${p.x}vw` : `${p.x}px`,
  top: p.kind === 'cash' ? '-3rem' : `${p.y}px`,
  fontSize: `${p.size}px`,
  animationDelay: `${p.delay}ms`,
  animationDuration: `${p.duration}ms`,
  '--drift': `${p.drift}px`
})
</script>

<style scoped>
.celebrate-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 10000;
}

.celebrate-particle {
  position: absolute;
  line-height: 1;
  will-change: transform, opacity;
  animation-fill-mode: both;
  animation-timing-function: cubic-bezier(0.25, 0.6, 0.4, 1);
}

.celebrate-particle.cash {
  animation-name: cash-fall;
}

.celebrate-particle.heart {
  transform: translate(-50%, -50%);
  animation-name: heart-pop;
}

@keyframes cash-fall {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate(var(--drift), 110vh) rotate(540deg); opacity: 0.9; }
}

@keyframes heart-pop {
  0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
  20% { transform: translate(-50%, -80%) scale(1.25); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--drift)), -420%) scale(0.8); opacity: 0; }
}
</style>
