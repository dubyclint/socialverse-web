// server/api/discovery/feed.get.ts
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  // 1. Determine Content Priority
  // We use our orchestrated helper function to decide what to show
  const content = await getDiscoveryContent(user.id)
  
  // 2. Append Presence Metadata
  // We check Redis to see if the content owners are currently "Online"
  // to prioritize "Live" content in the feed
  const feedWithPresence = await Promise.all(
    content.data.map(async (item: any) => {
      const isOnline = await checkPresence(item.id) 
      return { ...item, isOnline }
    })
  )

  return {
    strategy: content.type, // 'social', 'network', or 'external'
    items: feedWithPresence
  }
})
