const redis = require('../config/redis');
const logger = require('../config/logger');
const { Policy } = require('../models/Policy');
const ABTestService = require('./ABTestService');

class PolicyEngine {
  
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  /**
   * Main policy evaluation method
   */
  async evaluate({ userId, feature, context }) {
    try {
      // Get applicable policies
      const policies = await this.getApplicablePolicies(feature, context);
      
      // Check A/B test variants
      const abTestPolicies = await ABTestService.getTestPolicies(userId, feature, context);
      const allPolicies = [...policies, ...abTestPolicies];
      
      if (allPolicies.length === 0) {
        return {
          allowed: true,
          reason: 'NO_POLICIES_FOUND',
          message: 'No applicable policies, access granted',
          code: 'POL_000',
          appliedPolicies: []
        };
      }
      
      // Evaluate each policy
      const results = [];
      for (const policy of allPolicies) {
        const result = await this.evaluatePolicy(policy, { userId, feature, context });
        results.push({ policy: policy.id, result });
        
        // If any policy blocks access, return immediately
        if (!result.allowed && policy.priority === 'HIGH') {
          return {
            allowed: false,
            reason: result.reason,
            message: result.message,
            code: result.code,
            restrictions: result.restrictions,
            appliedPolicies: [policy.id]
          };
        }
      }
      
      // Determine final result based on policy priorities
      const finalResult = this.aggregateResults(results, allPolicies);
      
      return {
        ...finalResult,
        appliedPolicies: allPolicies.map(p => p.id)
      };
      
    } catch (error) {
      logger.error('Policy evaluation error:', error);
      throw error;
    }
  }
  
  /**
   * Evaluate a single policy
   */
  async evaluatePolicy(policy, { userId, feature, context }) {
    try {
      const rules = policy.rules;
      
      // Geographic restrictions
      if (rules.geoRestrictions) {
        const geoResult = this.evaluateGeoRestrictions(rules.geoRestrictions, context);
        if (!geoResult.allowed) {
          return {
            allowed: false,
            reason: 'GEO_RESTRICTED',
            message: `Feature not available in ${context.country}`,
            code: 'GEO_001',
            restrictions: { geographic: true }
          };
        }
      }
      
      // Role-based restrictions (RBAC)
      if (rules.roleRestrictions) {
        const roleResult = await this.evaluateRoleRestrictions(rules.roleRestrictions, userId);
        if (!roleResult.allowed) {
          return {
            allowed: false,
            reason: 'ROLE_RESTRICTED',
            message: 'Insufficient role permissions',
            code: 'RBAC_001',
            restrictions: { role: true }
          };
        }
      }
      
      // Attribute-based restrictions (ABAC)
      if (rules.attributeRestrictions) {
        const attrResult = await this.evaluateAttributeRestrictions(rules.attributeRestrictions, { userId, context });
        if (!attrResult.allowed) {
          return {
            allowed: false,
            reason: 'ATTRIBUTE_RESTRICTED',
            message: attrResult.message,
            code: 'ABAC_001',
            restrictions: attrResult.restrictions
          };
        }
      }
      
      // Time-based restrictions
      if (rules.timeRestrictions) {
        const timeResult = this.evaluateTimeRestrictions(rules.timeRestrictions, context);
        if (!timeResult.allowed) {
          return {
            allowed: false,
            reason: 'TIME_RESTRICTED',
            message: 'Feature not available at this time',
            code: 'TIME_001',
            restrictions: { temporal: true }
          };
        }
      }
      
      return {
        allowed: true,
        reason: 'POLICY_PASSED',
        message: 'All policy conditions met'
      };
      
    } catch (error) {
      logger.error('Policy evaluation error:', error);
      return {
        allowed: false,
        reason: 'EVALUATION_ERROR',
        message: 'Policy evaluation failed',
        code: 'POL_ERR_001'
      };
    }
  }
  
  /**
   * Evaluate geographic restrictions
   */
  evaluateGeoRestrictions(geoRules, context) {
    const { country, region } = context;
    
    // Check blocked countries
    if (geoRules.blockedCountries && geoRules.blockedCountries.includes(country)) {
      return { allowed: false };
    }
    
    // Check allowed countries (if specified)
    if (geoRules.allowedCountries && !geoRules.allowedCountries.includes(country)) {
      return { allowed: false };
    }
    
    // Check blocked regions
    if (geoRules.blockedRegions && geoRules.blockedRegions.includes(region)) {
      return { allowed: false };
    }
    
    return { allowed: true };
  }
  
