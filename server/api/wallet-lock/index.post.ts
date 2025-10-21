// server/api/wallet-lock/index.post.ts
import { 
  authenticateUser, 
  walletOperations, 
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

    if (action === 'lock') {
      validateBody(body, ['amount']);
      result = await walletOperations.lockWallet(user.id, body);
    } 
    else if (action === 'unlock') {
      validateBody(body, ['lock_id']);
      result = await walletOperations.unlockWallet(body.lock_id);
    } 
    else if (action === 'get_locks') {
      result = await walletOperations.getWalletLocks(user.id);
    } 
    else {
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown action: ${action}`
      });
    }

    return {
      success: true,
      message: `Wallet lock ${action} successful`,
      data: result
    };
  } catch (error: any) {
    return handleError(error, 'Wallet lock operation');
  }
});
