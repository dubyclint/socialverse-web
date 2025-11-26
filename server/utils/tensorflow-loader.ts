// server/utils/tensorflow-loader.ts - LAZY LOAD TENSORFLOW
let tfInstance: any = null
let tfLoaded = false

/**
 * Lazy load TensorFlow only when needed
 * This prevents loading the large TensorFlow bundle on every request
 */
export const getTensorFlow = async () => {
  if (tfLoaded && tfInstance) {
    return tfInstance
  }

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
    throw new Error('TensorFlow not available')
  }
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
  if (tfInstance?.dispose) {
    tfInstance.dispose()
  }
  tfInstance = null
  tfLoaded = false
  console.log('[TensorFlow] Unloaded')
}
