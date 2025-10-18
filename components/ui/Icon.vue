<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="viewBox"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="['icon', `icon-${name}`]"
  >
    <component :is="iconComponent" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: 24
  }
})

const viewBox = computed(() => `0 0 24 24`)

const iconComponent = computed(() => {
  const icons = {
    // Navigation icons
    'home': () => h('path', { d: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }),
    'menu': () => [
      h('line', { x1: '3', y1: '6', x2: '21', y2: '6' }),
      h('line', { x1: '3', y1: '12', x2: '21', y2: '12' }),
      h('line', { x1: '3', y1: '18', x2: '21', y2: '18' })
    ],
    'x': () => [
      h('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
      h('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
    ],
    
    // Social icons
    'message-circle': () => [
      h('path', { d: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z' })
    ],
    'heart': () => h('path', { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' }),
    'share': () => [
      h('circle', { cx: '18', cy: '5', r: '3' }),
      h('circle', { cx: '6', cy: '12', r: '3' }),
      h('circle', { cx: '18', cy: '19', r: '3' }),
      h('line', { x1: '8.59', y1: '13.51', x2: '15.42', y2: '17.49' }),
      h('line', { x1: '15.41', y1: '6.51', x2: '8.59', y2: '10.49' })
    ],
    'plus': () => [
      h('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
      h('line', { x1: '5', y1: '12', x2: '19', y2: '12' })
    ],
    'plus-square': () => [
      h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }),
      h('line', { x1: '12', y1: '8', x2: '12', y2: '16' }),
      h('line', { x1: '8', y1: '12', x2: '16', y2: '12' })
    ],
    
    // User icons
    'user': () => [
      h('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
      h('circle', { cx: '12', cy: '7', r: '4' })
    ],
    'users': () => [
      h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
      h('circle', { cx: '9', cy: '7', r: '4' }),
      h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
      h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
    ],
    
    // Utility icons
    'wallet': () => [
      h('path', { d: 'M21 12V7H5a2 2 0 0 1 0-4h14v4' }),
      h('path', { d: 'M3 5v14a2 2 0 0 0 2 2h16v-5' }),
      h('line', { x1: '18', y1: '12', x2: '18', y2: '12' })
    ],
    'settings': () => [
      h('circle', { cx: '12', cy: '12', r: '3' }),
      h('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' })
    ],
    'more-horizontal': () => [
      h('circle', { cx: '12', cy: '12', r: '1' }),
      h('circle', { cx: '19', cy: '12', r: '1' }),
      h('circle', { cx: '5', cy: '12', r: '1' })
    ],
    'check-circle': () => [
      h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
      h('polyline', { points: '22,4 12,14.01 9,11.01' })
    ],
    'shield': () => h('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' }),
    'zap': () => h('polygon', { points: '13,2 3,14 12,14 11,22 21,10 12,10' }),
    'log-out': () => [
      h('path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }),
      h('polyline', { points: '16,17 21,12 16,7' }),
      h('line', { x1: '21', y1: '12', x2: '9', y2: '12' })
    ],
    'maximize': () => [
      h('path', { d: 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3' })
    ],
    'pin': () => [
      h('path', { d: 'M9 9 5 5l-1 1 4 4L3 15l5 5 5-5 4 4 1-1-4-4 4-4-4-4-4 4z' })
    ],
    'dollar-sign': () => [
      h('line', { x1: '12', y1: '1', x2: '12', y2: '23' }),
      h('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' })
    ],
    'help-circle': () => [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }),
      h('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
    ],
    'target': () => [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('circle', { cx: '12', cy: '12', r: '6' }),
      h('circle', { cx: '12', cy: '12', r: '2' })
    ],
    'bar-chart': () => [
      h('line', { x1: '12', y1: '20', x2: '12', y2: '10' }),
      h('line', { x1: '18', y1: '20', x2: '18', y2: '4' }),
      h('line', { x1: '6', y1: '20', x2: '6', y2: '16' })
    ],
    'shopping-bag': () => [
      h('path', { d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z' }),
      h('line', { x1: '3', y1: '6', x2: '21', y2: '6' }),
      h('path', { d: 'M16 10a4 4 0 0 1-8 0' })
    ],
    'play': () => h('polygon', { points: '5,3 19,12 5,21' }),
    'image': () => [
      h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }),
      h('circle', { cx: '8.5', cy: '8.5', r: '1.5' }),
      h('polyline', { points: '21,15 16,10 5,21' })
    ],
    
    // Social media icons
    'twitter': () => h('path', { d: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z' }),
    'facebook': () => h('path', { d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' }),
    'instagram': () => [
      h('rect', { x: '2', y: '2', width: '20', height: '20', rx: '5', ry: '5' }),
      h('path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' }),
      h('line', { x1: '17.5', y1: '6.5', x2: '17.51', y2: '6.5' })
    ],
    'linkedin': () => [
      h('path', { d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z' }),
      h('rect', { x: '2', y: '9', width: '4', height: '12' }),
      h('circle', { cx: '4', cy: '4', r: '2' })
    ]
  }
  
  return icons[props.name] || (() => h('circle', { cx: '12', cy: '12', r: '10' }))
})
</script>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
