// server/api/presence/ping.post.ts
import { useRedis } from '#redis' // Assuming you have a Redis module installed

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const redis = useRedis()
  
  // Set user presence in Redis with 60s TTL
  // If no ping is received for 60s, the key disappears automatically
  await redis.set(`presence:${user.id}`, 'online', 'EX', 60)
  
  return { success: true }
})
