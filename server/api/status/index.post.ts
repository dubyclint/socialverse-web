// server/api/status/index.post.ts
import { 
  authenticateUser, 
  statusOperations, 
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
      validateBody(body, ['content']);
      
      // Handle file uploads if present
      const formData = await readMultipartFormData(event);
      const files = formData?.filter(f => f.filename) || [];

      result = await statusOperations.createStatus(user.id, {
        ...body,
        files: files.map(f => ({
          filename: f.filename,
          type: f.type
        }))
      });
    } 
    else if (action === 'delete') {
      validateBody(body, ['status_id']);
      result = await statusOperations.deleteStatus(body.status_id);
    } 
    else if (action === 'get') {
      result = await statusOperations.getUserStatuses(user.id);
    } 
    else {
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown action: ${action}`
      });
    }

    return {
      success: true,
      message: `Status ${action} successful`,
      data: result
    };
  } catch (error: any) {
    return handleError(error, 'Status operation');
  }
});
