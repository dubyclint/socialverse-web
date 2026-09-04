// server/api/discovery/feed.get.ts
import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getDiscoveryContent } from '~/server/utils/ad-engine'
import { checkPresence } from '~/server/utils/presence'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const client = await serverSupabaseClient<Database>(event)

  const content = await getDiscoveryContent(client, user.id)

  const items = await Promise.all(
    content.data.map(async item => ({
      ...item,
      isOnline: await checkPresence(item.id)
    }))
  )

  return {
    strategy: content.type,
    items
  }
})
