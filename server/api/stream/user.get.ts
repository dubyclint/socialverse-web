// server/api/stream/user.get.ts
import { 
  authenticateUser, 
  streamOperations, 
  handleError 
} from '../../utils/auth-utils';

export default defineEventHandler(async (event) => {
  try {
    const user = await authenticateUser(event);
    const result = await streamOperations.getUserStreams(user.id);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return handleError(error, 'Get user streams');
  }
});
