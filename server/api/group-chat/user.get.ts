// server/api/group-chat/user.get.ts
import { 
  authenticateUser, 
  groupChatOperations, 
  handleError 
} from '../../utils/auth-utils';

export default defineEventHandler(async (event) => {
  try {
    const user = await authenticateUser(event);
    const result = await groupChatOperations.getUserGroups(user.id);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return handleError(error, 'Get user groups');
  }
});
