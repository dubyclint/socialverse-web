// FILE: /server/api/messages/index.get.ts - COMPLETE NEW FILE
// ============================================================================
// GET MESSAGES ENDPOINT
// ✅ NEW: Fetch user messages with pagination
// ============================================================================

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const query = getQuery(event)
    const unreadOnly = query.unread_only === 'true'
    const limit = parseInt(query.limit as string) || 10
    const offset = parseInt(query.offset as string) || 0

    console.log('[Messages API] Fetching messages for user:', user.id)
    console.log('[Messages API] Unread only:', unreadOnly, 'Limit:', limit, 'Offset:', offset)

    // TODO: Replace with actual database query
    // Example implementation:
    // const messages = await db.messages.findMany({
    //   where: {
    //     OR: [
    //       { recipientId: user.id },
    //       { senderId: user.id }
    //     ],
    //     ...(unreadOnly && { read: false, recipientId: user.id })
    //   },
    //   orderBy: { createdAt: 'desc' },
    //   take: limit,
    //   skip: offset,
    //   include: {
    //     sender: { select: { id: true, username: true, avatar_url: true } },
    //     recipient: { select: { id: true, username: true, avatar_url: true } }
    //   }
    // })

    return {
      success: true,
      data: [],
      total: 0,
      limit,
      offset,
      message: 'Messages fetched successfully'
    }

  } catch (error: any) {
    console.error('[Messages API] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch messages'
    })
  }
})
