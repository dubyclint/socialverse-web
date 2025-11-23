// server/models/premium.ts - Consolidated Premium Model
// ============================================================================
// Consolidates: premium-subscription.js, premium-feature.js, 
// premium-access-rule.ts, user-premium-restriction.js

import { supabase } from '../utils/supabase.js'

export interface PremiumAccessRule {
  id: string
  target: 'country' | 'region' | 'geo' | 'all'
  value: string
  features: {
    p2p?: boolean
    matching?: boolean
    rankHide?: boolean
  }
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface PremiumSubscription {
  id: string
  userId: string
  subscriptionType: string
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELLED'
  startedAt: string
  expiresAt?: string
  autoRenew: boolean
  paymentMethod?: string
  monthlyFee: number
  features: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface PremiumFeature {
  id: string
  featureName: string
  featureKey: string
  description?: string
  requiredTier: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserPremiumRestriction {
  id: string
  userId: string
  restrictionType: string
  restrictionValue: Record<string, any>
  appliedBy?: string
  reason?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export class PremiumModel {
  // SUBSCRIPTION METHODS
  static async createSubscription(subscriptionData: Omit<PremiumSubscription, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .insert({
        user_id: subscriptionData.userId,
        subscription_type: subscriptionData.subscriptionType || 'FREE',
        status: subscriptionData.status || 'ACTIVE',
        started_at: subscriptionData.startedAt || new Date().toISOString(),
        expires_at: subscriptionData.expiresAt,
        auto_renew: subscriptionData.autoRenew !== false,
        payment_method: subscriptionData.paymentMethod,
        monthly_fee: subscriptionData.monthlyFee || 0.00,
        features: subscriptionData.features || {}
      })
      .select()
      .single()
    if (error) throw error
    return data as PremiumSubscription
  }

  static async getSubscriptionByUserId(userId: string) {
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data as PremiumSubscription | null
  }

  static async updateSubscription(subscriptionId: string, updates: Partial<PremiumSubscription>) {
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select()
      .single()
    if (error) throw error
    return data as PremiumSubscription
  }

  static async cancelSubscription(subscriptionId: string) {
    return this.updateSubscription(subscriptionId, { status: 'CANCELLED' })
  }

  // FEATURE METHODS
  static async createFeature(featureData: Omit<PremiumFeature, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('premium_features')
      .insert({
        feature_name: featureData.featureName,
        feature_key: featureData.featureKey,
        description: featureData.description,
        required_tier: featureData.requiredTier,
        is_active: featureData.isActive !== false
      })
      .select()
      .single()
    if (error) throw error
    return data as PremiumFeature
  }

  static async getAllFeatures(filters: { requiredTier?: string; isActive?: boolean } = {}) {
    let query = supabase.from('premium_features').select('*')
    if (filters.requiredTier) query = query.eq('required_tier', filters.requiredTier)
    if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive)
    const { data, error } = await query
    if (error) throw error
    return data as PremiumFeature[]
  }

  // ACCESS RULE METHODS
  static async createAccessRule(ruleData: Omit<PremiumAccessRule, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('premium_access_rules')
      .insert([{
        target: ruleData.target,
        value: ruleData.value,
        features: ruleData.features,
        active: ruleData.active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    if (error) throw error
    return data as PremiumAccessRule
  }

  static async getAccessRuleByTarget(target: string, value?: string) {
    let query = supabase.from('premium_access_rules').select('*').eq('target', target).eq('active', true)
    if (value) query = query.eq('value', value)
    const { data, error } = await query
    if (error) throw error
    return data as PremiumAccessRule[]
  }

  // RESTRICTION METHODS
  static async createRestriction(restrictionData: Omit<UserPremiumRestriction, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('user_premium_restrictions')
      .insert({
        user_id: restrictionData.userId,
        restriction_type: restrictionData.restrictionType,
        restriction_value: restrictionData.restrictionValue || {},
        applied_by: restrictionData.appliedBy,
        reason: restrictionData.reason,
        expires_at: restrictionData.expiresAt,
        is_active: restrictionData.isActive !== false
      })
      .select()
      .single()
    if (error) throw error
    return data as UserPremiumRestriction
  }

  static async getUserRestrictions(userId: string, activeOnly = true) {
    let query = supabase.from('user_premium_restrictions').select('*').eq('user_id', userId)
    if (activeOnly) query = query.eq('is_active', true)
    const { data, error } = await query
    if (error) throw error
    return data as UserPremiumRestriction[]
  }
}
