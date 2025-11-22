// utils/api-endpoints.ts
// ✅ API ENDPOINTS REFERENCE GUIDE
// All new API endpoints after migration from Express routes

export const API_ENDPOINTS = {
  // Admin Operations
  ADMIN: '/api/admin',
  
  // Stream Operations
  STREAM: '/api/stream',
  STREAM_BY_ID: (id: string) => `/api/stream/${id}`,
  STREAM_USER: '/api/stream/user',
  
  // Group Chat Operations
  GROUP_CHAT: '/api/group-chat',
  GROUP_CHAT_USER: '/api/group-chat/user',
  
  // Wallet Lock Operations
  WALLET_LOCK: '/api/wallet-lock',
  
  // Gift Operations
  PEW_GIFT: '/api/pew-gift',
  
  // Status Operations
  STATUS: '/api/status',
  
  // Premium Operations
  PREMIUM: '/api/premium',
  
  // Posts Operations
  POSTS: '/api/posts',
  POSTS_BY_ID: (id: string) => `/api/posts/${id}`
};

// Action types for POST endpoints
export const ADMIN_ACTIONS = {
  GET_STATS: 'get_stats',
  BAN_USER: 'ban_user',
  VERIFY_USER: 'verify_user',
  ADJUST_BALANCE: 'adjust_balance',
  ASSIGN_MANAGER: 'assign_manager',
  FLAG_CONTENT: 'flag_content',
  GET_ACTIVITY: 'get_activity'
};

export const STREAM_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
};

export const GROUP_CHAT_ACTIONS = {
  CREATE: 'create',
  ADD_MEMBER: 'add_member',
  REMOVE_MEMBER: 'remove_member'
};

export const WALLET_LOCK_ACTIONS = {
  LOCK: 'lock',
  UNLOCK: 'unlock',
  GET_LOCKS: 'get_locks'
};

export const GIFT_ACTIONS = {
  SEND: 'send',
  GET: 'get',
  CANCEL: 'cancel'
};

export const STATUS_ACTIONS = {
  CREATE: 'create',
  GET: 'get',
  DELETE: 'delete'
};

export const PREMIUM_ACTIONS = {
  PRICING: 'pricing',
  SUBSCRIPTION: 'subscription',
  CHECK_FEATURE: 'check_feature'
};
