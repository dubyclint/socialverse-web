import type { H3Event } from 'h3'
import { getHeader } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import type { AdPlacement, AdSchedule, AdTargeting, AdView } from '~/utils/ad-options'

export interface AdPricing {
  cpm_pew: number
  min_budget_pew: number
  min_daily_pew: number
}

export const DEFAULT_AD_PRICING: AdPricing = { cpm_pew: 2, min_budget_pew: 5, min_daily_pew: 1 }

export interface ExternalAdsConfig {
  monetag_enabled: boolean
  monetag_domain: string
  monetag_zone_id: string
  monetag_social_bar_src: string
  monetag_smartlink_url: string
  appodeal_enabled: boolean
  appodeal_app_key: string
  transition_cooldown_minutes: number
}

export const DEFAULT_EXTERNAL_ADS: ExternalAdsConfig = {
  monetag_enabled: true,
  monetag_domain: '3nbf4.com',
  monetag_zone_id: '12030144',
  monetag_social_bar_src: '',
  monetag_smartlink_url: '',
  appodeal_enabled: true,
  appodeal_app_key: '',
  transition_cooldown_minutes: 15
}

/** Reads a platform_configurations row merged over defaults (service role). */
export const readPlatformConfig = async <T extends object>(key: string, fallback: T): Promise<T> => {
  const { data } = await getServiceClient()
    .from('platform_configurations')
    .select('config_values')
    .eq('config_key', key)
    .maybeSingle()
  const stored = data?.config_values
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return { ...fallback }
  return { ...fallback, ...(stored as Partial<T>) }
}

export const AD_COLUMNS =
  'id, title, advertiser_id, page_id, funding_source, objective, goal, special_category, adset_name, conversion_location, post_id, ad_format, media, primary_text, headline, cta_label, lead_form, catalog, ad_creative_url, target_destination_url, targeting_demographics, schedule, daily_min_spend, daily_max_spend, bid_per_unit, bid_strategy, total_budget, remaining_budget, spent, impressions_count, clicks_count, results_count, status, review_note, starts_at, ends_at, created_at, updated_at'

export interface AdRow {
  id: string
  title: string
  advertiser_id: string
  page_id: string | null
  funding_source: 'USER' | 'PAGE'
  objective: AdView['objective']
  goal: AdView['goal']
  special_category: string | null
  adset_name: string | null
  conversion_location: AdView['conversionLocation']
  post_id: string | null
  ad_format: 'SINGLE' | 'CAROUSEL'
  media: AdView['media'] | null
  primary_text: string | null
  headline: string | null
  cta_label: string
  lead_form: AdView['leadForm']
  catalog: AdView['catalog'] | null
  ad_creative_url: string
  target_destination_url: string
  targeting_demographics: AdTargeting | null
  schedule: AdSchedule | null
  daily_min_spend: number
  daily_max_spend: number | null
  bid_per_unit: number
  bid_strategy: string
  total_budget: number
  remaining_budget: number
  spent: number
  impressions_count: number
  clicks_count: number
  results_count: number
  status: string
  review_note: string | null
  starts_at: string
  ends_at: string
  created_at: string
  updated_at: string
}

export interface Viewer {
  id: string
  age: number | null
  gender: string | null
  location: string | null
  attributes: Set<string>
  behaviours: Set<string>
  os: string | null
  device: string | null
  connection: string | null
}

const lower = (value: unknown) => String(value ?? '').trim().toLowerCase()

const detectOs = (ua: string): string | null => {
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/windows/i.test(ua)) return 'Windows'
  if (/mac os x|macintosh/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  return null
}

const BRAND_PATTERNS: [string, RegExp][] = [
  ['Samsung', /samsung|SM-[A-Z0-9]/i], ['Tecno', /tecno/i], ['Infinix', /infinix/i], ['itel', /itel/i],
  ['Xiaomi', /xiaomi|redmi|\bmi \d|poco/i], ['Apple', /iphone|ipad|macintosh/i], ['Google', /pixel/i],
  ['Oppo', /oppo|CPH\d/i], ['Vivo', /vivo/i], ['Huawei', /huawei|honor/i], ['Nokia', /nokia/i]
]