  /**
   * Evaluate role-based restrictions
   */
  async evaluateRoleRestrictions(roleRules, userId) {
    try {
      // Get user roles from your main database or cache
      const userRoles = await this.getUserRoles(userId);
      
      // Check required roles
      if (roleRules.requiredRoles) {
        const hasRequiredRole = roleRules.requiredRoles.some(role => userRoles.includes(role));
        if (!hasRequiredRole) {
          return { allowed: false };
        }
      }
      
      // Check forbidden roles
      if (roleRules.forbiddenRoles) {
        const hasForbiddenRole = roleRules.forbiddenRoles.some(role => userRoles.includes(role));
        if (hasForbiddenRole) {
          return { allowed: false };
        }
      }
      
      return { allowed: true };
      
    } catch (error) {
      logger.error('Role evaluation error:', error);
      return { allowed: false };
    }
  }
  
  /**
   * Evaluate attribute-based restrictions
   */
  async evaluateAttributeRestrictions(attrRules, { userId, context }) {
    try {
      // Get user attributes
      const userAttributes = await this.getUserAttributes(userId);
      
      // Age restrictions
      if (attrRules.minAge && userAttributes.age < attrRules.minAge) {
        return {
          allowed: false,
          message: `Minimum age requirement: ${attrRules.minAge}`,
          restrictions: { age: true }
        };
      }
      
      // KYC requirements
      if (attrRules.requireKYC && !userAttributes.kycVerified) {
        return {
          allowed: false,
          message: 'KYC verification required',
          restrictions: { kyc: true }
        };
      }
      
      // Account verification
      if (attrRules.requireVerification && !userAttributes.verified) {
        return {
          allowed: false,
          message: 'Account verification required',
          restrictions: { verification: true }
        };
      }
      
      // Device restrictions
      if (attrRules.deviceRestrictions) {
        const deviceResult = this.evaluateDeviceRestrictions(attrRules.deviceRestrictions, context);
        if (!deviceResult.allowed) {
          return deviceResult;
        }
      }
      
      return { allowed: true };
      
    } catch (error) {
      logger.error('Attribute evaluation error:', error);
      return { allowed: false };
    }
  }
  
  /**
   * Get applicable policies for a feature and context
   */
  async getApplicablePolicies(feature, context) {
    try {
      const cacheKey = `policies:${feature}:${context.country}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.policies;
        }
      }
      
      // Query database for applicable policies
      const policies = await Policy.findApplicable(feature, context);
      
      // Cache the result
      this.cache.set(cacheKey, {
        policies,
        timestamp: Date.now()
      });
      
      return policies;
      
    } catch (error) {
      logger.error('Error getting applicable policies:', error);
      return [];
    }
  }
  
  /**
   * Get user roles (integrate with your main app's user system)
   */
  async getUserRoles(userId) {
    try {
      // This should integrate with your main app's user system
      // For now, return default roles
      return ['user']; // You'll replace this with actual role fetching
    } catch (error) {
      logger.error('Error getting user roles:', error);
      return [];
    }
  }
  
  /**
   * Get user attributes (integrate with your main app's user system)
   */
  async getUserAttributes(userId) {
    try {
      // This should integrate with your main app's user system
      // For now, return default attributes
      return {
        age: 18,
        kycVerified: false,
        verified: false,
        accountType: 'standard'
      }; // You'll replace this with actual attribute fetching
    } catch (error) {
      logger.error('Error getting user attributes:', error);
      return {};
    }
  }
  
  /**
   * Aggregate policy results based on priorities
   */
  aggregateResults(results, policies) {
    // If any HIGH priority policy blocks, block access
    const highPriorityBlocks = results.filter(r => 
      !r.result.allowed && 
      policies.find(p => p.id === r.policy)?.priority === 'HIGH'
    );
    
    if (highPriorityBlocks.length > 0) {
      const block = highPriorityBlocks[0];
      return {
        allowed: false,
        reason: block.result.reason,
        message: block.result.message,
        code: block.result.code,
        restrictions: block.result.restrictions
      };
    }
    
    // Check MEDIUM priority policies
    const mediumPriorityBlocks = results.filter(r => 
      !r.result.allowed && 
      policies.find(p => p.id === r.policy)?.priority === 'MEDIUM'
    );
    
    if (mediumPriorityBlocks.length > 0) {
      const block = mediumPriorityBlocks[0];
      return {
        allowed: false,
        reason: block.result.reason,
        message: block.result.message,
        code: block.result.code,
        restrictions: block.result.restrictions
      };
    }
    
    // If no blocks, allow access
    return {
      allowed: true,
      reason: 'ALL_POLICIES_PASSED',
      message: 'Access granted'
    };
  }
}

module.exports = new PolicyEngine();
