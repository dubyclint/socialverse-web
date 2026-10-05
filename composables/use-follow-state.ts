import { computed } from 'vue'

/**
 * App-wide record of who the signed-in user follows, so every follow button
 * (feed, profile, search, lists) agrees without each one asking the server.
 */
export const useFollowState = () => {
  const followed = useState<Record<string, boolean>>('follow-state', () => ({}))
  const loaded = useState<boolean>('follow-state-loaded', () => false)
  const pending = useState<Record<string, boolean>>('follow-state-pending', () => ({}))

  const ensureLoaded = async (): Promise<void> => {
    if (loaded.value) return
    loaded.value = true
    try {
      const response = await $fetch<{ data: string[] }>('/api/follows/ids')
      const next: Record<string, boolean> = { ...followed.value }
      for (const id of response.data ?? []) next[id] = true
      followed.value = next
    } catch {
      loaded.value = false
    }
  }

  const isFollowing = (userId: string) => computed(() => Boolean(followed.value[userId]))

  const seed = (userId: string, following: boolean) => {
    followed.value = { ...followed.value, [userId]: following }
  }

  /** Sets the follow state on the server; returns the target's new follower count. */
  const setFollowing = async (userId: string, follow: boolean): Promise<number | null> => {
    if (pending.value[userId]) return null
    pending.value = { ...pending.value, [userId]: true }
    const previous = Boolean(followed.value[userId])
    seed(userId, follow)
    try {
      const response = await $fetch<{ following: boolean, followers_count: number }>(
        `/api/follows/${userId}`,
        { method: 'POST', body: { follow } }
      )
      seed(userId, response.following)
      return response.followers_count
    } catch (error) {
      seed(userId, previous)
      throw error
    } finally {
      const next = { ...pending.value }
      delete next[userId]
      pending.value = next
    }
  }

  return { followed, pending, ensureLoaded, isFollowing, seed, setFollowing }
}
