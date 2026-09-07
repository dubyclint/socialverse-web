<template>
  <div class="dotv" :class="{ 'dotv--fullscreen': fullscreen }" role="status" :aria-label="label">
    <svg
      class="dotv__svg"
      :width="size"
      :height="size"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dotvLeft" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stop-color="#E879C8" />
          <stop offset="100%" stop-color="#A78BFA" />
        </linearGradient>
        <linearGradient id="dotvRight" x1="1" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stop-color="#F5E27A" />
          <stop offset="100%" stop-color="#9BF3C0" />
        </linearGradient>
      </defs>

      <!-- strokes of the V draw in once the dots have converged -->
      <path class="dotv__stroke dotv__stroke--left" d="M18 18 L40 18 L60 72 L44 78 Z" fill="url(#dotvLeft)" />
      <path class="dotv__stroke dotv__stroke--right" d="M102 18 L80 18 L60 72 L76 78 Z" fill="url(#dotvRight)" />

      <!-- three dots travel to the V vertices, mirroring the Viorp dot mark -->
      <circle class="dotv__dot dotv__dot--a" cx="29" cy="18" r="11" fill="#E879C8" />
      <circle class="dotv__dot dotv__dot--b" cx="91" cy="18" r="11" fill="#F5E27A" />
      <circle class="dotv__dot dotv__dot--c" cx="60" cy="92" r="14" fill="#9FF7E4" />
    </svg>

    <span v-if="label" class="dotv__label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
    label?: string
    fullscreen?: boolean
  }>(),
  { size: 72, label: '', fullscreen: false }
)
</script>

<style scoped>
.dotv {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.dotv--fullscreen {
  position: fixed;
  inset: 0;
  justify-content: center;
  background: var(--bg-app, #121827);
  z-index: 9999;
}

.dotv__label {
  font-family: var(--font-heading, Inter, system-ui, sans-serif);
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: var(--text-muted, #9fb3ad);
}

.dotv__stroke {
  opacity: 0;
  transform-origin: 60px 78px;
  animation: dotv-reveal 2.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.dotv__stroke--right {
  animation-delay: 0.12s;
}

.dotv__dot {
  animation: dotv-travel 2.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.dotv__dot--a {
  animation-name: dotv-travel-a;
}

.dotv__dot--b {
  animation-name: dotv-travel-b;
  animation-delay: 0.12s;
}

.dotv__dot--c {
  animation-name: dotv-travel-c;
  animation-delay: 0.24s;
}

@keyframes dotv-travel-a {
  0% { transform: translate(-6px, 44px) scale(0.7); opacity: 1; }
  45% { transform: translate(0, 0) scale(1); opacity: 1; }
  70%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
}

@keyframes dotv-travel-b {
  0% { transform: translate(8px, 52px) scale(0.55); opacity: 1; }
  45% { transform: translate(0, 0) scale(1); opacity: 1; }
  70%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
}

@keyframes dotv-travel-c {
  0% { transform: translate(-14px, -18px) scale(0.8); opacity: 1; }
  45%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
}

@keyframes dotv-reveal {
  0%, 40% { opacity: 0; transform: scale(0.82); }
  62%, 92% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .dotv__stroke,
  .dotv__dot {
    animation: none;
    opacity: 1;
  }
}
</style>
