// composables/useFileUpload.ts
// ============================================================================
// FILE UPLOAD COMPOSABLE - Handle file uploads from components
// ============================================================================

import { ref, computed } from 'vue'

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

interface UploadedFile {
  url: string
  path: string
  size: number
  thumbnailUrl?: string
  bucket: string
  filename: string
  mimeType: string
  uploadedAt: string
}

export const useFileUpload = () => {
  const uploading = ref(false)
  const progress = ref<UploadProgress>({ loaded: 0, total: 0, percentage: 0 })
  const error = ref<string | null>(null)
  const uploadedFiles = ref<UploadedFile[]>([])

  const progressPercentage = computed(() => progress.value.percentage)

  /**
   * Upload a single file
   */
  const uploadFile = async (
    file: File,
    bucket: string = 'posts',
    options: {
      optimize?: boolean
      generateThumbnail?: boolean
    } = {}
  ): Promise<UploadedFile | null> => {
    try {
      uploading.value = true
      error.value = null

      // ✅ Validate file on client side
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (file.size > maxSize) {
        error.value = `File size exceeds ${maxSize / 1024 / 1024}MB limit`
        return null
      }

      // ✅ Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)
      if (options.optimize) formData.append('optimize', 'true')
      if (options.generateThumbnail) formData.append('generateThumbnail', 'true')

      // ✅ Upload with progress tracking
      const response = await $fetch<any>('/api/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (event: ProgressEvent) => {
          progress.value = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          }
        }
      })

      if (!response.success) {
        error.value = response.data?.error || 'Upload failed'
        return null
      }

      const uploadedFile = response.data as UploadedFile
      uploadedFiles.value.push(uploadedFile)

      return uploadedFile
    } catch (err: any) {
      error.value = err.message || 'Upload failed'
      console.error('Upload error:', err)
      return null
    } finally {
      uploading.value = false
      progress.value = { loaded: 0, total: 0, percentage: 0 }
    }
  }

  /**
   * Upload multiple files
   */
  const uploadMultiple = async (
    files: File[],
    bucket: string = 'posts',
    options: {
      optimize?: boolean
      generateThumbnail?: boolean
    } = {}
  ): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = []

    for (const file of files) {
      const result = await uploadFile(file, bucket, options)
      if (result) {
        results.push(result)
      }
    }

    return results
  }

  /**
   * Delete an uploaded file
   */
  const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
    try {
      const response = await $fetch<any>('/api/storage/delete', {
        method: 'POST',
        body: { bucket, path }
      })

      if (response.success) {
        uploadedFiles.value = uploadedFiles.value.filter(f => f.path !== path)
        return true
      }

      error.value = response.message || 'Delete failed'
      return false
    } catch (err: any) {
      error.value = err.message || 'Delete failed'
      console.error('Delete error:', err)
      return false
    }
  }

  /**
   * Clear all uploaded files from state
   */
  const clearUploaded = () => {
    uploadedFiles.value = []
  }

  /**
   * Clear error message
   */
  const clearError = () => {
    error.value = null
  }

  return {
    uploading,
    progress,
    progressPercentage,
    error,
    uploadedFiles,
    uploadFile,
    uploadMultiple,
    deleteFile,
    clearUploaded,
    clearError
  }
}