/** Everything the matcher knows about the person seeing an ad. */
export const loadViewer = async (event: H3Event, userId: string): Promise<Viewer> => {
  const service = getServiceClient()
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const [{ data: profile }, { data: interests }, { count: adminCount }, { count: shopClicks }, { count: gifts }, { count: posts }] = await Promise.all([
    service.from('user').select('birth_date, gender, location, marital_status, university, work, interest_tags, created_at').eq('user_id', userId).maybeSingle(),
    service.from('user_interests').select('interests(name, category)').eq('user_id', userId),
    service.from('page_admins').select('page_id', { count: 'exact', head: true }).eq('user_id', userId),
    service.from('ad_interactions').select('id', { count: 'exact', head: true }).eq('viewer_id', userId).eq('interaction_type', 'CLICK').gte('created_at', weekAgo).contains('metadata', { cta: 'SHOP_NOW' }),
    service.from('wallet_ledger').select('id', { count: 'exact', head: true }).eq('wallet_id', userId).in('transaction_type', ['GIFT_PURCHASE', 'P2P_TIPPING_SENT']).gte('created_at', monthAgo),
    service.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', weekAgo)
  ])

  const attributes = new Set<string>()
  const add = (value: unknown) => { const v = lower(value); if (v) attributes.add(v) }
  for (const tag of profile?.interest_tags ?? []) add(tag)
  for (const row of (interests ?? []) as { interests: { name: string, category: string | null } | null }[]) {
    add(row.interests?.name)
    add(row.interests?.category)
  }
  add(profile?.marital_status)
  for (const word of `${profile?.work ?? ''} ${profile?.university ?? ''}`.split(/[\s,/]+/)) if (word.length > 2) add(word)
  add(profile?.work)
  add(profile?.university)

  const behaviours = new Set<string>()
  if ((adminCount ?? 0) > 0) behaviours.add('page_admins')
  if ((shopClicks ?? 0) > 0) behaviours.add('engaged_shoppers')
  if ((gifts ?? 0) > 0) behaviours.add('viorp_gifters')
  if ((posts ?? 0) > 0) behaviours.add('viorp_creators')

  const ua = getHeader(event, 'user-agent') ?? ''
  const connection = lower(getHeader(event, 'x-viorp-connection')) || null
  let age: number | null = null
  if (profile?.birth_date) {
    const born = new Date(profile.birth_date)
    age = Math.floor((Date.now() - born.getTime()) / (365.25 * 86400000))
  }

  return {
    id: userId,
    age,
    gender: profile?.gender ? lower(profile.gender) : null,
    location: profile?.location ? lower(profile.location) : null,
    attributes,
    behaviours,
    os: detectOs(ua),
    device: BRAND_PATTERNS.find(([, pattern]) => pattern.test(ua))?.[0] ?? null,
    connection
  }
}

/**
 * Location, age, gender and device rules are strict when the viewer's value is
 * known. Detailed targeting (demographics, interests, behaviours) matches any
 * selected item; with `expand` on, viewers we know nothing about still qualify.
 */
export const matchesTargeting = (targeting: AdTargeting | null, viewer: Viewer): boolean => {
  const t = targeting ?? {}
  if (t.locations?.length && viewer.location && !t.locations.some(loc => viewer.location!.includes(lower(loc)))) return false
  if (viewer.age !== null) {
    if (t.age_min && viewer.age < t.age_min) return false
    if (t.age_max && t.age_max < 65 && viewer.age > t.age_max) return false
  }
  if (t.genders?.length && viewer.gender && !t.genders.map(lower).includes(viewer.gender)) return false
  if (t.os?.length && viewer.os && !t.os.includes(viewer.os)) return false
  if (t.devices?.length && viewer.device && !t.devices.includes(viewer.device)) return false
  if (t.connections?.length && viewer.connection && !t.connections.map(lower).includes(viewer.connection)) return false

  const detailed = [
    ...Object.values(t.demographics ?? {}).flat(),
    ...(t.interests ?? [])
  ]
  const behaviours = t.behaviours ?? []
  if (!detailed.length && !behaviours.length) return true

  const hasDetail = (value: string) => viewer.attributes.has(value) || [...viewer.attributes].some(attr => attr.includes(value) || value.includes(attr))
  const detailHit = detailed.some(value => hasDetail(lower(value)))
  const behaviourHit = behaviours.some(value => viewer.behaviours.has(value))
  if (detailHit || behaviourHit) return true

  const knowsNothing = viewer.attributes.size === 0 && viewer.behaviours.size === 0
  return Boolean(t.expand) && knowsNothing
}

