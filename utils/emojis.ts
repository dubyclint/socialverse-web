// utils/emoji-data.ts
export interface Emoji {
  emoji: string
  name: string
  category: string
  keywords?: string[]
}

export const EMOJIS: Emoji[] = [
  { emoji: '😀', name: 'grinning', category: 'smileys', keywords: ['face', 'happy'] },
  // ... rest of your 1000+ emojis
]

export const CATEGORIES = [
  { id: 'recent', icon: '🕒' },
  { id: 'smileys', icon: '😀' },
  { id: 'hands', icon: '👋' },
  { id: 'hearts', icon: '❤️' },
  { id: 'objects', icon: '🎉' },
  { id: 'nature', icon: '🌟' }
]
                                                             
