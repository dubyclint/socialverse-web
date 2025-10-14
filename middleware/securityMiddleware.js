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
