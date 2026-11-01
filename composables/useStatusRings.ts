/** Author ids with active, not-yet-viewed statuses (blue ring). Shared app-wide, refreshed at most every 60s. */
export const useStatusRings = () => {
  const unseen = useState<string[]>('status-rings', () => [])
  const loadedAt = useState<number>('status-rings-at', () => 0)
  const refresh = async (force = false) => {
    if (import.meta.server || (!force && Date.now() - loadedAt.value < 60_000)) return
    loadedAt.value = Date.now()
    try {
      const r = await $fetch<{ data: { author: { id: string }, all_viewed: boolean, is_me?: boolean }[] }>('/api/status')
      unseen.value = r.data.filter(g => !g.all_viewed && !g.is_me).map(g => g.author.id)
    } catch { /* signed out */ }
  }
  onMounted(() => { void refresh() })
  const hasUnseen = (id?: string | null) => Boolean(id && unseen.value.includes(id))
  return { hasUnseen, refresh }
}
