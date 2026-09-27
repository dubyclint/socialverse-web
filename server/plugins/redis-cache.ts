import upstashDriver from 'unstorage/drivers/upstash'
import type { Driver } from 'unstorage'

interface MountableStorage {
  mount: (base: string, driver: Driver) => void
}

/**
 * Points the server cache (feed candidate pool, author profiles, any
 * `defineCachedFunction`) at Upstash Redis when credentials are configured, so
 * cached reads are shared across instances instead of living in each process's
 * memory. Supabase stays the source of truth; this only holds derived values.
 */
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const url = config.upstashRedisRestUrl
  const token = config.upstashRedisRestToken
  if (!url || !token) return

  const storage = useStorage() as unknown as MountableStorage
  storage.mount('cache', upstashDriver({ base: 'viorp:cache', url, token }))
})
