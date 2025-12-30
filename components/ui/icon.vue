// FILE: /components/ui/icon.vue - FIXED VERSION
// ============================================================================
// ICON COMPONENT - FIXED
// ✅ FIXED: Added missing icon definitions
// ✅ FIXED: Proper SVG rendering for all icons
// ============================================================================

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
import { computed, h } from 'vue'

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
    
    // ✅ FIXED: Proper menu icon rendering
    'menu': () => [
      h('line', { x1: '3', y1: '6', x2: '21', y2: '6', key: 'menu-1' }),
      h('line', { x1: '3', y1: '12', x2: '21', y2: '12', key: 'menu-2' }),
      h('line', { x1: '3', y1: '18', x2: '21', y2: '18', key: 'menu-3' })
    ],
    
    'x': () => [
      h('line', { x1: '18', y1: '6', x2: '6', y2: '18', key: 'x-1' }),
      h('line', { x1: '6', y1: '6', x2: '18', y2: '18', key: 'x-2' })
    ],
    
    // Social icons
    'message-circle': () => h('path', { d: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z' }),
    
    'heart': () => h('path', { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' }),
    
    'share-2': () => [
      h('circle', { cx: '18', cy: '5', r: '3', key: 'share-1' }),
      h('circle', { cx: '6', cy: '12', r: '3', key: 'share-2' }),
      h('circle', { cx: '18', cy: '19', r: '3', key: 'share-3' }),
      h('line', { x1: '8.59', y1: '13.51', x2: '15.42', y2: '17.49', key: 'share-4' }),
      h('line', { x1: '15.41', y1: '6.51', x2: '8.59', y2: '10.49', key: 'share-5' })
    ],
    
    'plus': () => [
      h('line', { x1: '12', y1: '5', x2: '12', y2: '19', key: 'plus-1' }),
      h('line', { x1: '5', y1: '12', x2: '19', y2: '12', key: 'plus-2' })
    ],
    
    'plus-square': () => [
      h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2', key: 'plus-sq-1' }),
      h('line', { x1: '12', y1: '8', x2: '12', y2: '16', key: 'plus-sq-2' }),
      h('line', { x1: '8', y1: '12', x2: '16', y2: '12', key: 'plus-sq-3' })
    ],
    
    // User icons
    'user': () => [
      h('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', key: 'user-1' }),
      h('circle', { cx: '12', cy: '7', r: '4', key: 'user-2' })
    ],
    
    'users': () => [
      h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', key: 'users-1' }),
      h('circle', { cx: '9', cy: '7', r: '4', key: 'users-2' }),
      h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87', key: 'users-3' }),
      h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75', key: 'users-4' })
    ],
    
    // Utility icons
    'wallet': () => [
      h('path', { d: 'M21 12V7H5a2 2 0 0 1 0-4h14v4', key: 'wallet-1' }),
      h('path', { d: 'M3 5v14a2 2 0 0 0 2 2h16v-5', key: 'wallet-2' }),
      h('line', { x1: '18', y1: '12', x2: '18', y2: '12', key: 'wallet-3' })
    ],
    
    'settings': () => [
      h('circle', { cx: '12', cy: '12', r: '3', key: 'settings-1' }),
      h('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z', key: 'settings-2' })
    ],
    
    'more-vertical': () => [
      h('circle', { cx: '12', cy: '12', r: '1', key: 'more-v-1' }),
      h('circle', { cx: '12', cy: '5', r: '1', key: 'more-v-2' }),
      h('circle', { cx: '12', cy: '19', r: '1', key: 'more-v-3' })
    ],
    
    'check-circle': () => [
      h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14', key: 'check-1' }),
      h('polyline', { points: '22,4 12,14.01 9,11.01', key: 'check-2' })
    ],
    
    'shield': () => h('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' }),
    
    'log-out': () => [
      h('path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', key: 'logout-1' }),
      h('polyline', { points: '16,17 21,12 16,7', key: 'logout-2' }),
      h('line', { x1: '21', y1: '12', x2: '9', y2: '12', key: 'logout-3' })
    ],
    
    'bell': () => [
      h('path', { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', key: 'bell-1' }),
      h('path', { d: 'M13.73 21a2 2 0 0 1-3.46 0', key: 'bell-2' })
    ],
    
    'inbox': () => [
      h('polyline', { points: '4 4 4 20 20 20 20 4', key: 'inbox-1' }),
      h('line', { x1: '4', y1: '4', x2: '20', y2: '4', key: 'inbox-2' }),
      h('path', { d: 'M4 4h16v5H4z', key: 'inbox-3' })
    ],
    
    'compass': () => [
      h('circle', { cx: '12', cy: '12', r: '10', key: 'compass-1' }),
      h('polygon', { points: '12,2 19,21 12,17 5,21', key: 'compass-2' })
    ],
    
    'trending-up': () => [
      h('polyline', { points: '23 6 13.5 15.5 8.5 10.5 1 17', key: 'trend-1' }),
      h('polyline', { points: '17 6 23 6 23 12', key: 'trend-2' })
    ],
    
    'dollar-sign': () => [
      h('line', { x1: '12', y1: '1', x2: '12', y2: '23', key: 'dollar-1' }),
      h('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', key: 'dollar-2' })
    ],
    
    'megaphone': () => [
      h('path', { d: 'M23 7l-7 5v6c0 .55-.45 1-1 1h-1c-.55 0-1-.45-1-1v-6l-7 5V5c7-4 7-4 7-4s7 0 7 4v2z', key: 'megaphone-1' }),
      h('path', { d: 'M5.5 11a3.5 3.5 0 0 0 0 7', key: 'megaphone-2' })
    ],
    
    'headphones': () => [
      h('path', { d: 'M20 15c0 1-1 2-2 2h-2c-1 0-2-1-2-2v-5c0-1 1-2 2-2h2c1 0 2 1 2 2', key: 'headphones-1' }),
      h('path', { d: 'M4 15c0 1 1 2 2 2h2c1 0 2-1 2-2v-5c0-1-1-2-2-2H6c-1 0-2 1-2 2', key: 'headphones-2' }),
      h('path', { d: 'M12 1a7 7 0 0 0-7 7v6h14V8a7 7 0 0 0-7-7z', key: 'headphones-3' })
    ],
    
    'file-text': () => [
      h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', key: 'file-1' }),
      h('polyline', { points: '14 2 14 8 20 8', key: 'file-2' }),
      h('line', { x1: '12', y1: '13', x2: '8', y2: '13', key: 'file-3' }),
      h('line', { x1: '12', y1: '17', x2: '8', y2: '17', key: 'file-4' })
    ],
    
    'radio': () => [
      h('circle', { cx: '12', cy: '12', r: '9', key: 'radio-1' }),
      h('circle', { cx: '12', cy: '12', r: '5', key: 'radio-2' }),
      h('circle', { cx: '12', cy: '12', r: '1', key: 'radio-3' })
    ],
    
    'search': () => [
      h('circle', { cx: '11', cy: '11', r: '8', key: 'search-1' }),
      h('line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65', key: 'search-2' })
    ],
    
    'refresh-cw': () => [
      h('polyline', { points: '23 4 23 10 17 10', key: 'refresh-1' }),
      h('polyline', { points: '1 20 1 14 7 14', key: 'refresh-2' }),
      h('path', { d: 'M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36', key: 'refresh-3' })
    ],
    
    'smile': () => [
      h('circle', { cx: '12', cy: '12', r: '10', key: 'smile-1' }),
      h('path', { d: 'M8 14s1.5 2 4 2 4-2 4-2', key: 'smile-2' }),
      h('line', { x1: '9', y1: '9', x2: '9.01', y2: '9', key: 'smile-3' }),
      h('line', { x1: '15', y1: '9', x2: '15.01', y2: '9', key: 'smile-4' })
    ],
    
    'bar-chart-2': () => [
      h('line', { x1: '12', y1: '20', x2: '12', y2: '10', key: 'chart-1' }),
      h('line', { x1: '18', y1: '20', x2: '18', y2: '4', key: 'chart-2' }),
      h('line', { x1: '6', y1: '20', x2: '6', y2: '16', key: 'chart-3' })
    ],
    
    'video': () => [
      h('polygon', { points: '23 7 16 12 23 17 23 7', key: 'video-1' }),
      h('rect', { x: '1', y: '5', width: '15', height: '14', rx: '2', ry: '2', key: 'video-2' })
    ],
    
    'image': () => [
      h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2', key: 'image-1' }),
      h('circle', { cx: '8.5', cy: '8.5', r: '1.5', key: 'image-2' }),
      h('polyline', { points: '21,15 16,10 5,21', key: 'image-3' })
    ],
    
    'bookmark': () => h('path', { d: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' }),
    
    'flag': () => h('path', { d: 'M4 15s1-1 5-1 5 1 5 1v6c0 0-1 1-5 1s-5-1-5-1V15z M4 3h12v12' }),
    
    'trash-2': () => [
      h('polyline', { points: '3 6 5 6 21 6', key: 'trash-1' }),
      h('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', key: 'trash-2' }),
      h('line', { x1: '10', y1: '11', x2: '10', y2: '17', key: 'trash-3' }),
      h('line', { x1: '14', y1: '11', x2: '14', y2: '17', key: 'trash-4' })
    ],
    
    'link': () => [
      h('path', { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', key: 'link-1' }),
      h('path', { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71', key: 'link-2' })
    ],
    
    'edit-2': () => [
      h('path', { d: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z', key: 'edit-1' })
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
