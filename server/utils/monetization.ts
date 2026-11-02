import type { SupabaseClient } from '@supabase/supabase-js'
import { getServiceClient } from '~/server/utils/supabase-admin'

export interface MonetizationRules {
  min_age: number
  wallet_min_pew: number
  wallet_days: number
  posts_min: number
  posts_days: number
  messages_min: number
  messages_days: number
  gift_days: number
  presence_minutes: number
  presence_days: number
  live_followers: number
  live_days: number
  pals_min: number
  ads_min_spend: number
  pass_pct: number
}

export const DEFAULT_MONETIZATION: MonetizationRules = {
  min_age: 18, wallet_min_pew: 10, wallet_days: 60, posts_min: 2, posts_days: 14,
  messages_min: 4, messages_days: 7, gift_days: 30, presence_minutes: 30, presence_days: 7,
  live_followers: 2000, live_days: 14, pals_min: 600, ads_min_spend: 5, pass_pct: 70
}

export interface Criterion {
  key: string
  group: 'legal' | 'activity'
  label: string
  detail: string
  current: number
  target: number
  unit: string
  progress: number
  met: boolean
}

const pct = (cur: number, target: number) => target <= 0 ? 100 : Math.max(0, Math.min(100, Math.round((cur / target) * 1000) / 10))
const ago = (days: number) => new Date(Date.now() - days * 86400_000).toISOString()

