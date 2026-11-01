import { getServiceClient } from '~/server/utils/supabase-admin'

export const DEFAULT_KYC_SENTENCE = "My name is {name}. I'm a resident of {residence}. My ID type and number are {id_type} and {id_number}, and I confirm all to be true. Signature {signature}, date {date}."

export interface KycSettings { fee_pew: number, sentence: string }

export const getKycSettings = async (): Promise<KycSettings> => {
  const { data } = await getServiceClient().from('platform_configurations')
    .select('config_values').eq('config_key', 'kyc_settings').maybeSingle()
  const v = (data?.config_values ?? {}) as Partial<KycSettings>
  const fee = Number(v.fee_pew)
  return {
    fee_pew: Number.isFinite(fee) && fee >= 0 ? fee : 1.4,
    sentence: typeof v.sentence === 'string' && v.sentence.trim() ? v.sentence : DEFAULT_KYC_SENTENCE
  }
}

export interface KycRecord { status: 'none' | 'pending' | 'verified' | 'rejected' | 'revoked', legal_name: string | null, method: string | null, verified_at: string | null }

/** Private to the user (and staff); never expose on public profiles. */
export const getKyc = async (userId: string): Promise<KycRecord> => {
  const { data } = await getServiceClient().from('user_kyc' as never)
    .select('status, legal_name, method, verified_at').eq('user_id', userId).maybeSingle()
  return (data as KycRecord | null) ?? { status: 'none', legal_name: null, method: null, verified_at: null }
}

/** Staff (admin/manager or P2P/support/dispute roles) may use any payout name; everyone else uses their KYC name. */
export const isNamePrivileged = async (userId: string): Promise<boolean> => {
  const db = getServiceClient()
  const [{ data: u }, { count }] = await Promise.all([
    db.from('user').select('role').eq('user_id', userId).maybeSingle(),
    db.from('staff_roles' as never).select('role', { count: 'exact', head: true }).eq('user_id', userId)
  ])
  const role = (u as { role?: string } | null)?.role
  return role === 'admin' || role === 'manager' || (count ?? 0) > 0
}

/** Returns the payout name to use; throws if the user must KYC first. */
export const resolvePayoutName = async (userId: string, typed: string): Promise<string> => {
  if (await isNamePrivileged(userId)) return typed
  const kyc = await getKyc(userId)
  if (kyc.status !== 'verified' || !kyc.legal_name) {
    throw createError({ statusCode: 403, statusMessage: 'Verify your identity (KYC) first so your legal payment name can be used. Go to your profile → Identity (KYC).' })
  }
  return kyc.legal_name
}
