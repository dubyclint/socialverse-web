// server/api/pew-gift/index.post.ts
import { 
  authenticateUser, 
  rateLimit, 
  giftOperations, 
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

    if (action === 'send') {
      await rateLimit(10, 60000)(event); // 10 requests per minute
      validateBody(body, ['recipient_id', 'amount']);
      result = await giftOperations.sendGift({
        sender_id: user.id,
        ...body
      });
    } 
    else if (action === 'get') {
      result = await giftOperations.getGifts(user.id);
    } 
    else if (action === 'cancel') {
      validateBody(body, ['gift_id']);
      result = await giftOperations.cancelGift(body.gift_id);
    } 
    else {
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown action: ${action}`
      });
    }

    return {
      success: true,
      message: `Gift ${action} successful`,
      data: result
    };
  } catch (error: any) {
    return handleError(error, 'Gift operation');
  }
});
