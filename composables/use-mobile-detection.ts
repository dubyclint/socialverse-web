// composables/use-mobile-detection.ts
// Mobile device detection composable

import { ref, onMounted, onUnmounted } from 'vue'

export const useMobileDetection = () => {
  const isMobile = ref(false)
  const screenSize = ref({ width: 0, height: 0 })
  const isTablet = ref(false)
  const deviceOrientation = ref('portrait')

  const detectDevice = () => {
    screenSize.value = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    
    // Mobile detection: < 768px
    isMobile.value = screenSize.value.width < 768
    // Tablet detection: 768px - 1024px
    isTablet.value = screenSize.value.width >= 768 && screenSize.value.width < 1024
    
    // Orientation detection
    deviceOrientation.value = screenSize.value.width > screenSize.value.height ? 'landscape' : 'portrait'
  }

  onMounted(() => {
    detectDevice()
    window.addEventListener('resize', detectDevice)
    window.addEventListener('orientationchange', detectDevice)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', detectDevice)
    window.removeEventListener('orientationchange', detectDevice)
  })

  return {
    isMobile,
    screenSize,
    isTablet,
    deviceOrientation,
    detectDevice
  }
}
