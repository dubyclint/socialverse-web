// server/api/stream/index.post.ts
import { 
  authenticateUser, 
  streamOperations, 
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
      // Rate limiting removed - can be added later with a proper rate limiting package
      validateBody(body, ['title']);
      result = await streamOperations.createStream(user.id, body);
    } 
    else if (action === 'update') {
      validateBody(body, ['stream_id']);
      result = await streamOperations.updateStream(body.stream_id, body);
    } 
    else if (action === 'delete') {
      validateBody(body, ['stream_id']);
      result = await streamOperations.deleteStream(body.stream_id);
    } 
    else {
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown action: ${action}`
      });
    }

    return {
      success: true,
      message: `Stream ${action} successful`,
      data: result
    };
  } catch (error: any) {
    return handleError(error, 'Stream operation');
  }
});
