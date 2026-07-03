// stores/posts.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePostsStore = defineStore('posts', () => {
  const draft = ref({
    content: '',
    privacy: 'public',
    allowComments: true,
    allowSharing: true,
    saved_at: null
  })

  // Hydrate from localStorage once on store init
  const loadDraft = () => {
    const saved = localStorage.getItem('post_draft')
    if (saved) draft.value = JSON.parse(saved)
  }

  const updateDraft = (data: Partial<typeof draft.value>) => {
    draft.value = { ...draft.value, ...data }
    localStorage.setItem('post_draft', JSON.stringify(draft.value))
  }

  const clearDraft = () => {
    draft.value = { content: '', privacy: 'public', allowComments: true, allowSharing: true, saved_at: null }
    localStorage.removeItem('post_draft')
  }

  return { draft, loadDraft, updateDraft, clearDraft }
})
