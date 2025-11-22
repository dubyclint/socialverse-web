// server/models/premium-subscription.js - Premium Subscription Management Model
import { supabase } from '../utils/supabase.js';

export class PremiumSubscription {
  
  /**
   * Create a new premium subscription
   */
  static async create(subscriptionData) {
    try {
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
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating premium subscription:', error);
      throw error;
    }
  }

  /**
   * Find subscription by user ID
   */
  static async findByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error finding subscription by user ID:', error);
      throw error;
    }
  }

  /**
   * Find subscription by ID
   */
  static async findById(subscriptionId) {
    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error finding subscription by ID:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  static async update(subscriptionId, updateData) {
    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Upgrade subscription
   */
  static async upgrade(userId, newTier, paymentMethod = null) {
    try {
      const subscription = await this.findByUserId(userId);
      
      if (!subscription) {
        // Create new subscription
        return await this.create({
          userId,
          subscriptionType: newTier,
          paymentMethod,
          monthlyFee: this.getTierPrice(newTier),
          expiresAt: this.calculateExpiryDate(newTier)
        });
      }

      // Update existing subscription
      const updateData = {
        subscription_type: newTier,
        monthly_fee: this.getTierPrice(newTier),
        expires_at: this.calculateExpiryDate(newTier),
        status: 'ACTIVE'
      };

      if (paymentMethod) {
        updateData.payment_method = paymentMethod;
      }

      return await this.update(subscription.id, updateData);
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Downgrade subscription
   */
  static async downgrade(userId, newTier) {
    try {
      const subscription = await this.findByUserId(userId);
      
      if (!subscription) {
        throw new Error('No subscription found for user');
      }

      const updateData = {
        subscription_type: newTier,
        monthly_fee: this.getTierPrice(newTier),
        expires_at: newTier === 'FREE' ? null : this.calculateExpiryDate(newTier)
      };

      return await this.update(subscription.id, updateData);
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancel(userId, reason = 'User requested cancellation') {
    try {
      const subscription = await this.findByUserId(userId);
      
      if (!subscription) {
        throw new Error('No subscription found for user');
      }

      const updateData = {
        status: 'CANCELLED',
        auto_renew: false,
        expires_at: new Date().toISOString() // Immediate cancellation
      };

      // Log cancellation reason
      await this.logSubscriptionEvent(subscription.id, 'CANCELLED', { reason });

      return await this.update(subscription.id, updateData);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Suspend subscription
   */
  static async suspend(userId, reason = 'Administrative suspension') {
    try {
      const subscription = await this.findByUserId(userId);
      
      if (!subscription) {
        throw new Error('No subscription found for user');
      }

      const updateData = {
        status: 'SUSPENDED'
      };

      // Log suspension reason
      await this.logSubscriptionEvent(subscription.id, 'SUSPENDED', { reason });

      return await this.update(subscription.id, updateData);
    } catch (error) {
      console.error('Error suspending subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivate subscription
   */
  static async reactivate(userId) {
    try {
      const subscription = await this.findByUserId(userId);
      
      if (!subscription) {
        throw new Error('No subscription found for user');
      }

      const updateData = {
        status: 'ACTIVE',
        expires_at: this.calculateExpiryDate(subscription.subscription_type)
      };

      // Log reactivation
      await this.logSubscriptionEvent(subscription.id, 'REACTIVATED', {});

      return await this.update(subscription.id, updateData);
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Check if subscription is active
   */
  static async isActive(userId) {
    try {
      const subscription = await this.findByUserId(userId);
      
      if (!subscription) return false;
      if (subscription.status !== 'ACTIVE') return false;
      
      // Check expiry
      if (subscription.expires_at) {
        const expiryDate = new Date(subscription.expires_at);
        if (new Date() > expiryDate) {
          // Auto-expire subscription
          await this.update(subscription.id, { status: 'EXPIRED' });
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Get user's current tier
   */
  static async getUserTier(userId) {
    try {
      const subscription = await this.findByUserId(userId);
      
      if (!subscription) return 'FREE';
      
      const isActive = await this.isActive(userId);
      return isActive ? subscription.subscription_type : 'FREE';
    } catch (error) {
      console.error('Error getting user tier:', error);
      return 'FREE';
    }
  }

  /**
   * Get all subscriptions with filters
   */
  static async findAll(filters = {}) {
    try {
      let query = supabase
        .from('premium_subscriptions')
        .select(`
          *,
          user_profile:user_id(username, email, avatar_url)
        `);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.subscriptionType) {
        query = query.eq('subscription_type', filters.subscriptionType);
      }

      if (filters.expiringBefore) {
        query = query.lt('expires_at', filters.expiringBefore);
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error finding subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get subscription statistics
   */
  static async getStatistics() {
    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('subscription_type, status');

      if (error) throw error;

      const stats = {
        total: data.length,
        byTier: {},
        byStatus: {},
        revenue: {
          monthly: 0,
          projected: 0
        }
      };

      data.forEach(sub => {
        // Count by tier
        stats.byTier[sub.subscription_type] = (stats.byTier[sub.subscription_type] || 0) + 1;
        
        // Count by status
        stats.byStatus[sub.status] = (stats.byStatus[sub.status] || 0) + 1;
        
        // Calculate revenue (only active subscriptions)
        if (sub.status === 'ACTIVE') {
          const tierPrice = this.getTierPrice(sub.subscription_type);
          stats.revenue.monthly += tierPrice;
        }
      });

      stats.revenue.projected = stats.revenue.monthly * 12;

      return stats;
    } catch (error) {
      console.error('Error getting subscription statistics:', error);
      throw error;
    }
  }

  /**
   * Process subscription renewals
   */
  static async processRenewals() {
    try {
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 3); // 3 days before expiry

      const expiringSubscriptions = await this.findAll({
        status: 'ACTIVE',
        expiringBefore: expiringDate.toISOString()
      });

      const results = {
        processed: 0,
        renewed: 0,
        failed: 0,
        cancelled: 0
      };

      for (const subscription of expiringSubscriptions) {
        results.processed++;

        try {
          if (subscription.auto_renew) {
            // Attempt renewal
            const newExpiryDate = this.calculateExpiryDate(subscription.subscription_type);
            
            await this.update(subscription.id, {
              expires_at: newExpiryDate,
              status: 'ACTIVE'
            });

            await this.logSubscriptionEvent(subscription.id, 'RENEWED', {
              previous_expiry: subscription.expires_at,
              new_expiry: newExpiryDate
            });

            results.renewed++;
          } else {
            // Cancel subscription
            await this.update(subscription.id, {
              status: 'EXPIRED'
            });

            await this.logSubscriptionEvent(subscription.id, 'EXPIRED', {
              reason: 'Auto-renew disabled'
            });

            results.cancelled++;
          }
        } catch (error) {
          console.error(`Error processing renewal for subscription ${subscription.id}:`, error);
          results.failed++;
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing renewals:', error);
      throw error;
    }
  }

  /**
   * Helper: Get tier pricing
   */
  static getTierPrice(tier) {
    const prices = {
      'FREE': 0.00,
      'BASIC': 9.99,
      'PREMIUM': 19.99,
      'VIP': 49.99
    };
    return prices[tier] || 0.00;
  }

  /**
   * Helper: Calculate expiry date
   */
  static calculateExpiryDate(tier) {
    if (tier === 'FREE') return null;
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    return expiryDate.toISOString();
  }

  /**
   * Helper: Log subscription events
   */
  static async logSubscriptionEvent(subscriptionId, eventType, eventData) {
    try {
      await supabase
        .from('subscription_events')
        .insert({
          subscription_id: subscriptionId,
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging subscription event:', error);
    }
  }
}
