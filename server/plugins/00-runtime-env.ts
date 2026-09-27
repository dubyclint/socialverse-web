/**
 * Supabase credentials are inlined into the bundle when the app is *built*, and
 * Nitro only overrides them at runtime from NUXT_PUBLIC_SUPABASE_URL /
 * NUXT_PUBLIC_SUPABASE_KEY. A deployment that provides SUPABASE_URL /
 * SUPABASE_ANON_KEY only at runtime therefore boots with an empty key and every
 * SSR render fails with "supabaseKey is required" (HTTP 500).
 *
 * `scripts/start-server.mjs` maps those aliases before Nitro loads; this plugin
 * makes the misconfiguration obvious for deployments using a different entry.
 */
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const supabase = config.public.supabase as { url?: string; key?: string } | undefined

  if (!supabase?.url || !supabase?.key) {
    console.error(
      '[runtime-env] Supabase is not configured at runtime — every SSR page will return 500. ' +
        'Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY (or start the app via ' +
        '`npm start`, which maps SUPABASE_URL / SUPABASE_ANON_KEY for you).'
    )
  }
})
