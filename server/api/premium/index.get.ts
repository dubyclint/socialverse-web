// server/api/premium/index.get.ts
import { 
  premiumOperations, 
  handleError 
} from '../../gateway/auth/auth-utils';
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const query = getQuery(event);
    const { action } = query;

    let result;

    if (action === 'pricing') {
      result = await premiumOperations.getPricingTiers();
    } 
    else if (action === 'subscription') {
      result = await premiumOperations.getUserSubscription(user.id);
    } 
    else if (action === 'check_feature') {
      const { feature_key } = query;
      if (!feature_key) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing feature_key parameter'
        });
      }
      result = await premiumOperations.checkFeatureAccess(user.id, feature_key as string);
    } 
    else {
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown action: ${action}`
      });
    }

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return handleError(error, 'Premium operation');
  }
});
