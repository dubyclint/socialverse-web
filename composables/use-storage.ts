// FILE: /composables/use-storage.ts - COMPLETE FIXED VERSION
// ============================================================================
// STORAGE COMPOSABLE - FIXED: File management and storage tracking
// ✅ FIXED: Get storage usage
// ✅ FIXED: Upload file
// ✅ FIXED: Delete file
// ✅ FIXED: Comprehensive error handling
// ============================================================================

import { ref, computed } from 'vue'

export const useStorage = () => {
  const loading = ref(false)
  const error = ref('')
  const storageUsage = ref<any>(null)

  /**
   * Get storage information
   */
  const getStorageInfo = async () => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useStorage] Fetching storage information...')

      const result = await $fetch('/api/storage')

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to fetch storage information')
      }

      storageUsage.value = result.data
      console.log('[useStorage] ✅ Storage information fetched')
      return result.data
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to fetch storage information'
      error.value = errorMsg
      console.error('[useStorage] ❌ Error:', errorMsg)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Upload file
   */
  const uploadFile = async (file: File, bucket: string = 'uploads') => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useStorage] Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        bucket
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)

      const result = await $fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to upload file')
      }

      console.log('[useStorage] ✅ File uploaded successfully')
      
      // Refresh storage info
      await getStorageInfo()
      
      return result.data
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to upload file'
      error.value = errorMsg
      console.error('[useStorage] ❌ Error:', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete file
   */
  const deleteFile = async (bucket: string, path: string) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useStorage] Deleting file:', {
        bucket,
        path
      })

      const result = await $fetch('/api/storage/delete', {
        method: 'POST',
        body: { bucket, path }
      })

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to delete file')
      }

      console.log('[useStorage] ✅ File deleted successfully')
      
      // Refresh storage info
      await getStorageInfo()
      
      return result
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to delete file'
      error.value = errorMsg
      console.error('[useStorage] ❌ Error:', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if storage is available
   */
  const isStorageAvailable = computed(() => {
    if (!storageUsage.value?.userUsage) return true
    return !storageUsage.value.userUsage.isAtLimit
  })

  /**
   * Get storage percentage
   */
  const storagePercentage = computed(() => {
    if (!storageUsage.value?.userUsage) return 0
    return Math.round(storageUsage.value.userUsage.percentage)
  })

  /**
   * Get formatted storage used
   */
  const formattedStorageUsed = computed(() => {
    if (!storageUsage.value?.userUsage) return '0 B'
    return formatBytes(storageUsage.value.userUsage.used)
  })

  /**
   * Get formatted storage limit
   */
  const formattedStorageLimit = computed(() => {
    if (!storageUsage.value?.userUsage) return '5 GB'
    return formatBytes(storageUsage.value.userUsage.limit)
  })

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = ''
  }

  /**
   * Format bytes to human readable
   */
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return {
    loading,
    error,
    storageUsage,
    isStorageAvailable,
    storagePercentage,
    formattedStorageUsed,
    formattedStorageLimit,
    getStorageInfo,
    uploadFile,
    deleteFile,
    clearError,
    formatBytes
  }
}
