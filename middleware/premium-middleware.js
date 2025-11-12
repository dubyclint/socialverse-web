// middleware/premium-middleware.js - Premium Feature Access Middleware
/**
 * Nuxt route middleware to check if user has access to premium feature
 * This is a client-side middleware that calls server endpoints
 */
export default defineRouteMiddleware(async (to, from) => {
  try {
    const user = useAuthStore().user;
    
    if (!user) {
      return navigateTo('/login');
    }

    // Check premium status via API
    const { data, error } = await useFetch('/api/premium/check-access', {
      method: 'POST',
      body: {
        userId: user.id,
        featureKey: to.meta?.requiredFeature
      }
    });

    if (error.value || !data.value?.hasAccess) {
      return navigateTo('/premium');
    }
  } catch (error) {
    console.error('Premium middleware error:', error);
    return navigateTo('/error');
  }
});

/**
 * Middleware to check user premium restrictions
 */
export const checkPremiumRestrictions = defineRouteMiddleware(async (to, from) => {
  try {
    const user = useAuthStore().user;
    
    if (!user) {
      return;
    }

    const { data, error } = await useFetch('/api/premium/check-restrictions', {
      method: 'POST',
      body: { userId: user.id }
    });

    if (data.value?.isRestricted) {
      return navigateTo('/account-restricted');
    }
  } catch (error) {
    console.error('Premium restriction check error:', error);
  }
});

/**
 * Middleware to verify premium subscription status
 */
export const verifyPremiumSubscription = defineRouteMiddleware(async (to, from) => {
  try {
    const user = useAuthStore().user;
    
    if (!user) {
      return navigateTo('/login');
    }

    const { data, error } = await useFetch('/api/premium/verify-subscription', {
      method: 'POST',
      body: { userId: user.id }
    });

    if (error.value || !data.value?.isActive) {
      return navigateTo('/subscribe');
    }
  } catch (error) {
    console.error('Premium subscription verification error:', error);
    return navigateTo('/error');
  }
});
