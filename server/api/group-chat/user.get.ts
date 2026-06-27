// server/api/group-chat/user.get.ts
import { 
  authenticateUser, 
  handleError 
} from '../../utils/auth-utils'
import { groupChatOperations } from '../../utils/group-chat-utils'

export default defineEventHandler(async (event) => {
  try {
    const user = await authenticateUser(event)
    const result = await groupChatOperations.listGroups(user.id)

    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    return handleError(error)
  }
})
