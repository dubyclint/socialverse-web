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
