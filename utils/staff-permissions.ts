export const STAFF_PERMISSIONS = [
  { key: 'fees', label: 'Fees & withdrawals', description: 'App fees, PEW rate, withdrawal approvals' },
  { key: 'verification', label: 'Verification badges', description: 'Approve, assign, change or remove badges' },
  { key: 'compliance', label: 'Behaviour & compliance', description: 'Bans, timed bans, feature restrictions, reports' },
  { key: 'metrics', label: 'Metrics & analytics', description: 'Platform metrics and reports' },
  { key: 'security', label: 'Security & audit', description: 'Admin audit log and security events' },
  { key: 'announcements', label: 'Global announcements', description: 'Publish and retire announcements' },
  { key: 'ads', label: 'Ads review', description: 'Approve or reject ad campaigns, ad settings' },
  { key: 'payments', label: 'Payment providers', description: 'Deposit gateway configuration' },
  { key: 'p2p', label: 'P2P & escrow', description: 'Disputes and escrow actions' },
  { key: 'support', label: 'Support', description: 'Support agents and tickets' }
] as const

export type StaffPermission = typeof STAFF_PERMISSIONS[number]['key']

export const STAFF_PERMISSION_KEYS: readonly string[] = STAFF_PERMISSIONS.map(p => p.key)

export const RESTRICTION_KEYS = [
  { key: 'post', label: 'Posting' },
  { key: 'comment', label: 'Commenting' },
  { key: 'chat', label: 'Chat messages' },
  { key: 'gift', label: 'Sending gifts' },
  { key: 'wallet', label: 'Wallet (freeze deposits/withdrawals)' },
  { key: 'stream', label: 'Live streaming' }
] as const

export type RestrictionKey = typeof RESTRICTION_KEYS[number]['key']

export type BadgeType = 'personal' | 'business' | 'government'
export const BADGE_TYPES: { value: BadgeType, label: string, color: string }[] = [
  { value: 'personal', label: 'Individual', color: '#6D28D9' },
  { value: 'business', label: 'Corporate / business', color: '#FFC233' },
  { value: 'government', label: 'Government', color: '#5EE9B5' }
]
