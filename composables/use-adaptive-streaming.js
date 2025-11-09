// composables/useAdaptiveStreaming.js
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export function useAdaptiveStreaming(baseStreamUrl) {
  const selectedQuality = ref('auto')
  const availableQualities = ref([])
  const currentBitrate = ref(0)
  const networkSpeed = ref(0)
  const bufferHealth = ref(100)
  const isBuffering = ref(false)
  const adaptiveEnabled = ref(true)
  
  let hls = null
  let speedTestInterval = null
  let qualityCheckInterval = null
  let networkMonitor = null

  // HLS.js integration for adaptive streaming
  const initializeHLS = async (videoElement) => {
    if (!window.Hls) {
      // Dynamically import HLS.js
      const HLS = await import('hls.js')
      window.Hls = HLS.default
    }

    if (window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 3,
        maxFragLookUpTolerance: 0.25,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        liveDurationInfinity: false,
        liveBackBufferLength: 0,
        maxLiveSyncPlaybackRate: 1.5,
        liveSyncPlaybackRate: 1,
        // Adaptive bitrate settings
        abrEwmaFastLive: 3.0,
        abrEwmaSlowLive: 9.0,
        abrEwmaFastVoD: 3.0,
        abrEwmaSlowVoD: 9.0,
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
        abrMaxWithRealBitrate: false,
        maxStarvationDelay: 4,
        maxLoadingDelay: 4
      })

      // Event listeners
      hls.on(window.Hls.Events.MANIFEST_PARSED, onManifestParsed)
      hls.on(window.Hls.Events.LEVEL_SWITCHED, onLevelSwitched)
      hls.on(window.Hls.Events.FRAG_BUFFERED, onFragBuffered)
      hls.on(window.Hls.Events.ERROR, onHLSError)
      hls.on(window.Hls.Events.BUFFER_APPENDING, onBufferAppending)
      hls.on(window.Hls.Events.BUFFER_APPENDED, onBufferAppended)

      hls.loadSource(adaptiveStreamUrl.value)
      hls.attachMedia(videoElement)

      return hls
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoElement.src = adaptiveStreamUrl.value
      return null
    } else {
      throw new Error('HLS not supported')
    }
  }

  const onManifestParsed = (event, data) => {
    const qualities = data.levels.map((level, index) => ({
      index,
      height: level.height,
      width: level.width,
      bitrate: level.bitrate,
      label: `${level.height}p`,
      bandwidth: level.bitrate
    }))

    // Add auto quality option
    availableQualities.value = [
      { index: -1, label: 'Auto', bitrate: 0 },
      ...qualities.sort((a, b) => b.bitrate - a.bitrate)
    ]

    console.log('Available qualities:', availableQualities.value)
  }

  const onLevelSwitched = (event, data) => {
    const level = hls.levels[data.level]
    currentBitrate.value = level.bitrate
    
    if (selectedQuality.value === 'auto') {
      const quality = availableQualities.value.find(q => q.bitrate === level.bitrate)
      if (quality) {
        console.log(`Auto-switched to ${quality.label} (${Math.round(level.bitrate / 1000)}kbps)`)
      }
    }
  }

  const onFragBuffered = (event, data) => {
    // Update buffer health
    if (hls && hls.media) {
      const buffered = hls.media.buffered
      if (buffered.length > 0) {
        const bufferEnd = buffered.end(buffered.length - 1)
        const currentTime = hls.media.currentTime
        const bufferLength = bufferEnd - currentTime
        bufferHealth.value = Math.min(100, (bufferLength / 10) * 100) // 10 seconds = 100%
      }
    }
  }

  const onBufferAppending = () => {
    isBuffering.value = true
  }

  const onBufferAppended = () => {
    isBuffering.value = false
  }

  const onHLSError = (event, data) => {
    console.error('HLS Error:', data)
    
    if (data.fatal) {
      switch (data.type) {
        case window.Hls.ErrorTypes.NETWORK_ERROR:
          console.log('Network error, trying to recover...')
          hls.startLoad()
          break
        case window.Hls.ErrorTypes.MEDIA_ERROR:
          console.log('Media error, trying to recover...')
          hls.recoverMediaError()
          break
        default:
          console.log('Fatal error, destroying HLS instance')
          hls.destroy()
          break
      }
    }
  }

  // Network speed monitoring
  const startNetworkMonitoring = () => {
    if ('connection' in navigator) {
      networkMonitor = navigator.connection
      
      const updateNetworkInfo = () => {
        networkSpeed.value = networkMonitor.downlink * 1000 // Convert to kbps
        
        // Adjust quality based on network conditions
        if (adaptiveEnabled.value && selectedQuality.value === 'auto') {
          adjustQualityBasedOnNetwork()
        }
      }

      networkMonitor.addEventListener('change', updateNetworkInfo)
      updateNetworkInfo()
    }

    // Fallback: Periodic speed test
    speedTestInterval = setInterval(performSpeedTest, 30000) // Every 30 seconds
  }

  const performSpeedTest = async () => {
    try {
      const startTime = performance.now()
      const response = await fetch('/api/speedtest', { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      const endTime = performance.now()
      
      if (response.ok) {
        const duration = endTime - startTime
        const speed = (1000 / duration) * 8 // Rough estimate in kbps
        networkSpeed.value = speed
      }
    } catch (error) {
      console.warn('Speed test failed:', error)
    }
  }

  const adjustQualityBasedOnNetwork = () => {
    if (!hls || selectedQuality.value !== 'auto') return

    const speed = networkSpeed.value
    const buffer = bufferHealth.value
    
    let targetLevel = -1 // Auto

    // Conservative quality selection based on network speed and buffer health
    if (speed > 5000 && buffer > 70) {
      // High speed, good buffer - allow highest quality
      targetLevel = -1
    } else if (speed > 2500 && buffer > 50) {
      // Medium speed - limit to 720p max
      const level720p = hls.levels.findIndex(level => level.height <= 720)
      targetLevel = level720p !== -1 ? level720p : -1
    } else if (speed > 1000 && buffer > 30) {
      // Low speed - limit to 480p max
      const level480p = hls.levels.findIndex(level => level.height <= 480)
      targetLevel = level480p !== -1 ? level480p : -1
    } else {
      // Very low speed - force lowest quality
      targetLevel = hls.levels.length - 1
    }

    if (targetLevel !== hls.currentLevel) {
      hls.currentLevel = targetLevel
      console.log(`Network-based quality adjustment: ${targetLevel === -1 ? 'Auto' : hls.levels[targetLevel].height + 'p'}`)
    }
  }

  // Quality change function
  const changeQuality = (qualityValue) => {
    selectedQuality.value = qualityValue
    
    if (!hls) return

    if (qualityValue === 'auto') {
      hls.currentLevel = -1 // Enable auto quality
    } else {
      const quality = availableQualities.value.find(q => q.label === qualityValue)
      if (quality && quality.index !== -1) {
        hls.currentLevel = quality.index
        console.log(`Manual quality change: ${qualityValue}`)
      }
    }
  }

  // Computed properties
  const adaptiveStreamUrl = computed(() => {
    if (!baseStreamUrl) return ''
    
    // Convert regular stream URL to HLS manifest URL
    if (baseStreamUrl.includes('.m3u8')) {
      return baseStreamUrl
    }
    
    // Assume we have an HLS endpoint
    return `${baseStreamUrl}/playlist.m3u8`
  })

  const currentQualityInfo = computed(() => {
    if (!hls || !hls.levels || hls.currentLevel === -1) {
      return { label: 'Auto', bitrate: currentBitrate.value }
    }
    
    const level = hls.levels[hls.currentLevel]
    return {
      label: `${level.height}p`,
      bitrate: level.bitrate,
      resolution: `${level.width}x${level.height}`
    }
  })

  const networkQuality = computed(() => {
    const speed = networkSpeed.value
    if (speed > 5000) return 'excellent'
    if (speed > 2500) return 'good'
    if (speed > 1000) return 'fair'
    return 'poor'
  })

  // Lifecycle
  onMounted(() => {
    startNetworkMonitoring()
    
    // Start quality monitoring
    qualityCheckInterval = setInterval(() => {
      if (adaptiveEnabled.value && selectedQuality.value === 'auto') {
        adjustQualityBasedOnNetwork()
      }
    }, 10000) // Check every 10 seconds
  })

  onUnmounted(() => {
    if (hls) {
      hls.destroy()
    }
    
    if (speedTestInterval) {
      clearInterval(speedTestInterval)
    }
    
    if (qualityCheckInterval) {
      clearInterval(qualityCheckInterval)
    }
    
    if (networkMonitor) {
      networkMonitor.removeEventListener('change', () => {})
    }
  })

  return {
    // State
    selectedQuality,
    availableQualities,
    currentBitrate,
    networkSpeed,
    bufferHealth,
    isBuffering,
    adaptiveEnabled,
    
    // Computed
    adaptiveStreamUrl,
    currentQualityInfo,
    networkQuality,
    
    // Methods
    initializeHLS,
    changeQuality,
    performSpeedTest
  }
}
