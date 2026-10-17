import { createError } from 'h3'
import type { H3Event } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { requirePageRole } from '~/server/utils/actor'
import { DEFAULT_AD_PRICING, readPlatformConfig } from '~/server/utils/ads'
import type { AdPricing } from '~/server/utils/ads'
import { CTA_LABELS, GOAL_LOCATIONS, OBJECTIVES, SPECIAL_CATEGORIES } from '~/utils/ad-options'
import type { AdGoal, AdMediaItem, AdObjective, AdSchedule, AdTargeting, CatalogItem, ConversionLocation, LeadQuestion } from '~/utils/ad-options'

export interface CampaignInput {
  title?: string
  objective?: AdObjective
  goal?: AdGoal
  specialCategory?: string | null
  pageId?: string | null
  fundFromPage?: boolean
  adsetName?: string
  conversionLocation?: ConversionLocation
  postId?: string | null
  format?: 'SINGLE' | 'CAROUSEL'
  media?: AdMediaItem[]
  primaryText?: string
  headline?: string
  cta?: string
  destinationUrl?: string
  leadForm?: { intro?: string, questions?: LeadQuestion[], privacy_url?: string } | null
  catalog?: CatalogItem[]
  targeting?: AdTargeting
  schedule?: AdSchedule
  startsAt?: string
  endsAt?: string
  budget?: number
  dailyMinSpend?: number
  dailyMaxSpend?: number | null
}

const bad = (message: string) => createError({ statusCode: 400, statusMessage: message })
const text = (value: unknown, max: number) => {
  const v = String(value ?? '').trim()
  return v ? v.slice(0, max) : null
}
const isUrl = (value: string | null) => {
  if (!value) return false
  try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
}
const strList = (value: unknown, max = 50) =>
  Array.isArray(value) ? value.map(v => String(v).trim()).filter(Boolean).slice(0, max) : []

