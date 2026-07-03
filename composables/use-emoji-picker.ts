// composables/use-emoji-picker.ts
import { ref, shallowRef, computed, onMounted } from 'vue'

export const useEmojiPicker = () => {
  // Use shallowRef for the large dataset to boost performance
  const allEmojis = shallowRef<any[]>([])
  const recent = ref<string[]>([])
  const activeCategory = ref('smileys')
  const searchQuery = ref('')

  // Load data dynamically to keep the initial app bundle small
  const init = async () => {
    const { EMOJIS } = await import('~/utils/emoji-data')
    allEmojis.value = EMOJIS
    
    // Load recent emojis from storage
    const saved = localStorage.getItem('recent-emojis')
    if (saved) recent.value = JSON.parse(saved)
  }

  // Filter logic: Search takes priority, otherwise filter by category
  const filteredEmojis = computed(() => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      return allEmojis.value.filter(e => 
        e.name.toLowerCase().includes(q) || e.keywords?.some((k: string) => k.includes(q))
      )
    }
    
    if (activeCategory.value === 'recent') {
      return recent.value.map(char => ({ emoji: char, name: 'recent', category: 'recent' }))
    }
    
    return allEmojis.value.filter(e => e.category === activeCategory.value)
  })

  const addRecent = (char: string) => {
    if (!recent.value.includes(char)) {
      recent.value = [char, ...recent.value].slice(0, 20)
      localStorage.setItem('recent-emojis', JSON.stringify(recent.value))
    }
  }

  onMounted(init)

  return { 
    activeCategory, 
    searchQuery, 
    filteredEmojis, 
    addRecent 
  }
}
