<template>
  <NuxtLink v-if="to" :to="to" class="logo" :class="sizeClass">
    <img :src="src" :alt="`${text} logo`" class="logo__mark" />
    <span v-if="showText" class="logo__text">{{ text }}</span>
  </NuxtLink>
  <div v-else class="logo" :class="sizeClass">
    <img :src="src" :alt="`${text} logo`" class="logo__mark" />
    <span v-if="showText" class="logo__text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(
  defineProps<{
    size?: LogoSize
    showText?: boolean
    text?: string
    to?: string
    src?: string
  }>(),
  { size: 'md', showText: true, text: 'Viorp', to: '', src: '/logo.svg' }
)

const sizeClass = computed(() => `logo--${props.size}`)
</script>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm, 8px);
  text-decoration: none;
  color: var(--text-primary, #f0fffb);
}

.logo__mark {
  display: block;
  object-fit: contain;
}

.logo__text {
  font-family: var(--font-heading, Inter, sans-serif);
  font-weight: var(--weight-bold, 800);
  letter-spacing: -0.01em;
}

.logo--sm .logo__mark {
  width: 24px;
  height: 24px;
}
.logo--sm .logo__text {
  font-size: 1rem;
}

.logo--md .logo__mark {
  width: 32px;
  height: 32px;
}
.logo--md .logo__text {
  font-size: 1.25rem;
}

.logo--lg .logo__mark {
  width: 48px;
  height: 48px;
}
.logo--lg .logo__text {
  font-size: 1.5rem;
}

.logo--xl .logo__mark {
  width: 72px;
  height: 72px;
}
.logo--xl .logo__text {
  font-size: 2rem;
}
</style>
