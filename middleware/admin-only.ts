import { useStaff } from '~/composables/useStaff'

/** Features still in development are reachable by admins only. */
export default defineNuxtRouteMiddleware(async () => {
  const staff = await useStaff().load()
  if (staff?.role !== 'admin') return navigateTo('/feed')
})
