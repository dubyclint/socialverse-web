// server/services/ab-test-service.ts
// ============================================================================
// A/B TEST SERVICE - TYPESCRIPT CONVERSION
// ============================================================================

import { supabase } from '~/server/utils/database'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ABTest {
  id: string
  name: string
  feature: string
  status: 'active' | 'paused' | 'completed'
  variants: ABTestVariant[]
  startDate: string
  endDate?: string
  context?: Record<string, any>
}

export interface ABTestVariant {
  id: string
  name: string
  weight: number
  policies?: any[]
}

export interface TestContext {
  country?: string
  region?: string
  userTier?: string
  [key: string]: any
}

export class ABTestService {
  private cache: Map<string, any> = new Map()
  private cacheTimeout: number = 30 * 60 * 1000 // 30 minutes

  /**
   * Get test policies for a user and feature
   */
  async getTestPolicies(userId: string, feature: string, context: TestContext = {}): Promise<any[]> {
    try {
      const activeTests = await this.getActiveTests(feature, context)
      const testPolicies: any[] = []

      for (const test of activeTests) {
        const variant = await this.getUserVariant(userId, test)
        if (variant && variant.policies) {
          testPolicies.push(...variant.policies)
        }
      }

      return testPolicies
    } catch (error: any) {
      console.error('Error getting test policies:', error)
      return []
    }
  }

  /**
   * Get active A/B tests for a feature and context
   */
  async getActiveTests(feature: string, context: TestContext = {}): Promise<ABTest[]> {
    try {
      const cacheKey = `ab_tests:${feature}:${JSON.stringify(context)}`

      // Check cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data
        }
      }

      // Query active tests
      let query = supabase
        .from('ab_tests')
        .select('*')
        .eq('feature', feature)
        .eq('status', 'active')

      // Apply context filters
      if (context.country) {
        query = query.contains('context', { country: context.country })
      }

      const { data: tests, error } = await query

      if (error) throw error

      // Cache results
      this.cache.set(cacheKey, {
        data: tests || [],
        timestamp: Date.now()
      })

      return tests || []
    } catch (error: any) {
      console.error('Error getting active tests:', error)
      return []
    }
  }

  /**
   * Get user's variant for a test
   */
  async getUserVariant(userId: string, test: ABTest): Promise<ABTestVariant | null> {
    try {
      // Check if user already has a variant assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('ab_test_assignments')
        .select('variant_id')
        .eq('user_id', userId)
        .eq('test_id', test.id)
        .single()

      if (assignment) {
        return test.variants.find(v => v.id === assignment.variant_id) || null
      }

      // Assign variant based on weight
      const variant = this.selectVariantByWeight(test.variants)

      // Store assignment
      if (variant) {
        await supabase
          .from('ab_test_assignments')
          .insert({
            user_id: userId,
            test_id: test.id,
            variant_id: variant.id,
            assigned_at: new Date().toISOString()
          })
      }

      return variant
    } catch (error: any) {
      console.error('Error getting user variant:', error)
      return null
    }
  }

  /**
   * Select variant based on weight
   */
  private selectVariantByWeight(variants: ABTestVariant[]): ABTestVariant | null {
    const random = Math.random() * 100
    let cumulative = 0

    for (const variant of variants) {
      cumulative += variant.weight
      if (random <= cumulative) {
        return variant
      }
    }

    return variants[0] || null
  }

  /**
   * Create a new A/B test
   */
  async createTest(testData: Partial<ABTest>): Promise<ABTest | null> {
    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .insert({
          name: testData.name,
          feature: testData.feature,
          status: 'active',
          variants: testData.variants || [],
          start_date: new Date().toISOString(),
          context: testData.context || {}
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error creating test:', error)
      return null
    }
  }

  /**
   * Get test results
   */
  async getTestResults(testId: string): Promise<any> {
    try {
      const { data: assignments, error } = await supabase
        .from('ab_test_assignments')
        .select('variant_id, assigned_at')
        .eq('test_id', testId)

      if (error) throw error

      const results: Record<string, number> = {}
      ;(assignments || []).forEach(assignment => {
        results[assignment.variant_id] = (results[assignment.variant_id] || 0) + 1
      })

      return results
    } catch (error: any) {
      console.error('Error getting test results:', error)
      return {}
    }
  }

  /**
   * End A/B test
   */
  async endTest(testId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ab_tests')
        .update({
          status: 'completed',
          end_date: new Date().toISOString()
        })
        .eq('id', testId)

      if (error) throw error
      return true
    } catch (error: any) {
      console.error('Error ending test:', error)
      return false
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export const abTestService = new ABTestService()
