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
  'aperture': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="10"></circle><path d="m14.31 8 5.74 9.94"></path><path d="M9.69 8h11.48"></path><path d="m7.38 12 5.74-9.94"></path><path d="M9.69 16 3.95 6.06"></path><path d="M14.31 16H2.83"></path><path d="m16.62 12-5.74 9.94"></path>' },
  'archive': { viewBox: '0 0 24 24', path: '<rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path>' },
  'arrow-down-left': { viewBox: '0 0 24 24', path: '<path d="M17 7 7 17"></path><path d="M17 17H7V7"></path>' },
  'arrow-up-right': { viewBox: '0 0 24 24', path: '<path d="M7 7h10v10"></path><path d="M7 17 17 7"></path>' },
  'bar-chart-2': { viewBox: '0 0 24 24', path: '<path d="M5 21v-6"></path><path d="M12 21V3"></path><path d="M19 21V9"></path>' },
  'briefcase': { viewBox: '0 0 24 24', path: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path><rect width="20" height="14" x="2" y="6" rx="2"></rect>' },
  'check-check': { viewBox: '0 0 24 24', path: '<path d="M18 6 7 17l-5-5"></path><path d="m22 10-7.5 7.5L13 16"></path>' },
  'compass': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="10"></circle><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"></path>' },
  'corner-up-left': { viewBox: '0 0 24 24', path: '<path d="M20 20v-7a4 4 0 0 0-4-4H4"></path><path d="M9 14 4 9l5-5"></path>' },
  'dollar-sign': { viewBox: '0 0 24 24', path: '<line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>' },
  'edit-2': { viewBox: '0 0 24 24', path: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>' },
  'edit-3': { viewBox: '0 0 24 24', path: '<path d="M13 21h8"></path><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>' },
  'file-spreadsheet': { viewBox: '0 0 24 24', path: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M8 13h2"></path><path d="M14 13h2"></path><path d="M8 17h2"></path><path d="M14 17h2"></path>' },
  'file-text': { viewBox: '0 0 24 24', path: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>' },
  'fingerprint': { viewBox: '0 0 24 24', path: '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"></path><path d="M14 13.12c0 2.38 0 6.38-1 8.88"></path><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"></path><path d="M2 12a10 10 0 0 1 18-6"></path><path d="M2 16h.01"></path><path d="M21.8 16c.2-2 .131-5.354 0-6"></path><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"></path><path d="M8.65 22c.21-.66.45-1.32.57-2"></path><path d="M9 6.8a6 6 0 0 1 9 5.2v2"></path>' },
  'grid-3x3': { viewBox: '0 0 24 24', path: '<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M3 15h18"></path><path d="M9 3v18"></path><path d="M15 3v18"></path>' },
  'hash': { viewBox: '0 0 24 24', path: '<line x1="4" x2="20" y1="9" y2="9"></line><line x1="4" x2="20" y1="15" y2="15"></line><line x1="10" x2="8" y1="3" y2="21"></line><line x1="16" x2="14" y1="3" y2="21"></line>' },
  'headphones': { viewBox: '0 0 24 24', path: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"></path>' },
  'life-buoy': { viewBox: '0 0 24 24', path: '<circle cx="12" cy="12" r="10"></circle><path d="m4.93 4.93 4.24 4.24"></path><path d="m14.83 9.17 4.24-4.24"></path><path d="m14.83 14.83 4.24 4.24"></path><path d="m9.17 14.83-4.24 4.24"></path><circle cx="12" cy="12" r="4"></circle>' },
  'link': { viewBox: '0 0 24 24', path: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>' },
  'lock': { viewBox: '0 0 24 24', path: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' },
  'megaphone': { viewBox: '0 0 24 24', path: '<path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"></path><path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14"></path><path d="M8 6v8"></path>' },
  'message-circle': { viewBox: '0 0 24 24', path: '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path>' },
  'mic-off': { viewBox: '0 0 24 24', path: '<path d="M12 19v3"></path><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"></path><path d="M16.95 16.95A7 7 0 0 1 5 12v-2"></path><path d="M18.89 13.23A7 7 0 0 0 19 12v-2"></path><path d="m2 2 20 20"></path><path d="M9 9v3a3 3 0 0 0 5.12 2.12"></path>' },
  'monitor': { viewBox: '0 0 24 24', path: '<rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line>' },
  'paperclip': { viewBox: '0 0 24 24', path: '<path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"></path>' },
  'phone-missed': { viewBox: '0 0 24 24', path: '<path d="m16 2 6 6"></path><path d="m22 2-6 6"></path><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>' },
  'pin': { viewBox: '0 0 24 24', path: '<path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path>' },
  'plus': { viewBox: '0 0 24 24', path: '<path d="M5 12h14"></path><path d="M12 5v14"></path>' },
  'plus-square': { viewBox: '0 0 24 24', path: '<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M8 12h8"></path><path d="M12 8v8"></path>' },
  'pointer': { viewBox: '0 0 24 24', path: '<path d="M22 14a8 8 0 0 1-8 8"></path><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"></path><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"></path><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"></path><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>' },
  'radio': { viewBox: '0 0 24 24', path: '<path d="M16.247 7.761a6 6 0 0 1 0 8.478"></path><path d="M19.075 4.933a10 10 0 0 1 0 14.134"></path><path d="M4.925 19.067a10 10 0 0 1 0-14.134"></path><path d="M7.753 16.239a6 6 0 0 1 0-8.478"></path><circle cx="12" cy="12" r="2"></circle>' },
  'refresh-cw': { viewBox: '0 0 24 24', path: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path>' },
  'rocket': { viewBox: '0 0 24 24', path: '<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"></path><path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"></path>' },
  'share-2': { viewBox: '0 0 24 24', path: '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>' },
  'shield': { viewBox: '0 0 24 24', path: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>' },
  'shield-check': { viewBox: '0 0 24 24', path: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path>' },
  'sidebar': { viewBox: '0 0 24 24', path: '<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 3v18"></path>' },
  'signal': { viewBox: '0 0 24 24', path: '<path d="M2 20h.01"></path><path d="M7 20v-4"></path><path d="M12 20v-8"></path><path d="M17 20V8"></path><path d="M22 4v16"></path>' },
  'smile': { viewBox: '0 0 24 24', path: '<path d="M15 10V9"></path><path d="M16.472 15a6 6 0 01-8.943 0"></path><path d="M9 10V9"></path><circle cx="12" cy="12" r="10"></circle>' },
  'text': { viewBox: '0 0 24 24', path: '<path d="M21 5H3"></path><path d="M15 12H3"></path><path d="M17 19H3"></path>' },
  'trending-up': { viewBox: '0 0 24 24', path: '<path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path>' },
  'type': { viewBox: '0 0 24 24', path: '<path d="M12 4v16"></path><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"></path><path d="M9 20h6"></path>' },
  'unlock': { viewBox: '0 0 24 24', path: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>' },
  'user-check': { viewBox: '0 0 24 24', path: '<path d="m16 11 2 2 4-4"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>' },
  'user-plus': { viewBox: '0 0 24 24', path: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line>' },
  'user-x': { viewBox: '0 0 24 24', path: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="17" x2="22" y1="8" y2="13"></line><line x1="22" x2="17" y1="8" y2="13"></line>' },
  'verified': { viewBox: '0 0 24 24', path: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path><path d="m16 9-5.5 5.5L8 12"></path>' },
  'video': { viewBox: '0 0 24 24', path: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect>' },
  'video-off': { viewBox: '0 0 24 24', path: '<path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196"></path><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"></path><path d="m2 2 20 20"></path>' },
  'volume-x': { viewBox: '0 0 24 24', path: '<path d="M11 4.702a.7.7 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.7.7 0 0 0 11 19.298z"></path><path d="m16.5 14.5 5-5"></path><path d="m16.5 9.5 5 5"></path>' },
  'wallet': { viewBox: '0 0 24 24', path: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>' },
  'badge-check': { viewBox: '0 0 24 24', path: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path><path d="m16 9-5.5 5.5L8 12"></path>' },
  'signal-low': { viewBox: '0 0 24 24', path: '<path d="M2 20h.01"></path><path d="M7 20v-4"></path>' },
  'signal-medium': { viewBox: '0 0 24 24', path: '<path d="M2 20h.01"></path><path d="M7 20v-4"></path><path d="M12 20v-8"></path>' },
  'signal-high': { viewBox: '0 0 24 24', path: '<path d="M2 20h.01"></path><path d="M7 20v-4"></path><path d="M12 20v-8"></path><path d="M17 20V8"></path>' },
  'signal-zero': { viewBox: '0 0 24 24', path: '<path d="M2 20h.01"></path>' }
}

const getIconName = (name: string): string => {
  if (name.includes(':')) {
    const parts = name.split(':')
    return parts[parts.length - 1] ?? name
  }
  return name
}


// Names used by other icon sets (mdi:, lucide:) mapped to this registry.
const aliases: Record<string, string> = {
  'account': 'user',
  'close': 'x',
  'loading': 'loader',
  'check-decagram': 'badge-check',
  'microphone-off': 'mic-off',
  'heart-filled': 'heart',
  'chat': 'message-circle',
  'comment': 'message-square',
  'live': 'radio',
  'stream': 'radio',
  'signal-cellular-1': 'signal-low',
  'signal-cellular-2': 'signal-medium',
  'signal-cellular-3': 'signal-high',
  'signal-cellular-off': 'signal-zero'
}

const iconData = computed<IconData>(() => {
  const rawName = getIconName(props.name).toLowerCase()
  const cleanName = aliases[rawName] ?? rawName
  
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