export const inSchedule = (schedule: AdSchedule | null, now = new Date()): boolean => {
  if (!schedule) return true
  const local = new Date(now.getTime() + (schedule.utc_offset_minutes ?? 0) * 60000)
  if (schedule.days?.length && !schedule.days.includes(local.getUTCDay())) return false
  const start = schedule.start_hour ?? 0
  const end = schedule.end_hour ?? 24
  if (start === 0 && end === 24) return true
  const hour = local.getUTCHours()
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end
}

/** Builds the public view of campaigns, resolving the advertiser identity. */
export const toAdViews = async (rows: AdRow[]): Promise<AdView[]> => {
  if (!rows.length) return []
  const service = getServiceClient()
  const userIds = [...new Set(rows.filter(r => !r.page_id).map(r => r.advertiser_id))]
  const pageIds = [...new Set(rows.map(r => r.page_id).filter((id): id is string => Boolean(id)))]
  const [{ data: users }, { data: pages }] = await Promise.all([
    userIds.length ? service.from('user').select('user_id, username, display_name, avatar_url, is_verified').in('user_id', userIds) : Promise.resolve({ data: [] }),
    pageIds.length ? service.from('pages').select('id, name, handle, avatar_url, is_verified').in('id', pageIds) : Promise.resolve({ data: [] })
  ])
  const userById = new Map((users ?? []).map(u => [u.user_id, u]))
  const pageById = new Map((pages ?? []).map(p => [p.id, p]))

  return rows.map(row => {
    const page = row.page_id ? pageById.get(row.page_id) : null
    const user = userById.get(row.advertiser_id)
    const media = Array.isArray(row.media) && row.media.length
      ? row.media
      : row.ad_creative_url ? [{ url: row.ad_creative_url, type: /\.(mp4|webm|mov)(\?|$)/i.test(row.ad_creative_url) ? 'video' as const : 'image' as const }] : []
    return {
      id: row.id,
      title: row.title,
      advertiser: page
        ? { id: page.id, type: 'PAGE' as const, name: page.name, handle: page.handle, avatar_url: page.avatar_url, is_verified: Boolean(page.is_verified) }
        : { id: row.advertiser_id, type: 'USER' as const, name: user?.display_name || user?.username || 'Advertiser', handle: user?.username ?? '', avatar_url: user?.avatar_url ?? null, is_verified: Boolean(user?.is_verified) },
      objective: row.objective,
      goal: row.goal,
      conversionLocation: row.conversion_location,
      format: row.ad_format,
      media,
      primaryText: row.primary_text,
      headline: row.headline,
      cta: row.cta_label,
      destinationUrl: row.target_destination_url || null,
      postId: row.post_id,
      pageHandle: page?.handle ?? null,
      leadForm: row.lead_form,
      catalog: Array.isArray(row.catalog) ? row.catalog : [],
      creativeUrl: media[0]?.url ?? null,
      advertiserId: row.advertiser_id
    }
  })
}

/**
 * Active, funded, in-window, in-schedule campaigns that target this viewer,
 * ordered by bid then remaining budget, excluding the viewer's own ads.
 */
export const loadTargetedAds = async (event: H3Event, userId: string, limit: number): Promise<AdView[]> => {
  if (limit <= 0) return []
  const nowIso = new Date().toISOString()
  const { data } = await getServiceClient()
    .from('ads_campaigns')
    .select(AD_COLUMNS)
    .eq('status', 'ACTIVE')
    .is('deleted_at', null)
    .gt('remaining_budget', 0)
    .lte('starts_at', nowIso)
    .gt('ends_at', nowIso)
    .neq('advertiser_id', userId)
    .order('bid_per_unit', { ascending: false })
    .order('remaining_budget', { ascending: false })
    .limit(60)
  const rows = (data ?? []) as unknown as AdRow[]
  if (!rows.length) return []
  const viewer = await loadViewer(event, userId)
  const eligible = rows.filter(row => inSchedule(row.schedule) && matchesTargeting(row.targeting_demographics, viewer))
  return toAdViews(eligible.slice(0, limit))
}

/** Placements where programmatic or in-app ads are never shown. */
export const AD_FREE_PLACEMENTS: AdPlacement[] = []

const SENSITIVE = /\b(death|died|funeral|rip|rest in peace|accident|killed|murder|rape|abuse|suicide|kidnap|terror|bomb|war|violence|blood|porn|nude|nsfw|sex|drugs|overdose|shooting|tragedy|condolence|mourning)\b/i

/** Brand safety: content an ad slot must not sit directly beneath. */
export const isSensitiveText = (text: string | null | undefined) => Boolean(text && SENSITIVE.test(text))
