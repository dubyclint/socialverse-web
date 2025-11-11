// middleware/security-middleware.js - Security and Session Management Middleware
// REMOVED: Node.js crypto imports - not available in browser context
// import crypto from 'crypto';
// import { createHmac } from 'crypto';

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

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Session validation failed',
      code: 'SESSION_VALIDATION_ERROR'
    });
  }
};

