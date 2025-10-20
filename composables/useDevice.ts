import { ref, onMounted } from 'vue'

export const isMobile = ref(false)
export const screenSize = ref({ width: 0, height: 0 })

export function detectDevice() {
  screenSize.value = {
    width: window.innerWidth,
    height: window.innerHeight
  }
  isMobile.value = screenSize.value.width < 768
}

onMounted(() => {
  detectDevice()
  window.addEventListener('resize', detectDevice)
})
