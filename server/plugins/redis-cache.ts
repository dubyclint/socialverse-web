import upstashDriver from 'unstorage/drivers/upstash'
import type { Driver } from 'unstorage'

interface MountableStorage {
  mount: (base: string, driver: Driver) => void
  unmount: (base: string, dispose?: boolean) => Promise<void>
}

/**
 * Points the server cache (feed candidate pool, author profiles, any
 * `defineCachedFunction`) at Upstash Redis when credentials are configured, so
 * cached reads are shared across instances instead of living in each process's
 * memory. Supabase stays the source of truth; this only holds derived values.
 */
export default defineNitroPlugin(async () => {
  // The prerenderer boots the server inside the build; routing its cache to
  // Upstash would both fail the build and pollute the shared cache.
  if (import.meta.prerender) return

  const config = useRuntimeConfig()
  const url = config.upstashRedisRestUrl
  const token = config.upstashRedisRestToken
  if (!url || !token) return

  const storage = useStorage() as unknown as MountableStorage
  // Nitro already mounts its in-memory `cache:`; unstorage throws on a
  // duplicate mount, so the built-in one is released first.
  await storage.unmount('cache', false)
  storage.mount('cache', upstashDriver({ base: 'viorp:cache', url, token }))
})
