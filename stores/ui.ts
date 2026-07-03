import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toast = ref<{ message: string, type: 'error' | 'success' } | null>(null)

  const notify = (message: string, type: 'error' | 'success' = 'error') => {
    toast.value = { message, type }
    // Auto-clear after 5 seconds
    setTimeout(() => { toast.value = null }, 5000)
  }

  return { toast, notify }
})
