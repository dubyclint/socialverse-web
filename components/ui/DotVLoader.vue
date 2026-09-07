<template>
  <div class="dotv" :class="{ 'dotv--full': fullscreen }" role="status" :aria-label="label">
    <svg class="dotv__mark" viewBox="0 0 120 120" :width="size" :height="size" aria-hidden="true">
      <!-- Two strokes of the V draw themselves, then the dots settle on the path. -->
      <path class="dotv__stroke" d="M28 30 L60 90" />
      <path class="dotv__stroke dotv__stroke--right" d="M92 30 L60 90" />
      <circle class="dotv__dot dotv__dot--a" cx="28" cy="30" r="7" />
      <circle class="dotv__dot dotv__dot--b" cx="92" cy="30" r="7" />
      <circle class="dotv__dot dotv__dot--c" cx="60" cy="90" r="8" />
    </svg>
    <p v-if="label" class="dotv__label">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
    label?: string
    fullscreen?: boolean
  }>(),
  { size: 96, label: '', fullscreen: false }
)
</script>

<style scoped>
.dotv {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md, 16px);
}

.dotv--full {
  position: fixed;
  inset: 0;
  z-index: 9999;
  justify-content: center;
  background: var(--bg-app, #121827);
}

.dotv__mark {
  overflow: visible;
}

.dotv__stroke {
  fill: none;
  stroke: var(--accent, #6fffd4);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 72;
  stroke-dashoffset: 72;
  filter: drop-shadow(0 0 6px rgba(111, 255, 212, 0.4));
  animation: dotv-draw 1.6s var(--motion-easing, cubic-bezier(0.4, 0, 0.2, 1)) infinite;
}

.dotv__stroke--right {
  animation-delay: 0.15s;
}

.dotv__dot {
  fill: var(--accent, #6fffd4);
  opacity: 0.25;
  animation: dotv-pulse 1.6s var(--motion-easing, cubic-bezier(0.4, 0, 0.2, 1)) infinite;
}

.dotv__dot--b {
  animation-delay: 0.15s;
}

.dotv__dot--c {
  fill: var(--alert, #ffc857);
  animation-delay: 0.55s;
}

.dotv__label {
  font-family: var(--font-heading, Inter, sans-serif);
  font-size: 0.875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted, #9fb3ad);
}

@keyframes dotv-draw {
  0% {
    stroke-dashoffset: 72;
  }
  55%,
  85% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 72;
  }
}

@keyframes dotv-pulse {
  0%,
  20% {
    opacity: 0.25;
    transform: scale(0.85);
  }
  60%,
  85% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.25;
    transform: scale(0.85);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dotv__stroke,
  .dotv__dot {
    animation-duration: 0s;
    stroke-dashoffset: 0;
    opacity: 1;
  }
}
</style>
