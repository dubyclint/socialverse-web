// composables/use-tensorflow.ts - CLIENT-SIDE TENSORFLOW LAZY LOADING
export const useTensorFlow = () => {
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const error = ref<string | null>(null)
  let tfInstance: any = null

  const loadTensorFlow = async () => {
    if (isLoaded.value) {
      return tfInstance
    }

    isLoading.value = true
    error.value = null

    try {
      // Dynamically import TensorFlow only when needed
      const tf = await import('@tensorflow/tfjs')
      await import('@tensorflow/tfjs-core')
      await import('@tensorflow/tfjs-layers')

      tfInstance = tf
      isLoaded.value = true
      console.log('[TensorFlow] Client-side loaded')

      return tfInstance
    } catch (err: any) {
      error.value = err.message
      console.error('[TensorFlow] Failed to load:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

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
    tf: computed(() => tfInstance),
  }
}
