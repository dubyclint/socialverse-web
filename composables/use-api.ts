// composables/useApi.ts
// ✅ MASTER API CLIENT - Single source of truth for all API calls
// Replaces all hardcoded fetch calls with proper API endpoints

import type { FetchOptions } from 'ofetch';

export const useApi = () => {
  const { $fetch } = useNuxtApp();

  // ============ ADMIN OPERATIONS ============
  const admin = {
    async getStats() {
      return $fetch('/api/admin', {
        method: 'POST',
        body: { action: 'get_stats' }
      });
    },

    async banUser(userId: string, reason?: string) {
      return $fetch('/api/admin', {
        method: 'POST',
        body: { action: 'ban_user', user_id: userId, reason }
      });
    },

    async verifyUser(userId: string) {
      return $fetch('/api/admin', {
        method: 'POST',
        body: { action: 'verify_user', user_id: userId }
      });
    },

    async adjustBalance(userId: string, amount: number, actionType: 'add' | 'subtract' | 'set', reason?: string) {
      return $fetch('/api/admin', {
        method: 'POST',
        body: { 
          action: 'adjust_balance', 
          user_id: userId, 
          amount,
          action_type: actionType,
          reason 
        }
      });
    },

    async assignManager(userId: string) {
      return $fetch('/api/admin', {
        method: 'POST',
        body: { action: 'assign_manager', user_id: userId }
      });
    },

    async flagContent(contentId: string, contentType: string, reason?: string) {
      return $fetch('/api/admin', {
        method: 'POST',
        body: { 
          action: 'flag_content', 
          content_id: contentId, 
          content_type: contentType,
          reason 
        }
      });
    },

    async getActivity(limit: number = 50, offset: number = 0) {
      return $fetch('/api/admin', {
        method: 'POST',
        body: { action: 'get_activity', limit, offset }
      });
    }
  };

  // ============ STREAM OPERATIONS ============
  const stream = {
    async create(streamData: any) {
      return $fetch('/api/stream', {
        method: 'POST',
        body: { action: 'create', ...streamData }
      });
    },

    async get(streamId: string) {
      return $fetch(`/api/stream/${streamId}`);
    },

    async getUserStreams() {
      return $fetch('/api/stream/user');
    },

    async update(streamId: string, updates: any) {
      return $fetch('/api/stream', {
        method: 'POST',
        body: { action: 'update', stream_id: streamId, ...updates }
      });
    },

    async delete(streamId: string) {
      return $fetch('/api/stream', {
        method: 'POST',
        body: { action: 'delete', stream_id: streamId }
      });
    }
  };

  // ============ GROUP CHAT OPERATIONS ============
  const groupChat = {
    async create(groupData: any) {
      return $fetch('/api/group-chat', {
        method: 'POST',
        body: { action: 'create', ...groupData }
      });
    },

    async getUserGroups() {
      return $fetch('/api/group-chat/user');
    },

    async addMember(groupId: string, memberId: string) {
      return $fetch('/api/group-chat', {
        method: 'POST',
        body: { action: 'add_member', group_id: groupId, member_id: memberId }
      });
    },

    async removeMember(groupId: string, memberId: string) {
      return $fetch('/api/group-chat', {
        method: 'POST',
        body: { action: 'remove_member', group_id: groupId, member_id: memberId }
      });
    }
  };

  // ============ WALLET LOCK OPERATIONS ============
  const walletLock = {
    async lock(amount: number, reason?: string, scheduledUnlock?: string) {
      return $fetch('/api/wallet-lock', {
        method: 'POST',
        body: { action: 'lock', amount, reason, scheduled_unlock: scheduledUnlock }
      });
    },

    async unlock(lockId: string) {
      return $fetch('/api/wallet-lock', {
        method: 'POST',
        body: { action: 'unlock', lock_id: lockId }
      });
    },

    async getLocks() {
      return $fetch('/api/wallet-lock', {
        method: 'POST',
        body: { action: 'get_locks' }
      });
    }
  };

  // ============ GIFT OPERATIONS ============
  const gift = {
    async send(recipientId: string, amount: number, message?: string) {
      return $fetch('/api/pew-gift', {
        method: 'POST',
        body: { 
          action: 'send', 
          recipient_id: recipientId, 
          amount,
          message 
        }
      });
    },

    async getGifts() {
      return $fetch('/api/pew-gift', {
        method: 'POST',
        body: { action: 'get' }
      });
    },

    async cancel(giftId: string) {
      return $fetch('/api/pew-gift', {
        method: 'POST',
        body: { action: 'cancel', gift_id: giftId }
      });
    }
  };

  // ============ STATUS OPERATIONS ============
  const status = {
    async create(content: string, files?: any[]) {
      return $fetch('/api/status', {
        method: 'POST',
        body: { action: 'create', content, files }
      });
    },

    async get() {
      return $fetch('/api/status', {
        method: 'POST',
        body: { action: 'get' }
      });
    },

    async delete(statusId: string) {
      return $fetch('/api/status', {
        method: 'POST',
        body: { action: 'delete', status_id: statusId }
      });
    }
  };

  // ============ PREMIUM OPERATIONS ============
  const premium = {
    async getPricing() {
      return $fetch('/api/premium?action=pricing');
    },

    async getSubscription() {
      return $fetch('/api/premium?action=subscription');
    },

    async checkFeature(featureKey: string) {
      return $fetch(`/api/premium?action=check_feature&feature_key=${featureKey}`);
    }
  };

  // ============ POSTS OPERATIONS ============
  const posts = {
    async getAll(page: number = 1) {
      return $fetch(`/api/posts?page=${page}`);
    },

    async create(content: string, mediaFiles?: any[]) {
      return $fetch('/api/posts', {
        method: 'POST',
        body: { content, media_files: mediaFiles }
      });
    }
  };

  return {
    admin,
    stream,
    groupChat,
    walletLock,
    gift,
    status,
    premium,
    posts
  };
};
