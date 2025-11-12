// middleware/security-middleware.js - Security and Session Management Middleware
/**
 * Nuxt route middleware for session validation
 * Calls server endpoints instead of importing server models
 */
export default defineRouteMiddleware(async (to, from) => {
  try {
    const token = useCookie('session_token').value;

    if (!token) {
      return navigateTo('/login');
    }

    // Validate session via API
    const { data, error } = await useFetch('/api/auth/validate-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (error.value || !data.value?.valid) {
      useCookie('session_token').value = null;
      return navigateTo('/login');
    }
  } catch (error) {
    console.error('Session validation error:', error);
    return navigateTo('/login');
  }
});

/**
 * Middleware to check security restrictions
 */
export const checkSecurityRestrictions = defineRouteMiddleware(async (to, from) => {
  try {
    const user = useAuthStore().user;
    
    if (!user) {
      return;
    }

    const { data, error } = await useFetch('/api/security/check-restrictions', {
      method: 'POST',
      body: { userId: user.id }
    });

    if (data.value?.isRestricted) {
      return navigateTo('/security-alert');
    }
  } catch (error) {
    console.error('Security restriction check error:', error);
  }
});

/**
 * Middleware to log security events
 */
export const logSecurityEvent = defineRouteMiddleware(async (to, from) => {
  try {
    const user = useAuthStore().user;
    
    if (!user) {
      return;
    }

    // Log route access as security event
    await useFetch('/api/security/log-event', {
      method: 'POST',
      body: {
        userId: user.id,
        eventType: 'ROUTE_ACCESS',
        route: to.path,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Security event logging error:', error);
    // Don't block navigation on logging errors
  }
});

/**
 * Middleware to check IP restrictions
 */
export const checkIpRestrictions = defineRouteMiddleware(async (to, from) => {
  try {
    const user = useAuthStore().user;
    
    if (!user) {
      return;
    }

    const { data, error } = await useFetch('/api/security/check-ip', {
      method: 'POST',
      body: { userId: user.id }
    });

    if (error.value || !data.value?.allowed) {
      return navigateTo('/access-denied');
    }
  } catch (error) {
    console.error('IP restriction check error:', error);
  }
});
