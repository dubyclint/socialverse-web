// services/fileUploadService.js
class FileUploadService {
  constructor() {
    this.uploadEndpoint = '/api/upload'
    this.maxFileSize = 50 * 1024 * 1024 // 50MB
    this.allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed'
      ]
    }
  }

  // Validate file before upload
  validateFile(file, type) {
    const errors = []

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size must be less than ${this.formatFileSize(this.maxFileSize)}`)
    }

    // Check file type
    if (type && this.allowedTypes[type]) {
      if (!this.allowedTypes[type].includes(file.type)) {
        errors.push(`Invalid file type for ${type}`)
      }
    }

    // Additional validations based on type
    if (type === 'image' && file.size > 10 * 1024 * 1024) {
      errors.push('Image size must be less than 10MB')
    }

    if (type === 'video' && file.size > 50 * 1024 * 1024) {
      errors.push('Video size must be less than 50MB')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Upload single file
  async uploadFile(file, options = {}) {
    const validation = this.validateFile(file, options.type)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', options.type || 'file')
    
    if (options.chatId) {
      formData.append('chatId', options.chatId)
    }

    try {
      const response = await fetch(this.uploadEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      return {
        success: true,
        file: result.file,
        url: result.url,
        thumbnail: result.thumbnail
      }

    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  }

  // Upload multiple files
  async uploadFiles(files, options = {}) {
    const results = []
    const errors = []

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, options)
        results.push(result)
      } catch (error) {
        errors.push({
          file: file.name,
          error: error.message
        })
      }
    }

    return {
      results,
      errors,
      success: errors.length === 0
    }
  }

  // Generate thumbnail for images/videos
  async generateThumbnail(file, options = {}) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      const maxWidth = options.width || 300
      const maxHeight = options.height || 300

      if (file.type.startsWith('image/')) {
        const img = new Image()
        img.onload = () => {
          const { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            maxWidth, 
            maxHeight
          )
          
          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(resolve, 'image/jpeg', 0.8)
        }
        img.onerror = reject
        img.src = URL.createObjectURL(file)
        
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.onloadedmetadata = () => {
          video.currentTime = 1 // Capture frame at 1 second
        }
        video.onseeked = () => {
          const { width, height } = this.calculateDimensions(
            video.videoWidth, 
            video.videoHeight, 
            maxWidth, 
            maxHeight
          )
          
          canvas.width = width
          canvas.height = height
          ctx.drawImage(video, 0, 0, width, height)
          
          canvas.toBlob(resolve, 'image/jpeg', 0.8)
        }
        video.onerror = reject
        video.src = URL.createObjectURL(file)
        
      } else {
        reject(new Error('Unsupported file type for thumbnail'))
      }
    })
  }

  // Calculate dimensions maintaining aspect ratio
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth
    let height = originalHeight

    if (width > maxWidth) {
      height = (height * maxWidth) / width
      width = maxWidth
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height
      height = maxHeight
    }

    return { width: Math.round(width), height: Math.round(height) }
  }

  // Compress image before upload
  async compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
        )

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(resolve, file.type, quality)
      }

      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  // Get video duration
  async getVideoDuration(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        resolve(Math.round(video.duration))
      }
      video.onerror = reject
      video.src = URL.createObjectURL(file)
    })
  }

  // Get audio duration
  async getAudioDuration(file) {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio')
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration))
      }
      audio.onerror = reject
      audio.src = URL.createObjectURL(file)
    })
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get auth token
  getAuthToken() {
    return localStorage.getItem('auth_token') || ''
  }

  // Delete file
  async deleteFile(fileId) {
    try {
      const response = await fetch(`/api/upload/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`)
      }

      return { success: true }

    } catch (error) {
      console.error('File delete error:', error)
      throw error
    }
  }
}

export default new FileUploadService()
