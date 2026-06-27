// ============================================================================
// FILE: /composables/use-tensorflow.ts
// Description: Client-side TensorFlow lazy-loading composable to optimize bundles
// ============================================================================
import { ref, readonly, computed } from 'vue'

export const useTensorFlow = () => {
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const error = ref<string | null>(null)
  let tfInstance: any = null

  /**
   * Lazily fetches and instantiates heavy underlying WebGL/WASM modeling frames
   */
  const loadTensorFlow = async () => {
    // Return early if already compiled
    if (isLoaded.value) {
      return tfInstance
    }

    // ✅ SSR Guard: Prevent node executor engine failure environments
    if (typeof window === 'undefined') {
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      // Dynamically bundle split TensorFlow elements onto client execution tracks
      const tf = await import('@tensorflow/tfjs')
      await import('@tensorflow/tfjs-core')
      await import('@tensorflow/tfjs-layers')

      tfInstance = tf
      isLoaded.value = true
      console.log('[TensorFlow] Client-side execution layer loaded')

      return tfInstance
    } catch (err: any) {
      error.value = err.message || 'Failed to safely configure external runtime components.'
      console.error('[TensorFlow] Failed to load modules:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Drops compiled graph buffers and variables out of device memory allocation maps
   */
  const unloadTensorFlow = () => {
    if (tfInstance?.dispose) {
      tfInstance.dispose()
    }
    tfInstance = null
    isLoaded.value = false
  }

  return {
    loadTensorFlow,
    unloadTensorFlow,
    isLoading: readonly(isLoading),
    isLoaded: readonly(isLoaded),
    error: readonly(error),
    tf: computed(() => tfInstance)
  }
}
