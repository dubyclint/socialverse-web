// composables/use-emoji-picker.ts
import { ref, computed } from 'vue'
import { EMOJIS, CATEGORIES } from '~/utils/emoji-data'

export const useEmojiPicker = () => {
  const activeCategory = ref('smileys')
  const recent = ref<string[]>([])

  const filteredEmojis = computed(() => {
    if (activeCategory.value === 'recent') {
      return recent.value.map(char => ({ emoji: char, name: 'recent', category: 'recent' }))
    }
    return EMOJIS.filter(e => e.category === activeCategory.value)
  })

  const addRecent = (char: string) => {
    if (!recent.value.includes(char)) {
      recent.value = [char, ...recent.value].slice(0, 20)
      localStorage.setItem('recent-emojis', JSON.stringify(recent.value))
    }
  }

  return { activeCategory, filteredEmojis, categories: CATEGORIES, addRecent, recent }
}
