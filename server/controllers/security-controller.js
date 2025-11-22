// server/controllers/security-controller.js - Security Management Controller
import { UserSession } from '../models/userSession.js';
import { SecurityEvent } from '../models/securityEvent.js';
import { SecurityRestriction } from '../models/securityRestriction.js';

export class SecurityController {
  
  /**
   * Get user's active sessions
   * GET /api/security/sessions
   */
  static async getUserSessions(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const sessions = await UserSession.findUserSessions(userId);
      const currentSessionToken = req.sessionToken;

      // Mark current session
      const sessionsWithCurrent = sessions.map(session => ({
        ...session,
        is_current: session.session_token === currentSessionToken,
        // Hide sensitive data
        session_token: session.session_token === currentSessionToken ? session.session_token : '***'
      }));

      res.json({
        success: true,
        data: {
          sessions: sessionsWithCurrent,
          total: sessions.length,
          active: sessions.filter(s => s.is_active).length
        }
      });
    } catch (error) {
      console.error('Error getting user sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving sessions'
      });
    }
  }

  /**
   * Terminate a specific session
   * DELETE /api/security/sessions/:sessionId
   */
  static async terminateSession(req, res) {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Find the session to verify ownership
      const sessions = await UserSession.findUserSessions(userId, false);
      const targetSession = sessions.find(s => s.id === sessionId);

      if (!targetSession) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Terminate the session
      await UserSession.terminate(targetSession.session_token, 'User requested termination', userId);

      res.json({
        success: true,
        message: 'Session terminated successfully'
      });
    } catch (error) {
      console.error('Error terminating session:', error);
      res.status(500).json({
        success: false,
        message: 'Error terminating session'
      });
    }
  }

  /**
   * Terminate all sessions except current
   * POST /api/security/sessions/terminate-all
   */
  static async terminateAllSessions(req, res) {
    try {
      const userId = req.user?.id;
      const currentSessionToken = req.sessionToken;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await UserSession.terminateAllExcept(
        userId, 
        currentSessionToken, 
        'User requested mass termination'
      );

      res.json({
        success: true,
        message: `${result.terminatedCount} sessions terminated successfully`,
        data: {
          terminatedCount: result.terminatedCount
        }
      });
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Error terminating sessions'
      });
    }
  }

  /**
   * Get user's security events
   * GET /api/security/events
   */
  static async getUserSecurityEvents(req, res) {
    try {
      const userId = req.user?.id;
      const { severity, eventType, limit = 50 } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const filters = { limit: parseInt(limit) };
      if (severity) filters.severity = severity;
      if (eventType) filters.eventType = eventType;

      const events = await SecurityEvent.getUserEvents(userId, filters);

      res.json({
        success: true,
        data: {
          events: events,
          total: events.length
        }
      });
    } catch (error) {
      console.error('Error getting security events:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving security events'
      });
    }
  }

  /**
   * Get security statistics
   * GET /api/security/statistics
   */
  static async getSecurityStatistics(req, res) {
    try {
      const userId = req.user?.id;
      const { timeframe = '24h' } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const [sessionStats, eventStats] = await Promise.all([
        UserSession.getStatistics(userId),
        SecurityEvent.getStatistics(userId, timeframe)
      ]);

      res.json({
        success: true,
        data: {
          sessions: sessionStats,
          events: eventStats,
          timeframe: timeframe
        }
      });
    } catch (error) {
      console.error('Error getting security statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving security statistics'
      });
    }
  }

  /**
   * Force disconnect user (admin only)
   * POST /api/security/admin/force-disconnect
   */
  static async forceDisconnectUser(req, res) {
    try {
      const adminId = req.user?.id;
      const { userId, reason } = req.body;

      // Check admin permissions
      const isAdmin = await this.checkAdminPermission(adminId);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin permissions required'
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const result = await UserSession.forceDisconnect(
        userId, 
        reason || 'Administrative action', 
        adminId
      );

      res.json({
        success: true,
        message: `User disconnected. ${result.terminatedCount} sessions terminated.`,
        data: result
      });
    } catch (error) {
      console.error('Error force disconnecting user:', error);
      res.status(500).json({
        success: false,
        message: 'Error disconnecting user'
      });
    }
  }

  /**
   * Ban IP address (admin only)
   * POST /api/security/admin/ban-ip
   */
  static async banIP(req, res) {
    try {
      const adminId = req.user?.id;
      const { ipAddress, reason, expiresAt } = req.body;

      // Check admin permissions
      const isAdmin = await this.checkAdminPermission(adminId);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin permissions required'
        });
      }

      if (!ipAddress) {
        return res.status(400).json({
          success: false,
          message: 'IP address is required'
        });
      }

      const restriction = await SecurityRestriction.banIP(
        ipAddress,
        reason || 'Administrative ban',
        adminId,
        expiresAt
      );

      res.json({
        success: true,
        message: 'IP address banned successfully',
        data: restriction
      });
    } catch (error) {
      console.error('Error banning IP:', error);
      res.status(500).json({
        success: false,
        message: 'Error banning IP address'
      });
    }
  }

  /**
   * Suspend user account (admin only)
   * POST /api/security/admin/suspend-account
   */
  static async suspendAccount(req, res) {
    try {
      const adminId = req.user?.id;
      const { userId, reason, expiresAt } = req.body;

      // Check admin permissions
      const isAdmin = await this.checkAdminPermission(adminId);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin permissions required'
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const restriction = await SecurityRestriction.suspendAccount(
        userId,
        reason || 'Administrative suspension',
        adminId,
        expiresAt
      );

      res.json({
        success: true,
        message: 'Account suspended successfully',
        data: restriction
      });
    } catch (error) {
      console.error('Error suspending account:', error);
      res.status(500).json({
        success: false,
        message: 'Error suspending account'
      });
    }
  }

  /**
   * Get all security events (admin only)
   * GET /api/security/admin/events
   */
  static async getAllSecurityEvents(req, res) {
    try {
      const adminId = req.user?.id;
      const { severity, eventType, limit = 100 } = req.query;

      // Check admin permissions
      const isAdmin = await this.checkAdminPermission(adminId);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin permissions required'
        });
      }

      const filters = { limit: parseInt(limit) };
      if (severity) filters.severity = severity;
      if (eventType) filters.eventType = eventType;

      const events = await SecurityEvent.getAllEvents(filters);

      res.json({
        success: true,
        data: {
          events: events,
          total: events.length
        }
      });
    } catch (error) {
      console.error('Error getting all security events:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving security events'
      });
    }
  }

  /**
   * Get all restrictions (admin only)
   * GET /api/security/admin/restrictions
   */
  static async getAllRestrictions(req, res) {
    try {
      const adminId = req.user?.id;
      const { restrictionType, isActive, limit = 100 } = req.query;

      // Check admin permissions
      const isAdmin = await this.checkAdminPermission(adminId);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin permissions required'
        });
      }

      const filters = { limit: parseInt(limit) };
      if (restrictionType) filters.restrictionType = restrictionType;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const restrictions = await SecurityRestriction.getAllRestrictions(filters);

      res.json({
        success: true,
        data: {
          restrictions: restrictions,
          total: restrictions.length
        }
      });
    } catch (error) {
      console.error('Error getting all restrictions:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving restrictions'
      });
    }
  }

  /**
   * Remove restriction (admin only)
   * DELETE /api/security/admin/restrictions/:restrictionId
   */
  static async removeRestriction(req, res) {
    try {
      const adminId = req.user?.id;
      const { restrictionId } = req.params;
      const { reason } = req.body;

      // Check admin permissions
      const isAdmin = await this.checkAdminPermission(adminId);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin permissions required'
        });
      }

      const restriction = await SecurityRestriction.removeRestriction(
        restrictionId,
        adminId,
        reason || 'Administrative removal'
      );

      res.json({
        success: true,
        message: 'Restriction removed successfully',
        data: restriction
      });
    } catch (error) {
      console.error('Error removing restriction:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing restriction'
      });
    }
  }

  /**
   * Cleanup expired sessions and restrictions
   * POST /api/security/admin/cleanup
   */
  static async cleanup(req, res) {
    try {
      const adminId = req.user?.id;

      // Check admin permissions
      const isAdmin = await this.checkAdminPermission(adminId);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin permissions required'
        });
      }

      const [sessionCleanup, restrictionCleanup, eventCleanup] = await Promise.all([
        UserSession.cleanupExpired(),
        SecurityRestriction.cleanupExpired(),
        SecurityEvent.cleanupOldEvents(90) // Keep 90 days of events
      ]);

      res.json({
        success: true,
        message: 'Cleanup completed successfully',
        data: {
          sessions: sessionCleanup,
          restrictions: restrictionCleanup,
          events: eventCleanup
        }
      });
    } catch (error) {
      console.error('Error during cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Error during cleanup'
      });
    }
  }

  /**
   * Helper: Check admin permissions
   * @private
   */
  static async checkAdminPermission(userId) {
    try {
      const { supabase } = await import('../utils/supabase.js');
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      return profile && ['admin', 'manager'].includes(profile.role);
    } catch (error) {
      console.error('Error checking admin permission:', error);
      return false;
    }
  }
}
