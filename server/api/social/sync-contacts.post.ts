// server/api/social/sync-contacts.post.ts
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { phoneHashes } = await readBody(event) // Array of hashed numbers
  
  const client = await serverSupabaseClient(event)

  // 1. Find existing users who match these hashes
  const { data: matchedUsers } = await client
    .from('profiles')
    .select('id')
    .in('phone_hash', phoneHashes)

  // 2. Insert into the social graph
  const relationships = matchedUsers.map(match => ({
    user_id: user.id,
    friend_id: match.id,
    status: 'connected'
  }))

  await client.from('user_contacts').upsert(relationships)

  return { success: true, count: relationships.length }
})
