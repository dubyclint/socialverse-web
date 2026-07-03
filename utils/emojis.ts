// utils/emojis.ts
export interface Emoji {
  emoji: string
  name: string
  category: string
  keywords?: string[]
}

export const EMOJIS: Emoji[] = [
  // Paste your entire EMOJIS array here
  { emoji: '😀', name: 'grinning', category: 'smileys', keywords: ['face', 'happy'] },
  // ... rest of the list
]
