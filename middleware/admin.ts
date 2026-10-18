// ============================================================================
// FILE: /middleware/admin.ts
// ============================================================================
import { useStaff } from '~/composables/useStaff'

export default defineNuxtRouteMiddleware(async () => {
  const staff = await useStaff().load(true)
  if (!staff) return navigateTo('/')
})
