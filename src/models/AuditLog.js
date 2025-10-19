const { Pool } = require('pg');
const logger = require('../config/logger');

class AuditLog {
  
  static async batchInsert(logs) {
    const client = new Pool();
    
    try {
      const query = `
        INSERT INTO audit_logs (
          type, user_id, feature, result, reason, context, 
          policies, ip, user_agent, country, region, timestamp
        ) VALUES ${logs.map((_, i) => `($${i * 12 + 1}, $${i * 12 + 2}, $${i * 12 + 3}, $${i * 12 + 4}, $${i * 12 + 5}, $${i * 12 + 6}, $${i * 12 + 7}, $${i * 12 + 8}, $${i * 12 + 9}, $${i * 12 + 10}, $${i * 12 + 11}, $${i * 12 + 12})`).join(', ')}
      `;
      
      const values = logs.flatMap(log => [
        log.type,
        log.userId,
        log.feature,
        log.result,
        log.reason,
        JSON.stringify(log.context || {}),
        JSON.stringify(log.policies || []),
        log.ip,
        log.userAgent,
        log.country,
        log.region,
        log.timestamp
      ]);
      
      await client.query(query, values);
      
    } catch (error) {
      logger.error('Error batch inserting audit logs:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static async find(filters = {}) {
    const client = new Pool();
    
    try {
      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const values = [];
      let paramIndex = 1;
      
      if (filters.userId) {
        query += ` AND user_id = $${paramIndex}`;
        values.push(filters.userId);
        paramIndex++;
      }
      
      if (filters.type) {
        query += ` AND type = $${paramIndex}`;
        values.push(filters.type);
        paramIndex++;
      }
      
      if (filters.feature) {
        query += ` AND feature = $${paramIndex}`;
        values.push(filters.feature);
        paramIndex++;
      }
      
      if (filters.result) {
        query += ` AND result = $${paramIndex}`;
        values.push(filters.result);
        paramIndex++;
      }
      
      if (filters.startDate) {
        query += ` AND timestamp >= $${paramIndex}`;
        values.push(filters.startDate);
        paramIndex++;
      }
      
      if (filters.endDate) {
        query += ` AND timestamp <= $${paramIndex}`;
        values.push(filters.endDate);
        paramIndex++;
      }
      
      query += ' ORDER BY timestamp DESC';
      
      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        values.push(filters.limit);
        paramIndex++;
      }
      
      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        values.push(filters.offset);
      }
      
      const result = await client.query(query, values);
      
      return result.rows.map(log => {
        log.context = JSON.parse(log.context || '{}');
        log.policies = JSON.parse(log.policies || '[]');
        return log;
      });
      
    } catch (error) {
      logger.error('Error finding audit logs:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static async getStats(filters = {}) {
    const client = new Pool();
    
    try {
      const baseQuery = `
        FROM audit_logs 
        WHERE type = 'COMPLIANCE_CHECK'
        AND timestamp >= $1 
        AND timestamp <= $2
      `;
      
      let values = [filters.startDate, filters.endDate];
      let paramIndex = 3;
      let additionalWhere = '';
      
      if (filters.feature) {
        additionalWhere += ` AND feature = $${paramIndex}`;
        values.push(filters.feature);
        paramIndex++;
      }
      
      if (filters.country) {
        additionalWhere += ` AND country = $${paramIndex}`;
        values.push(filters.country);
      }
      
      // Total counts
      const totalQuery = `SELECT COUNT(*) as total ${baseQuery} ${additionalWhere}`;
      const allowedQuery = `SELECT COUNT(*) as allowed ${baseQuery} ${additionalWhere} AND result = 'ALLOWED'`;
      const blockedQuery = `SELECT COUNT(*) as blocked ${baseQuery} ${additionalWhere} AND result = 'BLOCKED'`;
      
      const [totalResult, allowedResult, blockedResult] = await Promise.all([
        client.query(totalQuery, values),
        client.query(allowedQuery, values),
        client.query(blockedQuery, values)
      ]);
      
      // By feature stats
      const featureQuery = `
        SELECT feature, result, COUNT(*) as count 
        ${baseQuery} ${additionalWhere}
        GROUP BY feature, result
      `;
      const featureResult = await client.query(featureQuery, values);
      
      // By country stats
      const countryQuery = `
        SELECT country, result, COUNT(*) as count 
        ${baseQuery} ${additionalWhere}
        GROUP BY country, result
      `;
      const countryResult = await client.query(countryQuery, values);
      
      // By reason stats
      const reasonQuery = `
        SELECT reason, COUNT(*) as count 
        ${baseQuery} ${additionalWhere} AND result = 'BLOCKED'
        GROUP BY reason
      `;
      const reasonResult = await client.query(reasonQuery, values);
      
      // Timeline stats (daily)
      const timelineQuery = `
        SELECT DATE(timestamp) as date, result, COUNT(*) as count
        ${baseQuery} ${additionalWhere}
        GROUP BY DATE(timestamp), result
        ORDER BY date
      `;
      const timelineResult = await client.query(timelineQuery, values);
      
      // Process results
      const byFeature = {};
      featureResult.rows.forEach(row => {
        if (!byFeature[row.feature]) {
          byFeature[row.feature] = { total: 0, allowed: 0, blocked: 0 };
        }
        byFeature[row.feature][row.result.toLowerCase()] = parseInt(row.count);
        byFeature[row.feature].total += parseInt(row.count);
      });
      
      const byCountry = {};
      countryResult.rows.forEach(row => {
        if (!byCountry[row.country]) {
          byCountry[row.country] = { total: 0, allowed: 0, blocked: 0 };
        }
        byCountry[row.country][row.result.toLowerCase()] = parseInt(row.count);
        byCountry[row.country].total += parseInt(row.count);
      });
      
      const byReason = {};
      reasonResult.rows.forEach(row => {
        byReason[row.reason] = parseInt(row.count);
      });
      
      const timeline = {};
      timelineResult.rows.forEach(row => {
        const date = row.date.toISOString().split('T')[0];
        if (!timeline[date]) {
          timeline[date] = { allowed: 0, blocked:_
          timeline[date] = { allowed: 0, blocked: 0 };
        }
        timeline[date][row.result.toLowerCase()] = parseInt(row.count);
      });
      
      return {
        totalChecks: parseInt(totalResult.rows[0].total),
        allowedChecks: parseInt(allowedResult.rows[0].allowed),
        blockedChecks: parseInt(blockedResult.rows[0].blocked),
        byFeature,
        byCountry,
        byReason,
        timeline
      };
      
    } catch (error) {
      logger.error('Error getting audit stats:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static async getUserActivity(userId, startDate) {
    const client = new Pool();
    
    try {
      const query = `
        SELECT 
          type,
          feature,
          result,
          country,
          DATE(timestamp) as date,
          COUNT(*) as count
        FROM audit_logs 
        WHERE user_id = $1 
        AND timestamp >= $2
        GROUP BY type, feature, result, country, DATE(timestamp)
        ORDER BY date DESC
      `;
      
      const result = await client.query(query, [userId, startDate]);
      
      let totalActions = 0;
      let allowedActions = 0;
      let blockedActions = 0;
      const features = {};
      const locations = {};
      const timeline = {};
      
      result.rows.forEach(row => {
        const count = parseInt(row.count);
        totalActions += count;
        
        if (row.result === 'ALLOWED') {
          allowedActions += count;
        } else if (row.result === 'BLOCKED') {
          blockedActions += count;
        }
        
        // Features
        if (!features[row.feature]) {
          features[row.feature] = { total: 0, allowed: 0, blocked: 0 };
        }
        features[row.feature].total += count;
        features[row.feature][row.result.toLowerCase()] += count;
        
        // Locations
        if (!locations[row.country]) {
          locations[row.country] = { total: 0, allowed: 0, blocked: 0 };
        }
        locations[row.country].total += count;
        locations[row.country][row.result.toLowerCase()] += count;
        
        // Timeline
        const date = row.date.toISOString().split('T')[0];
        if (!timeline[date]) {
          timeline[date] = { total: 0, allowed: 0, blocked: 0 };
        }
        timeline[date].total += count;
        timeline[date][row.result.toLowerCase()] += count;
      });
      
      return {
        totalActions,
        allowedActions,
        blockedActions,
        features,
        locations,
        timeline
      };
      
    } catch (error) {
      logger.error('Error getting user activity:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static async archiveOldLogs(cutoffDate) {
    const client = new Pool();
    
    try {
      // Move old logs to archive table
      const archiveQuery = `
        INSERT INTO audit_logs_archive 
        SELECT * FROM audit_logs 
        WHERE timestamp < $1
      `;
      
      const deleteQuery = `
        DELETE FROM audit_logs 
        WHERE timestamp < $1
      `;
      
      await client.query('BEGIN');
      await client.query(archiveQuery, [cutoffDate]);
      const deleteResult = await client.query(deleteQuery, [cutoffDate]);
      await client.query('COMMIT');
      
      return deleteResult.rowCount;
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error archiving old logs:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
}

module.exports = { AuditLog };
