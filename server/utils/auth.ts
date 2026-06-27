// ============================================================================
// FILE: /server/utils/auth.ts
// ============================================================================
// Canonical auth utility re-exporting the implementation from token-validator
// to avoid duplicate auto-import symbols in Nuxt.
// ============================================================================

export { requireAuth } from './token-validator'
