const { Pool } = require('pg');
const logger = require('../config/logger');

class ABTest {
  
  static async create(testData) {
    const client = new Pool();
    
    try {
      const query = `
        INSERT INTO ab_tests (
          name, description, feature, start_date, end_date,
          target_criteria, variants, status, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `;
      
      const values = [
        testData.name,
        testData.description,
        testData.feature,
        testData.startDate,
        testData.endDate,
        JSON.stringify(testData.targetCriteria || {}),
        JSON.stringify(testData.variants),
        testData.status || 'ACTIVE',
        testData.createdBy
      ];
      
      const result = await client.query(query, values);
      const test = result.rows[0];
      test.target_criteria = JSON.parse(test.target_criteria);
      test.variants = JSON.parse(test.variants);
      
      return test;
      
    } catch (error) {
      logger.error('Error creating A/B test:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static async findById(id) {
    const client = new Pool();
    
    try {
      const query = 'SELECT * FROM ab_tests WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const test = result.rows[0];
      test.target_criteria = JSON.parse(test.target_criteria);
      test.variants = JSON.parse(test.variants);
      
      return test;
      
    } catch (error) {
      logger.error('Error finding A/B test by ID:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static async findActive(feature, context) {
    const client = new Pool();
    
    try {
      const query = `
        SELECT * FROM ab_tests 
        WHERE status = 'ACTIVE' 
        AND feature = $1
        AND start_date <= NOW()
        AND end_date >= NOW()
        ORDER BY created_at ASC
      `;
      
      const result = await client.query(query, [feature]);
      const tests = result.rows.map(test => {
        test.target_criteria = JSON.parse(test.target_criteria);
        test.variants = JSON.parse(test.variants);
        return test;
      });
      
      // Filter tests based on target criteria
      return tests.filter(test => 
        this.matchesTargetCriteria(test.target_criteria, context)
      );
      
    } catch (error) {
      logger.error('Error finding active A/B tests:', error);
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
        if (key === 'target_criteria' || key === 'variants') {
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
        UPDATE ab_tests 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('A/B test not found');
      }
      
      const test = result.rows[0];
      test.target_criteria = JSON.parse(test.target_criteria);
      test.variants = JSON.parse(test.variants);
      
      return test;
      
    } catch (error) {
      logger.error('Error updating A/B test:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static async findAll(filters = {}) {
    const client = new Pool();
    
    try {
      let query = 'SELECT * FROM ab_tests WHERE 1=1';
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
      
      if (filters.createdBy) {
        query += ` AND created_by = $${paramIndex}`;
        values.push(filters.createdBy);
        paramIndex++;
      }
      
      query += ' ORDER BY created_at DESC';
      
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
      
      return result.rows.map(test => {
        test.target_criteria = JSON.parse(test.target_criteria);
        test.variants = JSON.parse(test.variants);
        return test;
      });
      
    } catch (error) {
      logger.error('Error finding A/B tests:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  static matchesTargetCriteria(criteria, context) {
    if (!criteria || Object.keys(criteria).length === 0) {
      return true;
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
    
    // Check user percentage
    if (criteria.userPercentage && criteria.userPercentage < 100) {
      // This would be implemented with consistent hashing in practice
      return Math.random() * 100 < criteria.userPercentage;
    }
    
    return true;
  }
}

module.exports = { ABTest };
