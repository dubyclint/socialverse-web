// server/api/stream/[id].get.ts
import { 
  authenticateUser, 
  streamOperations, 
  handleError 
} from '../../utils/auth-utils';

export default defineEventHandler(async (event) => {
  try {
    await authenticateUser(event);
    const { id } = event.context.params;

    const result = await streamOperations.getStream(id);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return handleError(error, 'Get stream');
  }
});
