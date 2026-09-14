// ============================================================================
// FILE: /middleware/admin.ts
// ============================================================================
import { useUserStore } from '~/stores/user'
import { useSupabaseClient } from '#imports'

export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const client = useSupabaseClient()

  const userId = userStore.userId
  if (!userId) return navigateTo('/')

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const role = (profile as { role?: string | null } | null)?.role
  if (role !== 'admin') {
    return navigateTo('/')
  }
})
