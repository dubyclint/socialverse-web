import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { setActingAs } from '~/utils/acting-as'

export interface Actor {
  id: string
  name: string
  avatar: string
  type: 'USER' | 'PAGE'
  role?: string
  handle?: string
}

export interface ManagedPage {
  id: string
  name: string
  handle: string
  avatar_url: string | null
  role: 'OWNER' | 'MANAGER' | 'MODERATOR'
}

const STORAGE_KEY = 'viorp.activeActor'

export const useContextStore = defineStore('context', () => {
  const user = ref<Actor | null>(null)
  const activeActor = ref<Actor | null>(null)
  const managedPages = ref<ManagedPage[]>([])
  const createdCount = ref(0)
  const cap = ref(5)

  const isPage = computed(() => activeActor.value?.type === 'PAGE')

  const persist = () => {
    setActingAs(activeActor.value ? { id: activeActor.value.id, type: activeActor.value.type } : null)
    try {
      if (activeActor.value?.type === 'PAGE') localStorage.setItem(STORAGE_KEY, activeActor.value.id)
      else localStorage.removeItem(STORAGE_KEY)
    } catch { /* storage unavailable */ }
  }

  const pageActor = (page: ManagedPage): Actor => ({
    id: page.id,
    name: page.name,
    avatar: page.avatar_url || '/default-avatar.svg',
    type: 'PAGE',
    role: page.role,
    handle: page.handle
  })

  const switchTo = (actor: Actor | null) => {
    activeActor.value = actor ?? user.value
    persist()
  }

  const switchToPage = (pageId: string) => {
    const page = managedPages.value.find(p => p.id === pageId)
    if (page) switchTo(pageActor(page))
  }

  /** Load the person and their manageable pages; restores a still-valid page context. */
  const init = async () => {
    const me = await $fetch<{ user_id: string, username: string, display_name?: string | null, avatar_url?: string | null } | null>('/api/profile/me')
    if (!me) return
    user.value = {
      id: me.user_id,
      name: me.display_name || me.username,
      avatar: me.avatar_url || '/default-avatar.svg',
      type: 'USER',
      handle: me.username
    }
    await refreshPages()
    let saved: string | null = null
    try { saved = localStorage.getItem(STORAGE_KEY) } catch { saved = null }
    const page = saved ? managedPages.value.find(p => p.id === saved) : undefined
    switchTo(page ? pageActor(page) : user.value)
  }

  const refreshPages = async () => {
    const res = await $fetch<{ pages: ManagedPage[], created_count: number, cap: number }>('/api/pages/mine')
    managedPages.value = res.pages
    createdCount.value = res.created_count
    cap.value = res.cap
    if (activeActor.value?.type === 'PAGE' && !res.pages.some(p => p.id === activeActor.value?.id)) switchTo(user.value)
  }

  const reset = () => {
    user.value = null
    managedPages.value = []
    activeActor.value = null
    persist()
  }

  return { user, activeActor, managedPages, createdCount, cap, isPage, init, refreshPages, switchTo, switchToPage, reset }
})
