// middleware/securityMiddleware.js - Security and Session Management Middleware
import { UserSession } from '../models/userSession.js';
import { SecurityRestriction } from '../models/securityRestriction.js';
import { SecurityEvent } from '../models/securityEvent.js';

/**
 * Session validation middleware
 */
export const validateSession = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                        req.cookies?.session_token;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided',
        code: 'NO_SESSION_TOKEN'
      });
    }

    const validation = await UserSession.validateSession(sessionToken);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        message: validation.reason,
        code: 'INVALID_SESSION'
      });
    }

    // Add user and session info to request
    req.user = validation.user;
    req.session = validation.session;
    req.sessionToken = sessionToken;

    next();
  } catch (error) {
    console.error('Error in session validation middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Session validation error',
      code: 'VALIDATION_ERROR'
    });
  }
};

/**
 * IP ban check middleware
 */
export const checkIPBan = async (req, res, next) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

    const isBanned = await SecurityRestriction.isIPBanned(clientIP);

    if (isBanned) {
      // Log banned IP attempt
      await SecurityEvent.create({
        userId: null,
        eventType: 'BANNED_IP_ACCESS_ATTEMPT',
        eventData: { ip_address: clientIP },
        ipAddress: clientIP,
        userAgent: req.headers['user-agent'],
        severity: 'WARNING'
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
        code: 'IP_BANNED'
      });
    }

    next();
  } catch (error) {
    console.error('Error in IP ban check middleware:', error);
    next(); // Continue on error to avoid blocking legitimate users
  }
};

/**
 * Account suspension check middleware
 */
export const checkAccountSuspension = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    const isSuspended = await SecurityRestriction.isAccountSuspended(userId);

    if (isSuspended) {
      // Terminate current session
      if (req.sessionToken) {
        await UserSession.terminate(req.sessionToken, 'Account suspended');
      }

      return res.status(403).json({
        success: false,
        message: 'Account is suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    next();*_
  } catch (error) {
    console.error('Error in account suspension check middleware:', error);
    next(); // Continue on error to avoid blocking legitimate users
  }
};

/**
 * Rate limiting middleware
 */
export const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests',
    skipSuccessfulRequests = false
  } = options;

  const requests = new Map();

  return async (req, res, next) => {
    try {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      if (requests.has(key)) {
        const userRequests = requests.get(key).filter(time => time > windowStart);
        requests.set(key, userRequests);
      }

      // Check current request count
      const currentRequests = requests.get(key) || [];
      
      if (currentRequests.length >= maxRequests) {
        // Log rate limit exceeded
        await SecurityEvent.create({
          userId: req.user?.id || null,
          eventType: 'RATE_LIMIT_EXCEEDED',
          eventData: { 
            ip_address: key,
            request_count: currentRequests.length,
            window_ms: windowMs
          },
          ipAddress: key,
          userAgent: req.headers['user-agent'],
          severity: 'WARNING'
        });

        return res.status(429).json({
          success: false,
          message: message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Add current request
      currentRequests.push(now);
      requests.set(key, currentRequests);

      next();
    } catch (error) {
      console.error('Error in rate limit middleware:', error);
      next(); // Continue on error
    }
  };
};

/**
 * Security monitoring middleware
 */
export const securityMonitor = async (req, res, next) => {
  try {
    const startTime = Date.now();
    
    // Log request
    const requestData = {
      method: req.method,
      url: req.url,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      user_id: req.user?.id || null
    };

    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function(data) {
      const responseTime = Date.now() - startTime;
      
      // Log security-relevant events
      if (res.statusCode >= 400) {
        SecurityEvent.create({
          userId: req.user?.id || null,
          eventType: 'FAILED_REQUEST',
          eventData: {
            ...requestData,
            status_code: res.statusCode,
            response_time: responseTime,
            error: data?.message || 'Unknown error'
          },
          ipAddress: requestData.ip_address,
          userAgent: requestData.user_agent,
          severity: res.statusCode >= 500 ? 'CRITICAL' : 'WARNING'
        }).catch(err => console.error('Error logging security event:', err));
      }

      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Error in security monitor middleware:', error);
    next();
  }
};

/**
 * Device fingerprinting middleware
 */
export const deviceFingerprint = async (req, res, next) => {
  try {
    const deviceInfo = {
      user_agent: req.headers['user-agent'],
      accept_language: req.headers['accept-language'],
      accept_encoding: req.headers['accept-encoding'],
      ip_address: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };

    // Generate device fingerprint
    const crypto = await import('crypto');
    const fingerprintData = JSON.stringify(deviceInfo);
    const fingerprint = crypto.createHash('sha256').update(fingerprintData).digest('hex');

    req.deviceFingerprint = fingerprint;
    req.deviceInfo = deviceInfo;

    next();
  } catch (error) {
    console.error('Error in device fingerprint middleware:', error);
    next();
  }
};

/**
 * Suspicious activity detection middleware
 */
export const detectSuspiciousActivity = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!userId) {
      return next();
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [];

    // Check for rapid requests from same IP
    const recentEvents = await SecurityEvent.getUserEvents(userId, {
      since: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // Last 5 minutes
      limit: 50
    });

    const sameIPEvents = recentEvents.filter(event => 
      event.ip_address === ipAddress
    );

    if (sameIPEvents.length > 20) {
      suspiciousPatterns.push('High request frequency');
    }

    // Check for multiple failed login attempts
    const failedLogins = recentEvents.filter(event => 
      event.event_type === 'FAILED_LOGIN' && event.ip_address === ipAddress
    );

    if (failedLogins.length > 5) {
      suspiciousPatterns.push('Multiple failed logins');
    }

    // Check for unusual user agent
    const userAgent = req.headers['user-agent'];
    if (!userAgent || userAgent.length < 10) {
      suspiciousPatterns.push('Suspicious user agent');
    }

    // If suspicious activity detected
    if (suspiciousPatterns.length > 0) {
      await SecurityEvent.create({
        userId: userId,
        eventType: 'SUSPICIOUS_ACTIVITY_DETECTED',
        eventData: {
          patterns: suspiciousPatterns,
          ip_address: ipAddress,
          user_agent: userAgent,
          request_url: req.url
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
        severity: 'WARNING'
      });

      // Auto-terminate session if highly suspicious
      if (suspiciousPatterns.length >= 2) {
        await UserSession.terminate(req.sessionToken, 'Suspicious activity detected');
        
        return res.status(403).json({
          success: false,
          message: 'Suspicious activity detected. Session terminated.',
          code: 'SUSPICIOUS_ACTIVITY'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in suspicious activity detection:', error);
    next();
  }
};
