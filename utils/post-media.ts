// Shared post-media rules so the composer, the edit modal and the upload
// endpoint all enforce the same limits.

export const POST_VIDEO_MAX_BYTES = 10 * 1024 * 1024
export const POST_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const POST_MEDIA_MAX_ITEMS = 4

export const POST_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const
export const POST_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export const POST_MEDIA_ACCEPT = [...POST_IMAGE_MIME_TYPES, ...POST_VIDEO_MIME_TYPES].join(',')

export const isPostVideoMime = (mimeType: string): boolean =>
  (POST_VIDEO_MIME_TYPES as readonly string[]).includes(mimeType)

export const isPostImageMime = (mimeType: string): boolean =>
  (POST_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)

export const postMediaLimitFor = (mimeType: string): number =>
  isPostVideoMime(mimeType) ? POST_VIDEO_MAX_BYTES : POST_IMAGE_MAX_BYTES

/** Returns an error message, or null when the file is acceptable. */
export const validatePostMediaFile = (file: { type: string, size: number }): string | null => {
  if (!isPostVideoMime(file.type) && !isPostImageMime(file.type)) {
    return 'Only JPEG, PNG, WebP, GIF images and MP4/WebM videos can be posted'
  }
  const limit = postMediaLimitFor(file.type)
  if (file.size > limit) {
    const label = isPostVideoMime(file.type) ? 'Videos' : 'Images'
    return `${label} must be ${Math.round(limit / 1024 / 1024)}MB or smaller`
  }
  return null
}
