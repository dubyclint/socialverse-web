export const CHAT_WALLPAPERS = [
  { value: 'default', label: 'Default', css: 'transparent' },
  { value: 'midnight', label: 'Midnight', css: 'linear-gradient(160deg, #0b1020 0%, #111827 100%)' },
  { value: 'aurora', label: 'Aurora', css: 'linear-gradient(160deg, #052e2b 0%, #1e1b4b 60%, #3b0764 100%)' },
  { value: 'ocean', label: 'Ocean', css: 'linear-gradient(160deg, #082f49 0%, #0c4a6e 100%)' },
  { value: 'sunset', label: 'Sunset', css: 'linear-gradient(160deg, #431407 0%, #4c0519 60%, #1e1b4b 100%)' },
  { value: 'forest', label: 'Forest', css: 'linear-gradient(160deg, #052e16 0%, #14532d 100%)' }
] as const

export const CHAT_WALLPAPER_MAX_BYTES = 5 * 1024 * 1024

/** `chatWallpaper` holds either a preset key or an uploaded image URL. */
export const chatWallpaperStyle = (value: string | undefined): Record<string, string> => {
  if (value && /^https?:\/\//.test(value)) {
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url("${value.replace(/"/g, '%22')}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  const preset = CHAT_WALLPAPERS.find(item => item.value === value)
  return preset && preset.value !== 'default' ? { background: preset.css } : {}
}

/** Bubble colour themes for chat; `own` is the sender's bubble, `other` the received one. */
export const CHAT_THEMES = [
  { value: 'aurora', label: 'Aurora', own: 'linear-gradient(135deg, #2563eb, #7c3aed)', other: '' },
  { value: 'ocean', label: 'Ocean', own: 'linear-gradient(135deg, #0284c7, #0d9488)', other: '#12324a' },
  { value: 'sunset', label: 'Sunset', own: 'linear-gradient(135deg, #f97316, #db2777)', other: '#3b1d2e' },
  { value: 'forest', label: 'Forest', own: 'linear-gradient(135deg, #16a34a, #0f766e)', other: '#16332a' },
  { value: 'rose', label: 'Rose', own: 'linear-gradient(135deg, #e11d48, #9333ea)', other: '#3a1830' },
  { value: 'gold', label: 'Gold', own: 'linear-gradient(135deg, #d97706, #b45309)', other: '#33291a' },
  { value: 'mono', label: 'Midnight', own: '#334155', other: '#1e293b' }
] as const

export const chatThemeStyle = (value: string | undefined): Record<string, string> => {
  const theme = CHAT_THEMES.find(item => item.value === value) ?? CHAT_THEMES[0]
  return {
    '--chat-bubble-own': theme.own,
    ...(theme.other ? { '--chat-bubble-other': theme.other } : {})
  }
}
