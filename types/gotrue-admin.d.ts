// Permissive augmentation for GoTrue admin API used by some server endpoints.
// This adds missing admin methods to the Supabase types to avoid TS2339 noise
// during incremental migration. These are intentionally permissive (any).
declare module '@supabase/supabase-js' {
  interface GoTrueAdminApi {
    verifyUserWithToken?: (...args: any[]) => Promise<any>
    // Add other admin helpers as needed during migration.
  }
}

export {}
