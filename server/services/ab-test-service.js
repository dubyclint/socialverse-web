const redis = require('../config/redis');
const logger = require('../config/logger');
const { ABTest } = require('../models/ABTest');

class ABTestService {
  
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }
  
  /**
   * Get test policies for a user and feature
   */
  async getTestPolicies(userId, feature, context) {
    try {
      const activeTests = await this.getActiveTests(feature, context);
      const testPolicies = [];
      
      for (const test of activeTests) {
        const variant = await this.getUserVariant(userId, test);
        if (variant && variant.policies) {
          testPolicies.push(...variant.policies);
        }
      }
      
      return testPolicies;
      
    } catch (error) {
      logger.error('Error getting test policies:', error);
      return [];
    }
  }
  
  /**
   * Get active A/B tests for a feature and context
   */
  async getActiveTests(feature, context) {
    try {
      const cacheKey = `ab_tests:${feature}:${context.country}`;
      
      // Check cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.tests;
        }
      }
      
      // Query active tests
      const tests = await ABTest.findActive(feature, context);
      
      // Cache results
      this.cache.set(cacheKey, {
        tests,
        timestamp: Date.now()
      });
      
      return tests;
      
    } catch (error) {
      logger.error('Error getting active tests:', error);
      return [];
    }
  }
  
  /**
   * Get user's variant for a specific test
   */
  async getUserVariant(userId, test) {
    try {
      const cacheKey = `user_variant:${userId}:${test.id}`;
      
      // Check if user already assigned to variant
      let variant = await this.getCachedVariant(cacheKey);
      
      if (!variant) {
        // Assign user to variant based on hash
        variant = this.assignUserToVariant(userId, test);
        
        // Cache the assignment
        await this.cacheVariant(cacheKey, variant, test.endDate);
        
        // Log the assignment
        await this.logVariantAssignment(userId, test.id, variant.name);
      }
      
      return variant;
      
    } catch (error) {
      logger.error('Error getting user variant:', error);
      return null;
    }
  }
  
  /**
   * Assign user to test variant using consistent hashing
   */
  assignUserToVariant(userId, test) {
    const hash = this.hashUserId(userId, test.id);
    const percentage = hash % 100;
    
    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (percentage < cumulativeWeight) {
        return variant;
      }
    }
    
    // Fallback to control group
    return test.variants.find(v => v.name === 'control') || test.variants[0];
  }
  
  /**
   * Hash user ID for consistent variant assignment
   */
  hashUserId(userId, testId) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(`${userId}:${testId}`).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }
  
  /**
   * Create new A/B test
   */
  async createTest(testConfig) {
    try {
      const test = await ABTest.create({
        name: testConfig.name,
        description: testConfig.description,
        feature: testConfig.feature,
        startDate: new Date(testConfig.startDate),
        endDate: new Date(testConfig.endDate),
        targetCriteria: testConfig.targetCriteria,
        variants: testConfig.variants,
        status: 'ACTIVE',
        createdBy: testConfig.createdBy
      });
      
      // Clear cache for this feature
      this.clearFeatureCache(testConfig.feature);
      
      logger.info(`A/B test created: ${test.name}`);
      return test;
      
    } catch (error) {
      logger.error('Error creating A/B test:', error);
      throw error;
    }
  }
  
  /**
   * Update A/B test
   */
  async updateTest(testId, updates) {
    try {
      const test = await ABTest.update(testId, updates);
      
      // Clear cache
      this.clearFeatureCache(test.feature);
      
      logger.info(`A/B test updated: ${testId}`);
      return test;
      
    } catch (error) {
      logger.error('Error updating A/B test:', error);
      throw error;
    }
  }
  
  /**
   * Stop A/B test
   */
  async stopTest(testId, reason = 'MANUAL_STOP') {
    try {
      const test = await ABTest.update(testId, {
        status: 'STOPPED',
        endDate: new Date(),
        stopReason: reason
      });
      
      // Clear cache
      this.clearFeatureCache(test.feature);
      
      logger.info(`A/B test stopped: ${testId}, reason: ${reason}`);
      return test;
      
    } catch (error) {
      logger.error('Error stopping A/B test:', error);
      throw error;
    }
  }
  
  /**
   * Get test results and analytics
   */
  async getTestResults(testId) {
    try {
      const test = await ABTest.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }
      
      // Get variant assignments
      const assignments = await this.getVariantAssignments(testId);
      
      // Get conversion metrics
      const metrics = await this.getConversionMetrics(testId);
      
      // Calculate statistical significance
      const significance = this.calculateSignificance(metrics);
      
      return*_
      return {
        test,
        assignments: {
          total: assignments.total,
          byVariant: assignments.byVariant
        },
        metrics: {
          conversions: metrics.conversions,
          conversionRates: metrics.conversionRates,
          confidence: significance.confidence,
          pValue: significance.pValue,
          winner: significance.winner
        },
        recommendations: this.generateRecommendations(test, metrics, significance)
      };
      
    } catch (error) {
      logger.error('Error getting test results:', error);
      throw error;
    }
  }
  
  /**
   * Get variant assignments for a test
   */
  async getVariantAssignments(testId) {
    try {
      // This would query your analytics/logging system
      // For now, return mock data
      return {
        total: 1000,
        byVariant: {
          control: 500,
          variant_a: 300,
          variant_b: 200
        }
      };
    } catch (error) {
      logger.error('Error getting variant assignments:', error);
      return { total: 0, byVariant: {} };
    }
  }
  
  /**
   * Get conversion metrics for test variants
   */
  async getConversionMetrics(testId) {
    try {
      // This would query your analytics system
      // For now, return mock data
      return {
        conversions: {
          control: 50,
          variant_a: 45,
          variant_b: 38
        },
        conversionRates: {
          control: 0.10,
          variant_a: 0.15,
          variant_b: 0.19
        }
      };
    } catch (error) {
      logger.error('Error getting conversion metrics:', error);
      return { conversions: {}, conversionRates: {} };
    }
  }
  
  /**
   * Calculate statistical significance
   */
  calculateSignificance(metrics) {
    try {
      const { conversionRates } = metrics;
      const variants = Object.keys(conversionRates);
      
      if (variants.length < 2) {
        return { confidence: 0, pValue: 1, winner: null };
      }
      
      // Simple chi-square test implementation
      // In production, you'd use a proper statistical library
      const control = conversionRates[variants[0]];
      let bestVariant = variants[0];
      let bestRate = control;
      let maxConfidence = 0;
      
      for (let i = 1; i < variants.length; i++) {
        const variant = variants[i];
        const rate = conversionRates[variant];
        
        if (rate > bestRate) {
          bestVariant = variant;
          bestRate = rate;
        }
        
        // Calculate confidence (simplified)
        const improvement = (rate - control) / control;
        const confidence = Math.min(95, Math.abs(improvement) * 100);
        maxConfidence = Math.max(maxConfidence, confidence);
      }
      
      return {
        confidence: maxConfidence,
        pValue: (100 - maxConfidence) / 100,
        winner: bestVariant !== variants[0] ? bestVariant : null
      };
      
    } catch (error) {
      logger.error('Error calculating significance:', error);
      return { confidence: 0, pValue: 1, winner: null };
    }
  }
  
  /**
   * Generate recommendations based on test results
   */
  generateRecommendations(test, metrics, significance) {
    const recommendations = [];
    
    if (significance.confidence > 95) {
      recommendations.push({
        type: 'WINNER_FOUND',
        message: `Variant ${significance.winner} shows significant improvement`,
        action: 'IMPLEMENT_WINNER',
        confidence: significance.confidence
      });
    } else if (significance.confidence > 80) {
      recommendations.push({
        type: 'TRENDING_WINNER',
        message: `Variant ${significance.winner} is trending positive`,
        action: 'CONTINUE_TEST',
        confidence: significance.confidence
      });
    } else {
      recommendations.push({
        type: 'INCONCLUSIVE',
        message: 'No clear winner yet, continue testing',
        action: 'CONTINUE_TEST',
        confidence: significance.confidence
      });
    }
    
    return recommendations;
  }
  
  /**
   * Cache variant assignment
   */
  async cacheVariant(cacheKey, variant, endDate) {
    try {
      const redisClient = await redis.getClient();
      const ttl = Math.floor((new Date(endDate) - Date.now()) / 1000);
      
      await redisClient.setEx(cacheKey, ttl, JSON.stringify(variant));
    } catch (error) {
      logger.error('Error caching variant:', error);
    }
  }
  
  /**
   * Get cached variant assignment
   */
  async getCachedVariant(cacheKey) {
    try {
      const redisClient = await redis.getClient();
      const cached = await redisClient.get(cacheKey);
      
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Error getting cached variant:', error);
      return null;
    }
  }
  
  /**
   * Log variant assignment
   */
  async logVariantAssignment(userId, testId, variantName) {
    try {
      // Log to your analytics system
      logger.info(`User ${userId} assigned to variant ${variantName} for test ${testId}`);
    } catch (error) {
      logger.error('Error logging variant assignment:', error);
    }
  }
  
  /**
   * Clear feature cache
   */
  clearFeatureCache(feature) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`ab_tests:${feature}:`)) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new ABTestService();
