// ============================================================================
// FILE: /middleware/profile-completion.ts - DISABLED
// ============================================================================
// Purpose: This middleware is disabled
// 
// Rationale:
// - Signup creates a complete profile with basic info (email, username, full_name)
// - Users can optionally update their profile details later from /profile/edit
// - No forced profile completion flow needed
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (process.server) return

  // ✅ DISABLED: Profile completion middleware
  // Users have complete profiles after signup
  // They can update profile details anytime from /profile/edit
  
  return
})
