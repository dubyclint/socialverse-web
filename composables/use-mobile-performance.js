// composables/useMobilePerformance.js
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export function useMobilePerformance() {
  const deviceInfo = ref({
    isMobile: false,
    isTablet: false,
    isLowEnd: false,
    memoryGB: 0,
    cores: 0,
    connection: 'unknown',
    pixelRatio: 1
  })

  const performanceMetrics = ref({
    fps: 60,
    memoryUsage: 0,
    batteryLevel: 100,
    isCharging: false,
    networkSpeed: 0,
    latency: 0
  })

  const optimizationSettings = ref({
    videoQuality: 'auto',
    frameRate: 30,
    enableHardwareAcceleration: true,
    reducedAnimations: false,
    lowPowerMode: false,
    adaptiveBitrate: true
  })

  let performanceMonitor = null
  let batteryMonitor = null
  let networkMonitor = null

  // Device detection and capability assessment
  const detectDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent)
    
    // Detect low-end devices
    const isLowEnd = detectLowEndDevice()
    
    // Get device memory (if available)
    const memoryGB = navigator.deviceMemory || 0
    
    // Get CPU cores
    const cores = navigator.hardwareConcurrency || 0
    
    // Get pixel ratio
    const pixelRatio = window.devicePixelRatio || 1
    
    // Get connection info
    const connection = navigator.connection?.effectiveType || 'unknown'

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

  const detectLowEndDevice = () => {
    // Multiple indicators for low-end devices
    const indicators = []
    
    // Memory indicator
    if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
      indicators.push('low-memory')
    }
    
    // CPU indicator
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
      indicators.push('low-cpu')
    }
    
    // Connection indicator
    if (navigator.connection) {
      const slowConnections = ['slow-2g', '2g', '3g']
      if (slowConnections.includes(navigator.connection.effectiveType)) {
        indicators.push('slow-connection')
      }
    }
    
    // Performance indicator (rough benchmark)
    const start = performance.now()
    for (let i = 0; i < 100000; i++) {
      Math.random()
    }
    const benchmarkTime = performance.now() - start
    
    if (benchmarkTime > 10) { // Arbitrary threshold
      indicators.push('slow-performance')
    }
    
    return indicators.length >= 2
  }

  // Performance monitoring
  const startPerformanceMonitoring = () => {
    let frameCount = 0
    let lastTime = performance.now()
    
    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        performanceMetrics.value.fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime
        
        // Adjust settings based on FPS
        if (performanceMetrics.value.fps < 30 && !optimizationSettings.value.lowPowerMode) {
          enableLowPowerMode()
        }
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
    
    // Memory monitoring
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = performance.memory
        performanceMetrics.value.memoryUsage = Math.round(
          (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        )
        
        // Enable memory optimizations if usage is high
        if (performanceMetrics.value.memoryUsage > 80) {
          enableMemoryOptimizations()
        }
      }
      
      performanceMonitor = setInterval(updateMemoryUsage, 5000)
    }
  }

  // Battery monitoring
  const startBatteryMonitoring = async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery()
        
        const updateBatteryInfo = () => {
          performanceMetrics.value.batteryLevel = Math.round(battery.level * 100)
          performanceMetrics.value.isCharging = battery.charging
          
          // Enable power saving mode when battery is low
          if (performanceMetrics.value.batteryLevel < 20 && !performanceMetrics.value.isCharging) {
            enableLowPowerMode()
          }
        }
        
        battery.addEventListener('levelchange', updateBatteryInfo)
        battery.addEventListener('chargingchange', updateBatteryInfo)
        
        updateBatteryInfo()
        batteryMonitor = battery
      }
    } catch (error) {
      console.warn('Battery API not supported:', error)
    }
  }

  // Network monitoring
  const startNetworkMonitoring = () => {
    if ('connection' in navigator) {
      const connection = navigator.connection
      
      const updateNetworkInfo = () => {
        performanceMetrics.value.networkSpeed = connection.downlink || 0
        deviceInfo.value.connection = connection.effectiveType || 'unknown'
        
        // Adjust video quality based on connection
        adjustVideoQualityForNetwork()
      }
      
      connection.addEventListener('change', updateNetworkInfo)
      updateNetworkInfo()
      
      networkMonitor = connection
    }
  }

  // Optimization functions
  const enableLowPowerMode = () => {
    if (optimizationSettings.value.lowPowerMode) return
    
    console.log('Enabling low power mode')
    optimizationSettings.value.lowPowerMode = true
    optimizationSettings.value.frameRate = 15
    optimizationSettings.value.reducedAnimations = true
    optimizationSettings.value.videoQuality = '360p'
    
    // Reduce animation frame rate
    document.documentElement.style.setProperty('--animation-duration', '0.1s')
  }

  const enableMemoryOptimizations = () => {
    console.log('Enabling memory optimizations')
    
    // Reduce cache sizes
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('images') || name.includes('videos')) {
            caches.delete(name)
          }
        })
      })
    }
    
    // Trigger garbage collection if available
    if (window.gc) {
      window.gc()
    }
  }

  const adjustVideoQualityForNetwork = () => {
    const speed = performanceMetrics.value.networkSpeed
    const connection = deviceInfo.value.connection
    
    let recommendedQuality = 'auto'
    
    if (connection === 'slow-2g' || connection === '2g') {
      recommendedQuality = '240p'
    } else if (connection === '3g' || speed < 1) {
      recommendedQuality = '360p'
    } else if (connection === '4g' && speed < 5) {
      recommendedQuality = '480p'
    } else if (speed >= 5) {
      recommendedQuality = deviceInfo.value.isLowEnd ? '720p' : 'auto'
    }
    
    if (optimizationSettings.value.videoQuality !== recommendedQuality) {
      console.log(`Adjusting video quality to ${recommendedQuality} based on network`)
      optimizationSettings.value.videoQuality = recommendedQuality
    }
  }

  // Adaptive streaming configuration
  const getAdaptiveStreamingConfig = () => {
    const config = {
      maxBitrate: 5000000, // 5 Mbps default
      minBitrate: 200000,  // 200 kbps minimum
      startBitrate: 1000000, // 1 Mbps start
      bufferLength: 30,
      maxBufferLength: 60
    }
    
    // Adjust based on device capabilities
    if (deviceInfo.value.isLowEnd) {
      config.maxBitrate = 2000000 // 2 Mbps max for low-end
      config.bufferLength = 15
      config.maxBufferLength = 30
    }
    
    // Adjust based on connection
    const speed = performanceMetrics.value.networkSpeed
    if (speed > 0) {
      config.maxBitrate = Math.min(config.maxBitrate, speed * 1000000 * 0.8) // 80% of available bandwidth
    }
    
    // Adjust based on battery
    if (optimizationSettings.value.lowPowerMode) {
      config.maxBitrate = Math.min(config.maxBitrate, 1000000) // 1 Mbps max in low power mode
    }
    
    return config
  }

  // Touch optimization
  const optimizeTouchEvents = () => {
    // Add passive event listeners for better scroll performance
    const passiveEvents = ['touchstart', 'touchmove', 'wheel']
    
    passiveEvents.forEach(event => {
      document.addEventListener(event, () => {}, { passive: true })
    })
    
    // Optimize touch delay
    if ('ontouchstart' in window) {
      document.documentElement.style.touchAction = 'manipulation'
    }
  }

  // Image optimization
  const optimizeImages = () => {
    // Use WebP format if supported
    const supportsWebP = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    }
    
    // Lazy load images with Intersection Observer
    const setupLazyLoading = () => {
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target
              if (img.dataset.src) {
                img.src = img.dataset.src
                img.
                img.src = img.dataset.src
                img.removeAttribute('data-src')
                imageObserver.unobserve(img)
              }
            }
          })
        }, {
          rootMargin: '50px 0px',
          threshold: 0.01
        })
        
        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img)
        })
      }
    }
    
    return {
      supportsWebP: supportsWebP(),
      setupLazyLoading
    }
  }

  // Viewport optimization
  const optimizeViewport = () => {
    // Set optimal viewport meta tag for mobile
    let viewportMeta = document.querySelector('meta[name="viewport"]')
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta')
      viewportMeta.name = 'viewport'
      document.head.appendChild(viewportMeta)
    }
    
    const viewportContent = deviceInfo.value.isMobile
      ? 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      : 'width=device-width, initial-scale=1.0'
    
    viewportMeta.content = viewportContent
    
    // Prevent zoom on input focus (iOS)
    if (deviceInfo.value.isMobile) {
      const inputs = document.querySelectorAll('input, select, textarea')
      inputs.forEach(input => {
        if (parseFloat(getComputedStyle(input).fontSize) < 16) {
          input.style.fontSize = '16px'
        }
      })
    }
  }

  // Service Worker optimization
  const optimizeServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        
        // Update service worker based on device capabilities
        if (registration.active) {
          registration.active.postMessage({
            type: 'DEVICE_INFO',
            deviceInfo: deviceInfo.value,
            optimizationSettings: optimizationSettings.value
          })
        }
        
        console.log('Service Worker registered successfully')
      } catch (error) {
        console.warn('Service Worker registration failed:', error)
      }
    }
  }

  // CSS optimization
  const optimizeCSS = () => {
    // Add CSS custom properties for performance settings
    const root = document.documentElement
    
    root.style.setProperty('--device-pixel-ratio', deviceInfo.value.pixelRatio.toString())
    root.style.setProperty('--is-mobile', deviceInfo.value.isMobile ? '1' : '0')
    root.style.setProperty('--is-low-end', deviceInfo.value.isLowEnd ? '1' : '0')
    
    // Optimize animations based on device capabilities
    if (optimizationSettings.value.reducedAnimations) {
      root.style.setProperty('--animation-duration', '0.1s')
      root.style.setProperty('--transition-duration', '0.1s')
    }
    
    // Add performance-focused CSS classes
    document.body.classList.toggle('mobile-device', deviceInfo.value.isMobile)
    document.body.classList.toggle('low-end-device', deviceInfo.value.isLowEnd)
    document.body.classList.toggle('low-power-mode', optimizationSettings.value.lowPowerMode)
  }

  // Computed properties
  const isOptimizedForMobile = computed(() => {
    return deviceInfo.value.isMobile && (
      optimizationSettings.value.lowPowerMode ||
      deviceInfo.value.isLowEnd ||
      performanceMetrics.value.batteryLevel < 30
    )
  })

  const recommendedVideoSettings = computed(() => {
    const settings = {
      quality: optimizationSettings.value.videoQuality,
      frameRate: optimizationSettings.value.frameRate,
      enableHardwareAcceleration: optimizationSettings.value.enableHardwareAcceleration,
      bufferSize: deviceInfo.value.isLowEnd ? 'small' : 'normal'
    }
    
    // Override for very low-end devices
    if (deviceInfo.value.memoryGB <= 1 || performanceMetrics.value.memoryUsage > 90) {
      settings.quality = '240p'
      settings.frameRate = 15
      settings.bufferSize = 'minimal'
    }
    
    return settings
  })

  const performanceScore = computed(() => {
    let score = 100
    
    // Deduct points for poor performance indicators
    if (performanceMetrics.value.fps < 30) score -= 20
    if (performanceMetrics.value.memoryUsage > 80) score -= 15
    if (deviceInfo.value.isLowEnd) score -= 20
    if (performanceMetrics.value.batteryLevel < 20) score -= 10
    if (deviceInfo.value.connection === '2g' || deviceInfo.value.connection === 'slow-2g') score -= 25
    
    return Math.max(0, score)
  })

  // Watchers
  watch(() => performanceMetrics.value.batteryLevel, (newLevel) => {
    if (newLevel < 15 && !optimizationSettings.value.lowPowerMode) {
      enableLowPowerMode()
    } else if (newLevel > 50 && optimizationSettings.value.lowPowerMode && performanceMetrics.value.isCharging) {
      // Disable low power mode when charging and battery is sufficient
      optimizationSettings.value.lowPowerMode = false
      optimizationSettings.value.frameRate = 30
      optimizationSettings.value.reducedAnimations = false
    }
  })

  watch(() => performanceMetrics.value.fps, (newFPS) => {
    if (newFPS < 20) {
      // Emergency performance mode
      optimizationSettings.value.videoQuality = '240p'
      optimizationSettings.value.frameRate = 15
      enableMemoryOptimizations()
    }
  })

  // Lifecycle
  onMounted(() => {
    detectDevice()
    startPerformanceMonitoring()
    startBatteryMonitoring()
    startNetworkMonitoring()
    optimizeTouchEvents()
    optimizeViewport()
    optimizeCSS()
    optimizeServiceWorker()
    
    // Setup image optimization
    const imageOptimizer = optimizeImages()
    imageOptimizer.setupLazyLoading()
  })

  onUnmounted(() => {
    if (performanceMonitor) {
      clearInterval(performanceMonitor)
    }
    
    if (batteryMonitor) {
      batteryMonitor.removeEventListener('levelchange', () => {})
      batteryMonitor.removeEventListener('chargingchange', () => {})
    }
    
    if (networkMonitor) {
      networkMonitor.removeEventListener('change', () => {})
    }
  })

  return {
    // State
    deviceInfo,
    performanceMetrics,
    optimizationSettings,
    
    // Computed
    isOptimizedForMobile,
    recommendedVideoSettings,
    performanceScore,
    
    // Methods
    enableLowPowerMode,
    enableMemoryOptimizations,
    getAdaptiveStreamingConfig,
    adjustVideoQualityForNetwork,
    optimizeImages,
    optimizeViewport
  }
}
