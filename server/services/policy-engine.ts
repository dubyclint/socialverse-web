// server/services/policy-engine.ts
// ============================================================================
// POLICY ENGINE - TYPESCRIPT CONVERSION
// ============================================================================

import { supabase } from '~/server/utils/database'
import { abTestService } from './ab-test-service'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface PolicyEvaluationContext {
  userId: string
  feature: string
  context?: Record<string, any>
}

export interface PolicyEvaluationResult {
  allowed: boolean
  reason: string
  message: string
  code: string
  appliedPolicies: string[]
}

export interface Policy {
  id: string
  name: string
  feature: string
  conditions: PolicyCondition[]
  action: 'allow' | 'deny'
  priority: number
}

export interface PolicyCondition {
  type: string
  operator: string
  value: any
}

export class PolicyEngine {
  private cache: Map<string, any> = new Map()
  private cacheTimeout: number = 5 * 60 * 1000 // 5 minutes

  /**
   * Main policy evaluation method
   */
  async evaluate(params: PolicyEvaluationContext): Promise<PolicyEvaluationResult> {
    try {
      const { userId, feature, context = {} } = params

      // Get applicable policies
      const policies = await this.getApplicablePolicies(feature, context)

      // Check A/B test variants
      const abTestPolicies = await abTestService.getTestPolicies(userId, feature, context)
      const allPolicies = [...policies, ...abTestPolicies]

      if (allPolicies.length === 0) {
        return {
          allowed: true,
          reason: 'NO_POLICIES_FOUND',
          message: 'No applicable policies, access granted',
          code: 'POL_000',
          appliedPolicies: []
        }
      }

      // Evaluate each policy
      const appliedPolicies: string[] = []
      let finalDecision = true

      for (const policy of allPolicies) {
        const result = await this.evaluatePolicy(userId, policy, context)

        if (!result) {
          finalDecision = false
          appliedPolicies.push(policy.id)
          break
        }

        appliedPolicies.push(policy.id)
      }

      return {
        allowed: finalDecision,
        reason: finalDecision ? 'POLICIES_PASSED' : 'POLICY_DENIED',
        message: finalDecision ? 'Access granted' : 'Access denied by policy',
        code: finalDecision ? 'POL_001' : 'POL_002',
        appliedPolicies
      }
    } catch (error: any) {
      console.error('Error evaluating policies:', error)
      return {
        allowed: false,
        reason: 'EVALUATION_ERROR',
        message: 'Error evaluating policies',
        code: 'POL_999',
        appliedPolicies: []
      }
    }
  }

  /**
   * Get applicable policies for a feature
   */
  private async getApplicablePolicies(feature: string, context: Record<string, any>): Promise<Policy[]> {
    try {
      const cacheKey = `policies:${feature}:${JSON.stringify(context)}`

      // Check cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data
        }
      }

      // Query policies
      let query = supabase
        .from('policies')
        .select('*')
        .eq('feature', feature)
        .order('priority', { ascending: true })

      const { data: policies, error } = await query

      if (error) throw error

      // Cache results
      this.cache.set(cacheKey, {
        data: policies || [],
        timestamp: Date.now()
      })

      return policies || []
    } catch (error: any) {
      console.error('Error getting applicable policies:', error)
      return []
    }
  }

  /**
   * Evaluate a single policy
   */
  private async evaluatePolicy(
    userId: string,
    policy: Policy,
    context: Record<string, any>
  ): Promise<boolean> {
    try {
      // Evaluate all conditions
      let conditionsMet = true

      for (const condition of policy.conditions) {
        const result = await this.evaluateCondition(userId, condition, context)
        if (!result) {
          conditionsMet = false
          break
        }
      }

      // Apply policy action
      if (policy.action === 'allow') {
        return conditionsMet
      } else {
        return !conditionsMet
      }
    } catch (error: any) {
      console.error('Error evaluating policy:', error)
      return false
    }
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    userId: string,
    condition: PolicyCondition,
    context: Record<string, any>
  ): Promise<boolean> {
    try {
      const { type, operator, value } = condition

      switch (type) {
        case 'user_tier':
          return this.evaluateUserTier(userId, operator, value)

        case 'country':
          return this.evaluateCountry(context.country, operator, value)

        case 'time_of_day':
          return this.evaluateTimeOfDay(operator, value)

        case 'rate_limit':
          return this.evaluateRateLimit(userId, operator, value)

        default:
          return true
      }
    } catch (error: any) {
      console.error('Error evaluating condition:', error)
      return false
    }
  }

  /**
   * Evaluate user tier condition
   */
  private async evaluateUserTier(userId: string, operator: string, value: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('tier')
        .eq('id', userId)
        .single()

      if (error || !user) return false

      return this.compareValues(user.tier, operator, value)
    } catch (error: any) {
      console.error('Error evaluating user tier:', error)
      return false
    }
  }

  /**
   * Evaluate country condition
   */
  private evaluateCountry(userCountry: string, operator: string, value: string): boolean {
    return this.compareValues(userCountry, operator, value)
  }

  /**
   * Evaluate time of day condition
   */
  private evaluateTimeOfDay(operator: string, value: string): boolean {
    const now = new Date()
    const currentHour = now.getHours()
    const [startHour, endHour] = value.split('-').map(Number)

    if (operator === 'between') {
      return currentHour >= startHour && currentHour < endHour
    }

    return true
  }

  /**
   * Evaluate rate limit condition
   */
  private async evaluateRateLimit(userId: string, operator: string, value: number): Promise<boolean> {
    try {
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 60000).toISOString())

      if (error) return false

      const count = logs?.length || 0
      return this.compareValues(count, operator, value)
    } catch (error: any) {
      console.error('Error evaluating rate limit:', error)
      return false
    }
  }

  /**
   * Compare values based on operator
   */
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected
      case 'not_equals':
        return actual !== expected
      case 'greater_than':
        return actual > expected
      case 'less_than':
        return actual < expected
      case 'in':
        return Array.isArray(expected) && expected.includes(actual)
      case 'not_in':
        return !Array.isArray(expected) || !expected.includes(actual)
      default:
        return true
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export const policyEngine = new PolicyEngine()