/** Live progress for every monetization requirement; monetized = meets pass_pct of criteria OR admin award. */
export const computeMonetization = async (uid: string) => {
  // Untyped client: generated DB types lag behind newer columns (banned_until, spent, kyc date_of_birth).
  const db = getServiceClient() as unknown as SupabaseClient

  const { data: cfg } = await db.from('platform_configurations').select('config_values').eq('config_key', 'monetization_rules').maybeSingle()
  const r: MonetizationRules = { ...DEFAULT_MONETIZATION, ...((cfg?.config_values ?? {}) as Partial<MonetizationRules>) }
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()

  const [
    { data: profile }, { data: kycRow }, { data: kycReq }, { data: deposits }, { count: posts },
    { count: messages }, { count: giftsSent }, { data: activity }, { data: liveGift },
    { count: palsA }, { count: palsB }, { data: campaigns }, { data: myPosts }, { data: waiver }
  ] = await Promise.all([
    db.from('user').select('birth_date, is_verified, is_banned, banned_until, restrictions, followers_count').eq('user_id', uid).maybeSingle(),
    db.from('user_kyc').select('status').eq('user_id', uid).maybeSingle(),
    db.from('kyc_requests').select('status, date_of_birth').eq('user_id', uid).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('deposits').select('credited_pewgift').eq('user_id', uid).eq('status', 'SETTLED').gte('created_at', ago(r.wallet_days)),
    db.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', uid).is('page_id', null).gte('created_at', ago(r.posts_days)),
    db.from('chat_messages').select('id', { count: 'exact', head: true }).eq('sender_id', uid).gte('created_at', ago(r.messages_days)),
    db.from('gift_transactions').select('id', { count: 'exact', head: true }).eq('sender_id', uid).gte('created_at', ago(r.gift_days)),
    db.from('user_active_minutes').select('seconds').eq('user_id', uid).gte('day', ago(r.presence_days).slice(0, 10)),
    db.from('gift_transactions').select('id').eq('recipient_id', uid).not('stream_id', 'is', null).gte('created_at', ago(r.live_days)).limit(1),
    db.from('pals').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'accepted'),
    db.from('pals').select('id', { count: 'exact', head: true }).eq('pal_id', uid).eq('status', 'accepted'),
    db.from('ads_campaigns').select('spent, created_at, updated_at').eq('advertiser_id', uid).is('deleted_at', null).gte('updated_at', monthStart),
    db.from('posts').select('id').eq('user_id', uid).limit(500),
    db.from('user_overrides').select('id').eq('user_id', uid).eq('override_type', 'monetization').or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).limit(1)
  ])

  const postIds = (myPosts ?? []).map(p => p.id)
  const { count: openFlags } = postIds.length
    ? await db.from('flagged_content').select('id', { count: 'exact', head: true }).in('content_id', postIds).is('resolved_at', null)
    : { count: 0 }

  const dob = (kycReq as { date_of_birth?: string | null } | null)?.date_of_birth || profile?.birth_date || null
  const age = dob ? Math.floor((Date.now() - Date.parse(dob)) / (365.25 * 86400_000)) : 0
  const kycStatus = (kycRow as { status?: string } | null)?.status ?? (kycReq as { status?: string } | null)?.status ?? 'none'
  const identity = kycStatus === 'verified' || profile?.is_verified ? 100 : ['pending', 'in_review'].includes(kycStatus) ? 50 : 0
  const pewAdded = (deposits ?? []).reduce((s, d) => s + Number(d.credited_pewgift || 0), 0)
  const restricted = Boolean(profile?.is_banned) || (profile?.banned_until ? Date.parse(profile.banned_until) > Date.now() : false)
    || Object.values((profile?.restrictions ?? {}) as Record<string, unknown>).some(v => v === true || (typeof v === 'string' && Date.parse(v) > Date.now()))
  const violations = (restricted ? 1 : 0) + (openFlags ?? 0)
  const seconds = ((activity ?? []) as { seconds: number }[]).reduce((s, a) => s + a.seconds, 0)
  const avgMinutes = Math.round(seconds / 60 / Math.max(1, r.presence_days))
  const followers = profile?.followers_count ?? 0
  const hasLiveGift = (liveGift ?? []).length > 0
  const pals = (palsA ?? 0) + (palsB ?? 0)
  const adSpend = (campaigns ?? []).reduce((s, c) => s + Number(c.spent || 0), 0)
  const messagingProgress = Math.max(pct(messages ?? 0, r.messages_min), (giftsSent ?? 0) > 0 ? 100 : 0)
  const liveProgress = Math.round((pct(followers, r.live_followers) + (hasLiveGift ? 100 : 0)) / 2)

  const criteria: Criterion[] = [
    { key: 'age', group: 'legal', label: 'Age requirement', detail: dob ? `You are ${age}. Must be ${r.min_age}+.` : 'Add your date of birth through KYC.', current: age, target: r.min_age, unit: 'years', progress: dob ? pct(age, r.min_age) : 0, met: Boolean(dob) && age >= r.min_age },
    { key: 'identity', group: 'legal', label: 'Identity verification', detail: identity === 100 ? 'KYC verified or verified badge.' : identity === 50 ? 'KYC submitted, waiting for review.' : 'Complete KYC or get a verified badge.', current: identity, target: 100, unit: '%', progress: identity, met: identity === 100 },
    { key: 'wallet', group: 'legal', label: 'Wallet maintenance', detail: `${r.wallet_min_pew} PEW added through Add Funds in ${r.wallet_days} days.`, current: Math.round(pewAdded * 100) / 100, target: r.wallet_min_pew, unit: 'PEW', progress: pct(pewAdded, r.wallet_min_pew), met: pewAdded >= r.wallet_min_pew },
    { key: 'compliance', group: 'legal', label: 'Platform compliance', detail: violations ? `${violations} open violation(s) or restriction(s).` : 'No open violations or restrictions.', current: violations, target: 0, unit: 'open', progress: violations ? 0 : 100, met: violations === 0 },
    { key: 'posts', group: 'activity', label: 'Post / engagement', detail: `${r.posts_min}+ original posts in ${r.posts_days} days.`, current: posts ?? 0, target: r.posts_min, unit: 'posts', progress: pct(posts ?? 0, r.posts_min), met: (posts ?? 0) >= r.posts_min },
    { key: 'messaging', group: 'activity', label: 'Messaging & community', detail: `${r.messages_min}+ chat messages in ${r.messages_days} days, or 1 gift sent in ${r.gift_days} days (${giftsSent ?? 0} sent).`, current: messages ?? 0, target: r.messages_min, unit: 'messages', progress: messagingProgress, met: messagingProgress >= 100 },
    { key: 'presence', group: 'activity', label: 'Daily active presence', detail: `Average ${r.presence_minutes} min online per day over ${r.presence_days} days.`, current: avgMinutes, target: r.presence_minutes, unit: 'min/day', progress: pct(avgMinutes, r.presence_minutes), met: avgMinutes >= r.presence_minutes },
    { key: 'live', group: 'activity', label: 'Live stream protocol', detail: `${r.live_followers.toLocaleString()} followers (${followers.toLocaleString()}) and a LIVE that received a gift in ${r.live_days} days (${hasLiveGift ? 'done' : 'not yet'}).`, current: followers, target: r.live_followers, unit: 'followers', progress: liveProgress, met: followers >= r.live_followers && hasLiveGift },
    { key: 'pals', group: 'activity', label: 'My Pal social graph', detail: `${r.pals_min} PALs.`, current: pals, target: r.pals_min, unit: 'PALs', progress: pct(pals, r.pals_min), met: pals >= r.pals_min },
    { key: 'ads', group: 'activity', label: 'Ad Manager', detail: `${r.ads_min_spend} PEW spent on your own campaigns this month.`, current: Math.round(adSpend * 100) / 100, target: r.ads_min_spend, unit: 'PEW', progress: pct(adSpend, r.ads_min_spend), met: adSpend >= r.ads_min_spend }
  ]

  const metCount = criteria.filter(c => c.met).length
  const overallPct = criteria.length ? Math.round((metCount / criteria.length) * 100) : 0
  const waived = (waiver ?? []).length > 0
  return { criteria, passPct: r.pass_pct, waived, overallPct, monetized: waived || overallPct >= r.pass_pct }
}

const monetizedCache = new Map<string, { at: number, value: boolean }>()
/** Cached (10 min) monetization status used to gate creator revenue credits. */
export const isMonetized = async (uid: string) => {
  const hit = monetizedCache.get(uid)
  if (hit && Date.now() - hit.at < 600_000) return hit.value
  const value = (await computeMonetization(uid)).monetized
  monetizedCache.set(uid, { at: Date.now(), value })
  return value
}
export const clearMonetizedCache = (uid: string) => monetizedCache.delete(uid)
