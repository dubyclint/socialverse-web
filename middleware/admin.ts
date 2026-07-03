// middleware/admin.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()
  const client = useSupabaseClient()

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.value?.id)
    .single()

  if (profile?.role !== 'admin') {
    return navigateTo('/')
  }
})
