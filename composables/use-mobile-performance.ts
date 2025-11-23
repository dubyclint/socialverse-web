// composables/use-mobile-performance.ts
import { ref, computed, readonly, onMounted, onUnmounted, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'

interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isLowEnd: boolean
  memoryGB: number
  cores: number
  connection: string
  pixelRatio: number
}

interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  batteryLevel: number
  isCharging: boolean
  networkSpeed: number
  latency: number
}

interface OptimizationSettings {
  videoQuality: string
  frameRate: number
  enableHardwareAcceleration: boolean
  reducedAnimations: boolean
  lowPowerMode: boolean
  adaptiveBitrate: boolean
}

interface MobilePerformanceReturn {
  deviceInfo: Ref<DeviceInfo>
  performanceMetrics: Ref<PerformanceMetrics>
  optimizationSettings: Ref<OptimizationSettings>
  isOptimized: ComputedRef<boolean>
  detectDevice: () => void
  monitorPerformance: () => void
  optimizeForDevice: () => void
  cleanup: () => void
}

export function useMobilePerformance(): MobilePerformanceReturn {
  const deviceInfo = ref<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isLowEnd: false,
    memoryGB: 0,
    cores: 0,
    connection: 'unknown',
    pixelRatio: 1
  })

  const performanceMetrics = ref<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    batteryLevel: 100,
    isCharging: false,
    networkSpeed: 0,
    latency: 0
  })

  const optimizationSettings = ref<OptimizationSettings>({
    videoQuality: 'auto',
    frameRate: 30,
    enableHardwareAcceleration: true,
    reducedAnimations: false,
    lowPowerMode: false,
    adaptiveBitrate: true
  })

  let performanceMonitor: number | null = null
  let batteryMonitor: number | null = null
  let networkMonitor: number | null = null

  const isOptimized = computed(() => {
    return (
      optimizationSettings.value.videoQuality !== 'auto' &&
      optimizationSettings.value.frameRate <= 30 &&
      optimizationSettings.value.adaptiveBitrate
    )
  })

  const detectDevice = (): void => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent)
    const isLowEnd = detectLowEndDevice()
    const memoryGB = (navigator as any).deviceMemory || 0
    const cores = (navigator as any).hardwareConcurrency || 0
    const pixelRatio = window.devicePixelRatio || 1
    const connection = (navigator as any).connection?.effectiveType || 'unknown'

    deviceInfo.value = {
      isMobile,
      isTablet,
      isLowEnd,
      memoryGB,
      cores,
      connection,
      pixelRatio
    }

    console.log('Device detected:', deviceInfo.value)
  }

  const detectLowEndDevice = (): boolean => {
    const indicators: string[] = []

    if ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 2) {
      indicators.push('low-memory')
    }

    if ((navigator as any).hardwareConcurrency && (navigator as any).hardwareConcurrency <= 2) {
      indicators.push('low-cpu')
    }

    const connection = (navigator as any).connection?.effectiveType
    if (connection === '4g' || connection === '3g' || connection === '2g') {
      indicators.push('slow-network')
    }

    return indicators.length >= 2
  }

  const monitorPerformance = (): void => {
    // Monitor FPS
    performanceMonitor = window.setInterval(() => {
      const now = performance.now()
      const fps = Math.round(1000 / (now - (window as any).lastFrameTime || now))
      performanceMetrics.value.fps = Math.min(fps, 60)
      ;(window as any).lastFrameTime = now
    }, 1000)

    // Monitor battery
    if ((navigator as any).getBattery) {
      batteryMonitor = window.setInterval(async () => {
        const battery = await (navigator as any).getBattery()
        performanceMetrics.value.batteryLevel = Math.round(battery.level * 100)
        performanceMetrics.value.isCharging = battery.charging
      }, 5000)
    }

    // Monitor network
    networkMonitor = window.setInterval(() => {
      const connection = (navigator as any).connection
      if (connection) {
        performanceMetrics.value.networkSpeed = connection.downlink || 0
      }
    }, 2000)
  }

  const optimizeForDevice = (): void => {
    if (deviceInfo.value.isLowEnd) {
      optimizationSettings.value.videoQuality = 'low'
      optimizationSettings.value.frameRate = 24
      optimizationSettings.value.enableHardwareAcceleration = false
      optimizationSettings.value.reducedAnimations = true
      optimizationSettings.value.lowPowerMode = true
    } else if (deviceInfo.value.isMobile) {
      optimizationSettings.value.videoQuality = 'medium'
      optimizationSettings.value.frameRate = 30
      optimizationSettings.value.reducedAnimations = true
    } else {
      optimizationSettings.value.videoQuality = 'high'
      optimizationSettings.value.frameRate = 60
    }
  }

  const cleanup = (): void => {
    if (performanceMonitor) clearInterval(performanceMonitor)
    if (batteryMonitor) clearInterval(batteryMonitor)
    if (networkMonitor) clearInterval(networkMonitor)
  }

  onMounted(() => {
    detectDevice()
    monitorPerformance()
    optimizeForDevice()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    deviceInfo: readonly(deviceInfo),
    performanceMetrics: readonly(performanceMetrics),
    optimizationSettings: readonly(optimizationSettings),
    isOptimized,
    detectDevice,
    monitorPerformance,
    optimizeForDevice,
    cleanup
  }
}
