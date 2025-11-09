// composables/useAutocomplete.ts
// ============================================================================
// AUTOCOMPLETE COMPOSABLE - For mentions and hashtags
// ============================================================================

import { ref, computed } from 'vue'

export interface AutocompleteItem {
  id: string
  label: string
  value: string
  type: 'mention' | 'hashtag'
  avatar?: string
}

export const useAutocomplete = () => {
  const suggestions = ref<AutocompleteItem[]>([])
  const loading = ref(false)
  const showSuggestions = ref(false)
  const selectedIndex = ref(-1)

  /**
   * Search for mentions
   */
  const searchMentions = async (query: string) => {
    if (query.length < 2) {
      suggestions.value = []
      return
    }

    loading.value = true
    try {
      const response = await $fetch<any>('/api/posts/search-mentions', {
        query: { q: query }
      })

      if (response.success) {
        suggestions.value = response.data.map((user: any) => ({
          id: user.id,
          label: `@${user.username}`,
          value: user.id,
          type: 'mention',
          avatar: user.avatar_url
        }))
      }
    } catch (error) {
      console.error('Mention search error:', error)
      suggestions.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Search for hashtags
   */
  const searchHashtags = async (query: string) => {
    if (query.length < 1) {
      suggestions.value = []
      return
    }

    loading.value = true
    try {
      const response = await $fetch<any>('/api/posts/trending-tags')

      if (response.success) {
        suggestions.value = response.data
          .filter((tag: any) => tag.tag.includes(query.toLowerCase()))
          .slice(0, 10)
          .map((tag: any) => ({
            id: tag.tag,
            label: `#${tag.tag}`,
            value: tag.tag,
            type: 'hashtag'
          }))
      }
    } catch (error) {
      console.error('Hashtag search error:', error)
      suggestions.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get selected suggestion
   */
  const getSelectedSuggestion = computed(() => {
    if (selectedIndex.value >= 0 && selectedIndex.value < suggestions.value.length) {
      return suggestions.value[selectedIndex.value]
    }
    return null
  })

  /**
   * Move selection up
   */
  const moveUp = () => {
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    }
  }

  /**
   * Move selection down
   */
  const moveDown = () => {
    if (selectedIndex.value < suggestions.value.length - 1) {
      selectedIndex.value++
    }
  }

  /**
   * Reset
   */
  const reset = () => {
    suggestions.value = []
    selectedIndex.value = -1
    showSuggestions.value = false
  }

  return {
    suggestions,
    loading,
    showSuggestions,
    selectedIndex,
    getSelectedSuggestion,
    searchMentions,
    searchHashtags,
    moveUp,
    moveDown,
    reset
  }
}
