import { getServiceClient } from '~/server/utils/supabase-admin'

export type VerificationTier = 'personal' | 'page' | 'business_sme' | 'business_corp' | 'government'
export type VerificationPlan = 'monthly' | 'yearly'

export type VerificationFees = Record<`${VerificationTier}_${VerificationPlan}`, number | null>

/** Government badges are yearly only (null = plan not offered). */
export const DEFAULT_VERIFICATION_FEES: VerificationFees = {
  personal_monthly: 4,
  personal_yearly: 25,
  page_monthly: 7,
  page_yearly: 40,
  business_sme_monthly: 10,
  business_sme_yearly: 40,
  business_corp_monthly: 20,
  business_corp_yearly: 200,
  government_monthly: null,
  government_yearly: 350
}

export const TIER_LABELS: Record<VerificationTier, string> = {
  personal: 'Personal profile',
  page: 'Personal Page',
  business_sme: 'Business (SME / sole owner)',
  business_corp: 'Business (large company / corporation)',
  government: 'Government'
}

export const getVerificationFees = async (): Promise<VerificationFees> => {
  const { data } = await getServiceClient()
    .from('platform_configurations')
    .select('config_values')
    .eq('config_key', 'verification_fees')
    .maybeSingle()
  const stored = (data?.config_values ?? {}) as Record<string, unknown>
  const merged = { ...DEFAULT_VERIFICATION_FEES }
  for (const key of Object.keys(merged) as (keyof VerificationFees)[]) {
    if (stored[key] === null) merged[key] = null
    else if (stored[key] !== undefined && Number.isFinite(Number(stored[key])) && Number(stored[key]) >= 0) merged[key] = Number(stored[key])
  }
  return merged
}

/** Which fee tier a request falls under. */
export const tierFor = (category: string, isPage: boolean, businessSize?: string): VerificationTier => {
  if (category === 'government') return 'government'
  if (category === 'business') return businessSize === 'corp' ? 'business_corp' : 'business_sme'
  return isPage ? 'page' : 'personal'
}
