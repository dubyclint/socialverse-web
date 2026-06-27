// ============================================================================
// FILE 6: /server/utils/tensorflow-loader.ts - COMPLETE FIXED VERSION
// ============================================================================
// LAZY LOAD TENSORFLOW - ONLY WHEN NEEDED
// FIXED: Proper error handling and memory management
// ============================================================================

let tfInstance: any = null
let tfLoaded = false
let tfLoadingPromise: Promise<any> | null = null

/**
 * Lazy load TensorFlow only when needed
 * This prevents loading the large TensorFlow bundle on every request
 * Uses a promise to prevent multiple concurrent load attempts
 */
export const getTensorFlow = async () => {
  // If already loaded, return immediately
  if (tfLoaded && tfInstance) {
    return tfInstance
  }

  // If currently loading, wait for the promise
  if (tfLoadingPromise) {
    return tfLoadingPromise
  }

  // Start loading
  tfLoadingPromise = (async () => {
    try {
      // Only load TensorFlow when explicitly requested
      const tf = await import('@tensorflow/tfjs')
      await import('@tensorflow/tfjs-core')
      await import('@tensorflow/tfjs-layers')
      
      tfInstance = tf
      tfLoaded = true
      
      console.log('[TensorFlow] Loaded successfully')
      return tfInstance
    } catch (error: any) {
      console.error('[TensorFlow] Failed to load:', error.message)
      tfLoaded = false
      tfInstance = null
      throw new Error('TensorFlow not available')
    } finally {
      tfLoadingPromise = null
    }
  })()

  return tfLoadingPromise
}

/**
 * Check if TensorFlow is available
 */
export const isTensorFlowAvailable = (): boolean => {
  return tfLoaded && tfInstance !== null
}

/**
 * Unload TensorFlow to free memory
 */
export const unloadTensorFlow = () => {
  if (tfInstance && tfInstance.dispose) {
    try {
      tfInstance.dispose()
      console.log('[TensorFlow] Disposed successfully')
    } catch (error) {
      console.error('[TensorFlow] Error disposing:', error)
    }
  }
  
  tfInstance = null
  tfLoaded = false
  tfLoadingPromise = null
}

/**
 * Get TensorFlow version
 */
export const getTensorFlowVersion = async (): Promise<string | null> => {
  try {
    if (!tfLoaded) {
      await getTensorFlow()
    }
    return tfInstance?.version?.tfjs || null
  } catch (error) {
    console.error('[TensorFlow] Error getting version:', error)
    return null
  }
}

/**
 * Create a model wrapper with automatic cleanup
 */
export const createModelWrapper = async (modelPath: string) => {
  try {
    const tf = await getTensorFlow()
    const model = await tf.loadLayersModel(modelPath)
    
    return {
      model,
      predict: (input: any) => model.predict(input),
      dispose: () => {
        model.dispose()
        console.log('[TensorFlow] Model disposed')
      }
    }
  } catch (error) {
    console.error('[TensorFlow] Error creating model:', error)
    throw error
  }
}

/**
 * Cleanup function to be called on server shutdown
 */
export const cleanupTensorFlow = () => {
  unloadTensorFlow()
  console.log('[TensorFlow] Cleanup completed')
}
