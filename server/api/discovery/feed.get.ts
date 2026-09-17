// server/api/discovery/feed.get.ts
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getDiscoveryContent } from '~/server/utils/ad-engine'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // 1. Determine Content Priority
  // We use our orchestrated helper function to decide what to show
  const content = await getDiscoveryContent(user.id)

  // 2. Append Presence Metadata
  // Presence helper is optional — import it at runtime and fall back to undefined
  let _checkPresence: any = undefined
  try {
    const mod = await import('~/server/utils/presence')
    _checkPresence = (mod && (mod.checkPresence as any)) || undefined
  } catch (e) {
    _checkPresence = undefined
  }

  const feedWithPresence = await Promise.all(
    content.data.map(async (item: any) => {
      const isOnline = typeof _checkPresence === 'function' ? await _checkPresence(item.id) : false
      return { ...item, isOnline }
    })
  )

  return {
    strategy: content.type, // 'social', 'network', or 'external'
    items: feedWithPresence
  }
})
