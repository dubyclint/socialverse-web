// Production entrypoint.
//
// Supabase credentials are read from runtime config, which Nitro only overrides
// from `NUXT_PUBLIC_SUPABASE_URL` / `NUXT_PUBLIC_SUPABASE_KEY`. Hosts commonly
// provide `SUPABASE_URL` / `SUPABASE_ANON_KEY` instead, in which case the built
// bundle starts with an empty key and every SSR render fails with
// "supabaseKey is required" (HTTP 500). Map the aliases before Nitro loads, and
// fail loudly instead of serving 500s when nothing is configured.

const env = process.env

const alias = (target, sources) => {
  if (env[target]) return
  for (const source of sources) {
    if (env[source]) {
      env[target] = env[source]
      return
    }
  }
}

alias('NUXT_PUBLIC_SUPABASE_URL', ['SUPABASE_URL'])
alias('NUXT_PUBLIC_SUPABASE_KEY', ['NUXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'SUPABASE_KEY'])
alias('NUXT_SUPABASE_SERVICE_KEY', ['SUPABASE_SERVICE_ROLE_KEY'])

if (!env.NUXT_PUBLIC_SUPABASE_URL || !env.NUXT_PUBLIC_SUPABASE_KEY) {
  console.error(
    '[start] Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY ' +
      '(or NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_KEY) in the server environment.'
  )
  process.exit(1)
}

await import('../.output/server/index.mjs')
