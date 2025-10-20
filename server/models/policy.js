const { Pool } = require('pg');
const logger = require('../config/logger');

class Policy {
  
  static async create(policyData) {
    const client = new Pool();
    
    try {
      const query = `
        INSERT INTO policies (
          name, description, feature, priority, status, rules, 
          target_criteria, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;
      
      const values = [
        policyData.name,
        policyData.description,
        policyData.feature,
        policyData.priority || 'MEDIUM',
        policyData.status || 'ACTIVE',
        JSON.stringify(policyData.rules),
        JSON.stringify(policyData.targetCriteria || {}),
        policyData.createdBy
      ];
      
      const result = await client.query(query, values);
      return result.rows[0];
      
    } catch (error) {
      logger.error('Error creating policy:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static async findById(id) {
    const client = new Pool();
    
    try {
      const query = 'SELECT * FROM policies WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const policy = result.rows[0];
      policy.rules = JSON.parse(policy.rules);
      policy.target_criteria = JSON.parse(policy.target_criteria);
      
      return policy;
      
    } catch (error) {
      logger.error('Error finding policy by ID:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static async findApplicable(feature, context) {
    const client = new Pool();
    
    try {
      const query = `
        SELECT * FROM policies 
        WHERE status = 'ACTIVE' 
        AND (feature = $1 OR feature = 'ALL')
        ORDER BY priority DESC, created_at ASC
      `;
      
      const result = await client.query(query, [feature]);
      const policies = result.rows.map(policy => {
        policy.rules = JSON.parse(policy.rules);
        policy.target_criteria = JSON.parse(policy.target_criteria);
        return policy;
      });
      
      // Filter policies based on target criteria
      return policies.filter(policy => 
        this.matchesTargetCriteria(policy.target_criteria, context)
      );
      
    } catch (error) {
      logger.error('Error finding applicable policies:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static async update(id, updates) {
    const client = new Pool();
    
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'rules' || key === 'target_criteria') {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
      
      setClause.push(`updated_at = NOW()`);
      values.push(id);
      
      const query = `
        UPDATE policies 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Policy not found');
      }
      
      const policy = result.rows[0];
      policy.rules = JSON.parse(policy.rules);
      policy.target_criteria = JSON.parse(policy.target_criteria);
      
      return policy;
      
    } catch (error) {
      logger.error('Error updating policy:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static async delete(id) {
    const client = new Pool();
    
    try {
      const query = 'DELETE FROM policies WHERE id = $1 RETURNING *';
      const result = await client.query(query, [id]);
      
      return result.rows.length > 0;
      
    } catch (error) {
      logger.error('Error deleting policy:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static async findAll(filters = {}) {
    const client = new Pool();
    
    try {
      let query = 'SELECT * FROM policies WHERE 1=1';
      const values = [];
      let paramIndex = 1;
      
      if (filters.feature) {
        query += ` AND feature = $${paramIndex}`;
        values.push(filters.feature);
        paramIndex++;
      }
      
      if (filters.status) {
        query += ` AND status = $${paramIndex}`;
        values.push(filters.status);
        paramIndex++;
      }
      
      if (filters.priority) {
        query += ` AND priority = $${paramIndex}`;
        values.push(filters.priority);
        paramIndex++;
      }
      
      query += ' ORDER BY priority DESC, created_at DESC';
      
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
      
      return result.rows.map(policy => {
        policy.rules = JSON.parse(policy.rules);
        policy.target_criteria = JSON.parse(policy.target_criteria);
        return policy;
      });
      
    } catch (error) {
      logger.error('Error finding policies:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static matchesTargetCriteria(criteria, context) {
    if (!criteria || Object.keys(criteria).length === 0) {
      return true; // No criteria means applies to all
    }
    
    // Check country criteria
    if (criteria.countries) {
      if (criteria.countries.include && !criteria.countries.include.includes(context.country)) {
        return false;
      }
      if (criteria.countries.exclude && criteria.countries.exclude.includes(context.country)) {
        return false;
      }
    }
    
    // Check region criteria
    if (criteria.regions) {
      if (criteria.regions.include && !criteria.regions.include.includes(context.region)) {
        return false;
      }
      if (criteria.regions.exclude && criteria.regions.exclude.includes(context.region)) {
        return false;
      }
    }
    
    // Check time criteria
    if (criteria.timeRange) {
      const now = new Date();
      const currentHour = now.getHours();
      
      if (criteria.timeRange.start && criteria.timeRange.end) {
        if (currentHour < criteria.timeRange.start || currentHour > criteria.timeRange.end) {
          return false;
        }
      }
    }
    
    return true;
  }
}

module.exports = { Policy };
