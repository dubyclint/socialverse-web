<template>
  <svg
    :width="computedSize"
    :height="computedSize"
    :viewBox="iconData.viewBox"
    :class="['icon', `icon-${sanitizedName}`]"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-label="name"
  >
    <g v-html="iconData.path" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface IconData {
  viewBox: string
  path: string
}

interface IconsMap {
  [key: string]: IconData
}

const props = withDefaults(
  defineProps<{
    name: string
    size?: string | number
  }>(),
  {
    size: 24
  }
)

const computedSize = computed(() => {
  if (typeof props.size === 'number') return props.size
  if (typeof props.size === 'string') {
    const num = parseInt(props.size, 10)
    return isNaN(num) ? 24 : num
  }
  return 24
})

const sanitizedName = computed(() => {
  return props.name.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
})

const icons: IconsMap = {
  'alert-circle': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>' },
  'alert-triangle': { viewBox: '0 0 24 24', path: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>' },
  'check': { viewBox: '0 0 24 24', path: '<polyline points="20 6 9 17 4 12"></polyline>' },
  'check-circle': { viewBox: '0 0 24 24', path: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' },
  'x': { viewBox: '0 0 24 24', path: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>' },
  'x-circle': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' },
  'info': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>' },
  'arrow-left': { viewBox: '0 0 24 24', path: '<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>' },
  'arrow-right': { viewBox: '0 0 24 24', path: '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>' },
  'arrow-right-circle': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line>' },
  'arrow-up': { viewBox: '0 0 24 24', path: '<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>' },
  'arrow-down': { viewBox: '0 0 24 24', path: '<line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>' },
  'chevron-left': { viewBox: '0 0 24 24', path: '<polyline points="15 18 9 12 15 6"></polyline>' },
  'chevron-right': { viewBox: '0 0 24 24', path: '<polyline points="9 18 15 12 9 6"></polyline>' },
  'chevron-down': { viewBox: '0 0 24 24', path: '<polyline points="6 9 12 15 18 9"></polyline>' },
  'chevron-up': { viewBox: '0 0 24 24', path: '<polyline points="18 15 12 9 6 15"></polyline>' },
  'mail': { viewBox: '0 0 24 24', path: '<rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M7 10l5 3.5L17 10"></path>' },
  'message-square': { viewBox: '0 0 24 24', path: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>' },
  'phone': { viewBox: '0 0 24 24', path: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>' },
  'phone-off': { viewBox: '0 0 24 24', path: '<path d="M23 1l-7 5m0 0L5.228 13.228M1 23l5-7m0 0l7.228-7.228"></path><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>' },
  'reply': { viewBox: '0 0 24 24', path: '<polyline points="9 17 4 12 9 7"></polyline><path d="M4 12h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-5.5"></path>' },
  'share': { viewBox: '0 0 24 24', path: '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>' },
  'camera': { viewBox: '0 0 24 24', path: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>' },
  'image': { viewBox: '0 0 24 24', path: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>' },
  'music': { viewBox: '0 0 24 24', path: '<path d="M9 18V5m0 0L4 8m5-3l5-3v13a4 4 0 1 1-5-3.995"></path>' },
  'play': { viewBox: '0 0 24 24', path: '<polygon points="5 3 19 12 5 21 5 3"></polygon>' },
  'pause': { viewBox: '0 0 24 24', path: '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>' },
  'volume-2': { viewBox: '0 0 24 24', path: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a6.5 6.5 0 0 1 0 9.07m2.12-10.83a10.5 10.5 0 0 1 0 14.14"></path>' },
  'mic': { viewBox: '0 0 24 24', path: '<path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2m14 0a9 9 0 0 1-18 0v-2h18v2z"></path>' },
  'download': { viewBox: '0 0 24 24', path: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>' },
  'upload': { viewBox: '0 0 24 24', path: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>' },
  'bell': { viewBox: '0 0 24 24', path: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>' },
  'bell-off': { viewBox: '0 0 24 24', path: '<path d="M13.73 21a2 2 0 0 1-3.46 0M18 8A6 6 0 0 0 6.46 6.46M18 8c0 7-3 9-3 9H6"></path><line x1="1" y1="1" x2="23" y2="23"></line>' },
  'circle': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="10"></circle>' },
  'copy': { viewBox: '0 0 24 24', path: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>' },
  'edit': { viewBox: '0 0 24 24', path: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' },
  'trash': { viewBox: '0 0 24 24', path: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>' },
  'filter': { viewBox: '0 0 24 24', path: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>' },
  'grid': { viewBox: '0 0 24 24', path: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>' },
  'list': { viewBox: '0 0 24 24', path: '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>' },
  'menu': { viewBox: '0 0 24 24', path: '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>' },
  'more-horizontal': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>' },
  'more-vertical': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle>' },
  'file': { viewBox: '0 0 24 24', path: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline>' },
  'folder': { viewBox: '0 0 24 24', path: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' },
  'map-pin': { viewBox: '0 0 24 24', path: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>' },
  'globe': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>' },
  'calendar': { viewBox: '0 0 24 24', path: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>' },
  'clock': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>' },
  'user': { viewBox: '0 0 24 24', path: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>' },
  'users': { viewBox: '0 0 24 24', path: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
  'log-in': { viewBox: '0 0 24 24', path: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line>' },
  'log-out': { viewBox: '0 0 24 24', path: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>' },
  'sparkles': { viewBox: '0 0 24 24', path: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>' },
  'star': { viewBox: '0 0 24 24', path: '<polygon points="12 2 15.09 10.26 24 10.27 17 16.14 19.09 24.41 12 18.54 4.91 24.41 7 16.14 0 10.27 8.91 10.26 12 2"></polygon>' },
  'heart': { viewBox: '0 0 24 24', path: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>' },
  'gift': { viewBox: '0 0 24 24', path: '<polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><path d="M12 7V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2"></path><path d="M12 7V5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2"></path>' },
  'external-link': { viewBox: '0 0 24 24', path: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>' },
  'eye': { viewBox: '0 0 24 24', path: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>' },
  'eye-off': { viewBox: '0 0 24 24', path: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>' },
  'maximize': { viewBox: '0 0 24 24', path: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>' },
  'minimize': { viewBox: '0 0 24 24', path: '<path d="M8 19H5a2 2 0 0 1-2-2v-3m18 0v3a2 2 0 0 1-2 2h-3m0-18h3a2 2 0 0 1 2 2v3M3 8V5a2 2 0 0 1 2-2h3"></path>' },
  'zoom-in': { viewBox: '0 0 24 24', path: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line>' },
  'zoom-out': { viewBox: '0 0 24 24', path: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line>' },
  'facebook': { viewBox: '0 0 24 24', path: '<path d="M18 2h-3a6 6 0 0 0-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a1 1 0 0 1 1-1h3z"></path>' },
  'instagram': { viewBox: '0 0 24 24', path: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="white"></path><circle cx="17.5" cy="6.5" r="1.5" fill="white"></circle>' },
  'twitter': { viewBox: '0 0 24 24', path: '<path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2s9 5 20 5a9.5 9.5 0 0 0-9-5.5c4.75 2.25 7-7 7-7"></path>' },
  'linkedin': { viewBox: '0 0 24 24', path: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"></path><circle cx="4" cy="4" r="2"></circle>' },
  'bar-chart': { viewBox: '0 0 24 24', path: '<line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line>' },
  'layers': { viewBox: '0 0 24 24', path: '<polygon points="12 2 2 7 2 17 12 22 22 17 22 7 12 2"></polygon><polyline points="2 7 12 12 22 7"></polyline><polyline points="2 17 12 12 22 17"></polyline>' },
  'minus-circle': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line>' },
  'plus-circle': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line>' },
  'settings': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6m-16.78 7.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>' },
  'search': { viewBox: '0 0 24 24', path: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>' },
  'home': { viewBox: '0 0 24 24', path: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>' },
  'inbox': { viewBox: '0 0 24 24', path: '<polyline points="22 12 18 12 15 21 9 21 6 12 2 12"></polyline><path d="M6 5h12a2 2 0 0 1 2 2v6H4V7a2 2 0 0 1 2-2z"></path>' },
  'loader': { viewBox: '0 0 24 24', path: '<line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.22" y1="4.22" x2="7.07" y2="7.07"></line><line x1="16.93" y1="16.93" x2="19.78" y2="19.78"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.22" y1="19.78" x2="7.07" y2="16.93"></line><line x1="16.93" y1="7.07" x2="19.78" y2="4.22"></line>' },
  'refresh': { viewBox: '0 0 24 24', path: '<polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>' },
  'trash-2': { viewBox: '0 0 24 24', path: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>' },
  'send': { viewBox: '0 0 24 24', path: '<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>' },
  'bookmark': { viewBox: '0 0 24 24', path: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>' },
  'flag': { viewBox: '0 0 24 24', path: '<path d="M4 15s1-1 5-1 5 2 10 0V4s-1 1-5 1-5-2-10 0"></path><line x1="4" y1="4" x2="4" y2="21"></line>' },
}

const getIconName = (name: string): string => {
  if (name.includes(':')) {
    const parts = name.split(':')
    return parts[parts.length - 1] ?? name
  }
  return name
}

const iconData = computed<IconData>(() => {
  const cleanName = getIconName(props.name).toLowerCase()
  
  if (icons[cleanName]) {
    return icons[cleanName]
  }
  
  const hyphenatedName = cleanName.replace(/_/g, '-')
  if (icons[hyphenatedName]) {
    return icons[hyphenatedName]
  }
  
  return {
    viewBox: '0 0 24 24',
    path: '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v.01"></path><path d="M12 12a1 1 0 0 0-.5.1 1 1 0 0 0 .5 1.9 1 1 0 0 0 .5-.1 1 1 0 0 0-.5-1.9"></path>'
  }
})
</script>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  color: currentColor;
  flex-shrink: 0;
}
</style>
