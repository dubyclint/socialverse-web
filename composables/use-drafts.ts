// composables/useDrafts.ts
// ============================================================================
// DRAFT MANAGEMENT COMPOSABLE
// ============================================================================

import { ref, computed } from 'vue'

export interface Draft {
  id: string
  content: string
  privacy: string
  tags: string[]
  mentions: string[]
  mediaUrls: string[]
  scheduledAt?: string
  createdAt: string
  updatedAt: string
  lastSavedAt: string
}

export const useDrafts = () => {
  const drafts = ref<Draft[]>([])
  const loading = ref(false)
  const currentDraftId = ref<string | null>(null)

  /**
   * Load all drafts
   */
  const loadDrafts = async () => {
    loading.value = true
    try {
      const response = await $fetch<any>('/api/posts/drafts')

      if (response.success) {
        drafts.value = response.data
      }
    } catch (error) {
      console.error('Load drafts error:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Save draft
   */
  const saveDraft = async (draft: Partial<Draft>) => {
    try {
      const response = await $fetch<any>('/api/posts/drafts/save', {
        method: 'POST',
        body: {
          id: draft.id,
          content: draft.content,
          privacy: draft.privacy,
          tags: draft.tags,
          mentions: draft.mentions,
          mediaUrls: draft.mediaUrls,
          scheduledAt: draft.scheduledAt
        }
      })

      if (response.success) {
        currentDraftId.value = response.data.id

        // Update local drafts list
        const existingIndex = drafts.value.findIndex(d => d.id === response.data.id)
        if (existingIndex >= 0) {
          drafts.value[existingIndex] = {
            ...draft,
            id: response.data.id
          } as Draft
        } else {
          drafts.value.unshift({
            ...draft,
            id: response.data.id
          } as Draft)
        }

        return response.data.id
      }
    } catch (error) {
      console.error('Save draft error:', error)
    }
  }

  /**
   * Delete draft
   */
  const deleteDraft = async (draftId: string) => {
    try {
      const response = await $fetch<any>(`/api/posts/drafts/${draftId}`, {
        method: 'DELETE'
      })

      if (response.success) {
        drafts.value = drafts.value.filter(d => d.id !== draftId)
        if (currentDraftId.value === draftId) {
          currentDraftId.value = null
        }
        return true
      }
    } catch (error) {
      console.error('Delete draft error:', error)
    }
    return false
  }

  /**
   * Get current draft
   */
  const getCurrentDraft = computed(() => {
    if (!currentDraftId.value) return null
    return drafts.value.find(d => d.id === currentDraftId.value)
  })

  /**
   * Clear current draft
   */
  const clearCurrentDraft = () => {
    currentDraftId.value = null
  }

  return {
    drafts,
    loading,
    currentDraftId,
    getCurrentDraft,
    loadDrafts,
    saveDraft,
    deleteDraft,
    clearCurrentDraft
  }
        }
