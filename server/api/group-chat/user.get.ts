// server/api/group-chat/user.get.ts
import { 
  handleError 
} from '../../gateway/auth/auth-utils'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { groupChatOperations } from '../../utils/group-chat-utils'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const result = await groupChatOperations.listGroups(user.id)

    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    return handleError(error)
  }
})
