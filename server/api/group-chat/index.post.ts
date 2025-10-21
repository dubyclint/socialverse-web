// server/api/group-chat/index.post.ts
import { 
  authenticateUser, 
  groupChatOperations, 
  validateBody, 
  handleError 
} from '../../utils/auth-utils';

export default defineEventHandler(async (event) => {
  try {
    const user = await authenticateUser(event);
    const body = await readBody(event);
    const { action } = body;

    validateBody(body, ['action']);

    let result;

    if (action === 'create') {
      validateBody(body, ['name']);
      result = await groupChatOperations.createGroup(user.id, body);
    } 
    else if (action === 'add_member') {
      validateBody(body, ['group_id', 'member_id']);
      result = await groupChatOperations.addMember(body.group_id, body.member_id);
    } 
    else if (action === 'remove_member') {
      validateBody(body, ['group_id', 'member_id']);
      result = await groupChatOperations.removeMember(body.group_id, body.member_id);
    } 
    else {
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown action: ${action}`
      });
    }

    return {
      success: true,
      message: `Group chat ${action} successful`,
      data: result
    };
  } catch (error: any) {
    return handleError(error, 'Group chat operation');
  }
});
