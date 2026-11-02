// Normalises files from mobile pickers before validation/upload: fills in a
// missing or legacy MIME type from the extension (jfif/pjpeg/mov) and converts
// HEIC/HEIF photos to JPEG, since browsers can't display HEIC.

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', jfif: 'image/jpeg', pjpeg: 'image/jpeg', pjp: 'image/jpeg',
  png: 'image/png', webp: 'image/webp', gif: 'image/gif', heic: 'image/heic', heif: 'image/heif',
  mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm'
}
const LEGACY: Record<string, string> = { 'image/jfif': 'image/jpeg', 'image/pjpeg': 'image/jpeg', 'image/jpg': 'image/jpeg', 'video/x-m4v': 'video/mp4' }

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

export const normalizeMediaFile = async (file: File): Promise<File> => {
  const ext = extOf(file.name)
  let type = (file.type || '').toLowerCase()
  if (LEGACY[type]) type = LEGACY[type]!
  if (!type || type === 'application/octet-stream') type = EXT_MIME[ext] ?? type
  if (type === 'image/heic' || type === 'image/heif') {
    const { default: heic2any } = await import('heic2any')
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    const blob = Array.isArray(out) ? out[0]! : out
    return new File([blob], file.name.replace(/\.(heic|heif)$/i, '') + '.jpg', { type: 'image/jpeg', lastModified: file.lastModified })
  }
  const base = ext === 'jfif' || ext === 'pjpeg' || ext === 'pjp' ? file.name.replace(/\.[^.]+$/, '.jpg') : file.name
  return type === file.type && base === file.name ? file : new File([file], base, { type, lastModified: file.lastModified })
}

/** On Android, re-index public folders so fresh downloads show in the picker (no-op on web/iOS). */
export const refreshDeviceMedia = async () => {
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core')
    if (Capacitor.getPlatform() !== 'android') return
    const MediaScan = registerPlugin<{ scan: () => Promise<{ scanned: number }> }>('MediaScan')
    await Promise.race([MediaScan.scan(), new Promise(r => setTimeout(r, 1500))])
  } catch { /* plugin missing on older builds */ }
}