/** Validates wizard input into ads_campaigns columns (no budget fields). */
export const parseCampaign = async (event: H3Event, body: CampaignInput) => {
  const user = await requireUser(event)
  const pricing = await readPlatformConfig<AdPricing>('ad_pricing', DEFAULT_AD_PRICING)

  const title = text(body.title, 120)
  if (!title) throw bad('Campaign name is required')
  const objective = OBJECTIVES.find(o => o.value === body.objective)
  if (!objective) throw bad('Choose a campaign type')
  const goal = body.goal && objective.goals.includes(body.goal) ? body.goal : objective.goals[0]!
  const location = body.conversionLocation && GOAL_LOCATIONS[goal].includes(body.conversionLocation)
    ? body.conversionLocation
    : GOAL_LOCATIONS[goal][0]!
  const special = body.specialCategory && SPECIAL_CATEGORIES.some(c => c.value === body.specialCategory) ? body.specialCategory : null

  let pageId: string | null = null
  if (body.pageId) {
    await requirePageRole(event, body.pageId, ['OWNER', 'MANAGER'])
    pageId = body.pageId
  }
  if (location === 'PAGE' && !pageId) throw bad('Choose the Page people should visit')

  const format = body.format === 'CAROUSEL' ? 'CAROUSEL' : 'SINGLE'
  const media = (Array.isArray(body.media) ? body.media : [])
    .filter(m => isUrl(m?.url))
    .slice(0, format === 'CAROUSEL' ? 10 : 1)
    .map(m => ({
      url: m.url,
      type: m.type === 'video' ? 'video' as const : 'image' as const,
      headline: text(m.headline, 80) ?? undefined,
      description: text(m.description, 120) ?? undefined,
      link: isUrl(m.link ?? null) ? m.link : undefined
    }))
  if (format === 'CAROUSEL' && media.length < 2) throw bad('A carousel needs at least 2 cards')
  if (location !== 'POST' && location !== 'CATALOG' && !media.length) throw bad('Add an image or video')

  const destination = text(body.destinationUrl, 500)
  if (['WEBSITE', 'APP'].includes(location) && !isUrl(destination)) throw bad('Enter a valid https:// link')
  if (location === 'POST' && !body.postId) throw bad('Choose the post to promote')

  const catalog = (Array.isArray(body.catalog) ? body.catalog : [])
    .filter(item => text(item?.name, 80) && isUrl(item?.link) && isUrl(item?.image))
    .slice(0, 20)
    .map(item => ({ name: text(item.name, 80)!, price: text(item.price, 30) ?? '', image: item.image, link: item.link }))
  if (location === 'CATALOG' && !catalog.length) throw bad('Add at least one catalogue product with name, image and link')

  let leadForm: CampaignInput['leadForm'] = null
  if (location === 'INSTANT_FORM') {
    const questions = (body.leadForm?.questions ?? [])
      .filter(q => text(q?.label, 120))
      .slice(0, 10)
      .map(q => ({
        label: text(q.label, 120)!,
        type: (['text', 'email', 'phone', 'choice'].includes(q.type) ? q.type : 'text') as LeadQuestion['type'],
        options: q.type === 'choice' ? strList(q.options, 10) : undefined,
        prefill: q.prefill
      }))
    if (!questions.length) throw bad('Add at least one question to the instant form')
    const privacy = text(body.leadForm?.privacy_url, 500)
    if (!isUrl(privacy)) throw bad('Instant forms need a link to your privacy policy')
    leadForm = { intro: text(body.leadForm?.intro, 300) ?? undefined, questions, privacy_url: privacy! }
  }

  const t = body.targeting ?? {}
  const demographics: Record<string, string[]> = {}
  for (const [key, values] of Object.entries(t.demographics ?? {})) {
    const list = strList(values)
    if (list.length) demographics[key] = list
  }
  // Special ad categories may not narrow by age, gender or detailed demographics.
  const targeting: AdTargeting = {
    locations: strList(t.locations, 25),
    age_min: special ? 18 : Math.max(13, Math.min(65, Number(t.age_min) || 18)),
    age_max: special ? 65 : Math.max(13, Math.min(65, Number(t.age_max) || 65)),
    genders: special ? [] : strList(t.genders, 3),
    demographics: special ? {} : demographics,
    interests: strList(t.interests, 100),
    behaviours: special ? [] : strList(t.behaviours, 30),
    os: strList(t.os, 5),
    devices: strList(t.devices, 15),
    connections: strList(t.connections, 4),
    expand: t.expand !== false
  }
  if ((targeting.age_min ?? 18) > (targeting.age_max ?? 65)) throw bad('Minimum age must be below maximum age')

  const s = body.schedule ?? {}
  const schedule: AdSchedule = {
    days: (Array.isArray(s.days) ? s.days : []).map(Number).filter(d => d >= 0 && d <= 6),
    start_hour: Math.max(0, Math.min(23, Number(s.start_hour) || 0)),
    end_hour: Math.max(1, Math.min(24, Number(s.end_hour) || 24)),
    utc_offset_minutes: Math.max(-720, Math.min(840, Number(s.utc_offset_minutes) || 0))
  }

  const startsAt = body.startsAt ? new Date(body.startsAt) : new Date()
  const endsAt = body.endsAt ? new Date(body.endsAt) : new Date(startsAt.getTime() + 7 * 86400000)
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) throw bad('End date must be after start date')

  const dailyMin = Math.max(0, Number(body.dailyMinSpend) || 0)
  const dailyMax = body.dailyMaxSpend ? Number(body.dailyMaxSpend) : null
  if (dailyMax !== null && (!Number.isFinite(dailyMax) || dailyMax < pricing.min_daily_pew)) throw bad(`Daily maximum must be at least ${pricing.min_daily_pew} PEW`)
  if (dailyMax !== null && dailyMin > dailyMax) throw bad('Daily minimum cannot exceed daily maximum')

  const cta = body.cta && body.cta in CTA_LABELS ? body.cta : 'LEARN_MORE'

  return {
    userId: user.id,
    pricing,
    columns: {
      title,
      objective: objective.value,
      goal,
      special_category: special,
      page_id: pageId,
      funding_source: pageId && body.fundFromPage ? 'PAGE' : 'USER',
      adset_name: text(body.adsetName, 120) ?? `${title} — ad set`,
      conversion_location: location,
      post_id: location === 'POST' ? body.postId! : null,
      ad_format: format,
      media,
      primary_text: text(body.primaryText, 2000),
      headline: text(body.headline, 120),
      cta_label: cta,
      lead_form: leadForm,
      catalog,
      ad_creative_url: media[0]?.url ?? catalog[0]?.image ?? '',
      target_destination_url: destination ?? '',
      targeting_demographics: targeting,
      schedule,
      daily_min_spend: dailyMin,
      daily_max_spend: dailyMax,
      billing_model: 'CPM' as const,
      bid_strategy: 'HIGHEST_VOLUME',
      bid_per_unit: pricing.cpm_pew,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString()
    }
  }
}
