<template>
  <div class="landing">
    <div class="aurora" aria-hidden="true">
      <span class="aurora__band aurora__band--mint" />
      <span class="aurora__band aurora__band--gold" />
      <span class="aurora__grain" />
    </div>

    <main class="stage">
      <div class="orbit" aria-hidden="true">
        <span class="orbit__ring orbit__ring--outer" />
        <span class="orbit__ring orbit__ring--inner" />
        <span class="orbit__dot orbit__dot--a" />
        <span class="orbit__dot orbit__dot--b" />
      </div>

      <img src="/logo.svg" alt="Viorp" class="mark" width="112" height="112" >

      <h1 class="wordmark">Viorp</h1>
      <p class="tagline">Vibe in orbit.</p>

      <div class="actions">
        <button type="button" class="btn btn--primary" @click="goToSignup">
          Create account
        </button>
        <button type="button" class="btn btn--ghost" @click="goToSignin">
          Sign in
        </button>
      </div>
    </main>

    <p class="legal">@viorp 2026 all rights reserved</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'blank',
  middleware: []
})

const goToSignin = () => navigateTo('/signin')
const goToSignup = () => navigateTo('/signup')
</script>

<style scoped>
.landing {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  overflow: hidden;
  background: var(--color-deep-aurora, #0a0f1e);
  color: var(--color-off-white, #f0fffb);
  padding: calc(env(safe-area-inset-top) + 24px) 24px calc(env(safe-area-inset-bottom) + 20px);
}

.aurora {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.aurora__band {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.5;
}

.aurora__band--mint {
  width: 70vmax;
  height: 70vmax;
  top: -32vmax;
  left: -18vmax;
  background: radial-gradient(circle, rgba(111, 255, 212, 0.38) 0%, rgba(111, 255, 212, 0) 68%);
  animation: drift 22s ease-in-out infinite alternate;
}

.aurora__band--gold {
  width: 56vmax;
  height: 56vmax;
  bottom: -28vmax;
  right: -16vmax;
  background: radial-gradient(circle, rgba(255, 200, 87, 0.22) 0%, rgba(255, 200, 87, 0) 70%);
  animation: drift 28s ease-in-out infinite alternate-reverse;
}

.aurora__grain {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(240, 255, 251, 0.055) 1px, transparent 1px);
  background-size: 3px 3px;
  mix-blend-mode: screen;
  opacity: 0.5;
}

.stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: auto;
}

.orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(78vw, 420px);
  aspect-ratio: 1;
  transform: translate(-50%, -62%);
  pointer-events: none;
}

.orbit__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(111, 255, 212, 0.16);
}

.orbit__ring--inner {
  inset: 18%;
  border-color: rgba(111, 255, 212, 0.1);
}

.orbit__dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  margin: -3px;
  border-radius: 50%;
  transform-origin: 3px 3px;
}

.orbit__dot--a {
  background: var(--color-aurora-mint, #6fffd4);
  box-shadow: 0 0 10px rgba(111, 255, 212, 0.8);
  animation: orbit-a 14s linear infinite;
}

.orbit__dot--b {
  width: 4px;
  height: 4px;
  background: var(--color-solar-gold, #ffc857);
  box-shadow: 0 0 10px rgba(255, 200, 87, 0.7);
  animation: orbit-b 20s linear infinite reverse;
}

.mark {
  position: relative;
  width: clamp(88px, 22vw, 116px);
  height: auto;
  filter: drop-shadow(0 0 26px rgba(111, 255, 212, 0.34));
  animation: rise 700ms cubic-bezier(0.4, 0, 0.2, 1) both;
}

.wordmark {
  position: relative;
  margin: 20px 0 0;
  font-family: var(--font-heading, 'Satoshi', Inter, sans-serif);
  font-weight: 800;
  font-size: clamp(2.6rem, 11vw, 4rem);
  letter-spacing: -0.045em;
  line-height: 1;
  animation: rise 700ms 80ms cubic-bezier(0.4, 0, 0.2, 1) both;
}

.tagline {
  position: relative;
  margin: 10px 0 0;
  font-size: 0.9rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: rgba(240, 255, 251, 0.5);
  animation: rise 700ms 160ms cubic-bezier(0.4, 0, 0.2, 1) both;
}

.actions {
  position: relative;
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(100%, 320px);
  animation: rise 700ms 240ms cubic-bezier(0.4, 0, 0.2, 1) both;
}

.btn {
  height: 52px;
  border-radius: var(--radius-lg, 24px);
  border: 1px solid transparent;
  font-family: var(--font-body, Inter, system-ui, sans-serif);
  font-size: 0.98rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.btn--primary {
  background: var(--color-aurora-mint, #6fffd4);
  color: var(--color-deep-aurora, #0a0f1e);
  box-shadow: 0 0 8px rgba(111, 255, 212, 0.4);
}

.btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 22px rgba(111, 255, 212, 0.55);
}

.btn--primary:active {
  transform: translateY(0);
  box-shadow: 0 0 16px rgba(111, 255, 212, 0.4);
}

.btn--ghost {
  background: transparent;
  color: var(--color-off-white, #f0fffb);
  border-color: rgba(111, 255, 212, 0.28);
}

.btn--ghost:hover {
  border-color: rgba(111, 255, 212, 0.6);
  background: rgba(111, 255, 212, 0.06);
}

.legal {
  position: relative;
  margin: 0;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  color: rgba(240, 255, 251, 0.28);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes drift {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(4vw, 3vh, 0) scale(1.12);
  }
}

@keyframes orbit-a {
  from {
    transform: rotate(0deg) translateX(min(39vw, 210px)) rotate(0deg);
  }
  to {
    transform: rotate(360deg) translateX(min(39vw, 210px)) rotate(-360deg);
  }
}

@keyframes orbit-b {
  from {
    transform: rotate(0deg) translateX(min(32vw, 172px)) rotate(0deg);
  }
  to {
    transform: rotate(360deg) translateX(min(32vw, 172px)) rotate(-360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mark,
  .wordmark,
  .tagline,
  .actions,
  .aurora__band,
  .orbit__dot {
    animation: none;
  }
}
</style>
