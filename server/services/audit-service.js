const { AuditLog } = require('../models/AuditLog');
const logger = require('../config/logger');
const redis = require('../config/redis');

class AuditService {
  
  constructor() {
    this.batchSize = 100;
    this.flushInterval = 30000; // 30 seconds
    this.pendingLogs = [];
    this.startBatchProcessor();
  }
  
  /**
   * Log compliance check
   */
  async logComplianceCheck(data) {
    try {
      const logEntry = {
        type: 'COMPLIANCE_CHECK',
        userId: data.userId,
        feature: data.feature,
        result: data.result,
        reason: data.reason,
        context: data.context,
        policies: data.policies || [],
        timestamp: new Date(),
        ip: data.context?.ip,
        userAgent: data.context?.userAgent,
        country: data.context?.country,
        region: data.context?.region
      };
      
      // Add to batch for processing
      this.addToBatch(logEntry);
      
    } catch (error) {
      logger.error('Error logging compliance check:', error);
    }
  }
  
  /**
   * Log policy change
   */
  async logPolicyChange(data) {
    try {
      const logEntry = {
        type: 'POLICY_CHANGE',
        policyId: data.policyId,
        action: data.action, // CREATE, UPDATE, DELETE
        changes: data.changes,
        changedBy: data.changedBy,
        timestamp: new Date(),
        oldValues: data.oldValues,
        newValues: data.newValues
      };
      
      this.addToBatch(logEntry);
      
    } catch (error) {
      logger.error('Error logging policy change:', error);
    }
  }
  
  /**
   * Log sanctions check
   */
  async logSanctionsCheck(data) {
    try {
      const logEntry = {
        type: 'SANCTIONS_CHECK',
        userId: data.userId,
        result: data.result,
        matches: data.matches || [],
        confidence: data.confidence,
        timestamp: new Date(),
        context: data.context
      };
      
      this.addToBatch(logEntry);
      
    } catch (error) {
      logger.error('Error logging sanctions check:', error);
    }
  }
  
  /**
   * Log geo-location check
   */
  async logGeoCheck(data) {
    try {
      const logEntry = {
        type: 'GEO_CHECK',
        userId: data.userId,
        ip: data.ip,
        location: data.location,
        riskLevel: data.riskLevel,
        timestamp: new Date(),
        consistent: data.consistent
      };
      
      this.addToBatch(logEntry);
      
    } catch (error) {
      logger.error('Error logging geo check:', error);
    }
  }
  
  /**
   * Log admin action
   */
  async logAdminAction(data) {
    try {
      const logEntry = {
        type: 'ADMIN_ACTION',
        adminId: data.adminId,
        action: data.action,
        target: data.target,
        details: data.details,
        timestamp: new Date(),
        ip: data.ip,
        userAgent: data.userAgent
      };
      
      this.addToBatch(logEntry);
      
    } catch (error) {
      logger.error('Error logging admin action:', error);
    }
  }
  
  /**
   * Add log entry to batch
   */
  addToBatch(logEntry) {
    this.pendingLogs.push(logEntry);
    
    // Flush immediately if batch is full
    if (this.pendingLogs.length >= this.batchSize) {
      this.flushBatch();
    }
  }
  
  /**
   * Start batch processor
   */
  startBatchProcessor() {
    setInterval(() => {
      if (this.pendingLogs.length > 0) {
        this.flushBatch();
      }
    }, this.flushInterval);
  }
  
  /**
   * Flush pending logs to database
   */
  async flushBatch() {
    if (this.pendingLogs.length === 0) return;
    
    const logsToFlush = [...this.pendingLogs];
    this.pendingLogs = [];
    
    try {
      await AuditLog.batchInsert(logsToFlush);
      logger.debug(`Flushed ${logsToFlush.length} audit logs`);
    } catch (error) {
      logger.error('Error flushing audit logs:', error);
      
      // Re-add failed logs to pending (with limit to prevent memory issues)
      if (this.pendingLogs.length < 1000) {
        this.pendingLogs.unshift(...logsToFlush);
      }
    }
  }
  
