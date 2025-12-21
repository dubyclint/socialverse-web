<template>
  <div class="logo-container" :class="sizeClass">
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      :width="width"
      :height="height"
    >
      <!-- Background Circle -->
      <circle cx="16" cy="16" r="16" fill="url(#gradient1)"/>
      
      <!-- Social Network Icon -->
      <g transform="translate(8, 8)">
        <!-- Center Node -->
        <circle cx="8" cy="8" r="2.5" fill="white"/>
        
        <!-- Connected Nodes -->
        <circle cx="2" cy="4" r="1.5" fill="white" opacity="0.9"/>
        <circle cx="14" cy="4" r="1.5" fill="white" opacity="0.9"/>
        <circle cx="2" cy="12" r="1.5" fill="white" opacity="0.9"/>
        <circle cx="14" cy="12" r="1.5" fill="white" opacity="0.9"/>
        
        <!-- Connection Lines -->
        <line x1="8" y1="8" x2="2" y2="4" stroke="white" stroke-width="1" opacity="0.6"/>
        <line x1="8" y1="8" x2="14" y2="4" stroke="white" stroke-width="1" opacity="0.6"/>
        <line x1="8" y1="8" x2="2" y2="12" stroke="white" stroke-width="1" opacity="0.6"/>
        <line x1="8" y1="8" x2="14" y2="12" stroke="white" stroke-width="1" opacity="0.6"/>
      </g>
      
      <!-- Gradient Definition -->
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>
    <span v-if="showText" class="logo-text">{{ text }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md', // 'sm', 'md', 'lg', 'xl'
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  showText: {
    type: Boolean,
    default: true
  },
  text: {
    type: String,
    default: 'SocialVerse'
  }
})

const sizeClass = computed(() => `logo-${props.size}`)

const width = computed(() => {
  const sizes = { sm: 24, md: 32, lg: 48, xl: 64 }
  return sizes[props.size]
})

const height = computed(() => width.value)
</script>

<style scoped>
.logo-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-text {
  font-weight: 700;
  color: white;
}

.logo-sm .logo-text {
  font-size: 0.875rem;
}

.logo-md .logo-text {
  font-size: 1rem;
}

.logo-lg .logo-text {
  font-size: 1.25rem;
}

.logo-xl .logo-text {
  font-size: 1.5rem;
}
</style>
