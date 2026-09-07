// server/api/presence/ping.post.ts
let useRedis: any = () => ({ set: async () => {} })
try {
  // Optional redis import - not available in some environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  useRedis = require('#redis').useRedis
} catch (e) {
  // fallback no-op
}
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
// h3 helpers intentionally not needed here

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const redis = useRedis()
  
  // Set user presence in Redis with 60s TTL
  // If no ping is received for 60s, the key disappears automatically
  await redis.set(`presence:${user.id}`, 'online', 'EX', 60)
  
  return { success: true }
})