  /**
   * Get audit logs with filtering
   */
  async getLogs(filters = {}) {
    try {
      const {
        userId,
        type,
        startDate,
        endDate,
        result,
        feature,
        limit = 100,
        offset = 0
      } = filters;
      
      const logs = await AuditLog.find({
        userId,
        type,
        startDate,
        endDate,
        result,
        feature,
        limit,
        offset
      });
      
      return logs;
      
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw error;
    }
  }
  
  /**
   * Get compliance statistics
   */
  async getComplianceStats(filters = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate = new Date(),
        feature,
        country
      } = filters;
      
      const stats = await AuditLog.getStats({
        startDate,
        endDate,
        feature,
        country
      });
      
      return {
        totalChecks: stats.totalChecks,
        allowedChecks: stats.allowedChecks,
        blockedChecks: stats.blockedChecks,
        allowedPercentage: (stats.allowedChecks / stats.totalChecks * 100).toFixed(2),
        blockedPercentage: (stats.blockedChecks / stats.totalChecks * 100).toFixed(2),
        byFeature: stats.byFeature,
        byCountry: stats.byCountry,
        byReason: stats.byReason,
        timeline: stats.timeline
      };
      
    } catch (error) {
      logger.error('Error getting compliance stats:', error);
      throw error;
    }
  }
  
  /**
   * Get user activity summary
   */
  async getUserActivity(userId, days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const activity = await AuditLog.getUserActivity(userId, startDate);
      
      return {
        userId,
        period: `${days} days`,
        totalActions: activity.totalActions,
        allowedActions: activity.allowedActions,
        blockedActions: activity.blockedActions,
        features: activity.features,
        locations: activity.locations,
        timeline: activity.timeline
      };
      
    } catch (error) {
      logger.error('Error getting user activity:', error);
      throw error;
    }
  }
  
  /**
   * Generate compliance report
   */
  async generateComplianceReport(filters = {}) {
    try {
      const stats = await this.getComplianceStats(filters);
      const topBlockedFeatures = Object.entries(stats.byFeature)
        .filter(([_, data]) => data.blocked > 0)
        .sort(([_, a], [__, b]) => b.blocked - a.blocked)
        .slice(0, 10);
      
      const topBlockedCountries = Object.entries(stats.byCountry)
        .filter(([_, data]) => data.blocked > 0)
        .sort(([_, a], [__, b]) => b.blocked - a.blocked)
        .slice(0, 10);
      
      return {
        summary: {
          totalChecks: stats.totalChecks,
          allowedPercentage: stats.allowedPercentage,
          blockedPercentage: stats.blockedPercentage,
          reportPeriod: filters.startDate && filters.endDate 
            ? `${filters.startDate.toISOString().split('T')[0]} to ${filters.endDate.toISOString().split('T')[0]}`
            : 'Last 30 days'
        },
        topBlockedFeatures: topBlockedFeatures.map(([feature, data]) => ({
          feature,
          blockedCount: data.blocked,
          blockedPercentage: ((data.blocked / data.total) * 100).toFixed(2)
        })),
        topBlockedCountries: topBlockedCountries.map(([country, data]) => ({
          country,
          blockedCount: data.blocked,
          blockedPercentage: ((data.blocked / data.total) * 100).toFixed(2)
        })),
        blockingReasons: stats.byReason,
        timeline: stats.timeline,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      throw error;
    }
  }
  
  /**
   * Archive old logs
   */
  async archiveOldLogs(daysToKeep = 365) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      const archivedCount = await AuditLog.archiveOldLogs(cutoffDate);
      
      logger.info(`Archived ${archivedCount} old audit logs`);
      return archivedCount;
      
    } catch (error) {
      logger.error('Error archiving old logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
