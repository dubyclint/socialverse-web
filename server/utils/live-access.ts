import { createError } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'

export interface LiveRules {
  trial_minutes: number
  min_followers: number
  min_account_days: number
  min_pew_added: number
  min_pew_received: number
  min_active_days: number
  min_transactions: number
  window_days: number
}

export interface LiveEligibility {
  mode: 'waived' | 'qualified' | 'trial' | 'locked' | 'denied'
  canGoLive: boolean
  override: 'auto' | 'granted' | 'denied'
  trialSecondsLeft: number
  trialSecondsTotal: number
  qualified: boolean
  progress: {
    accountDays: number
    followers: number
    pewAdded: number
    pewReceived: number
    activeDays: number
    transactions: number
  }
  rules: LiveRules
}

export const getLiveEligibility = async (userId: string): Promise<LiveEligibility> => {
  const { data, error } = await getServiceClient().rpc('live_eligibility' as never, { p_user: userId } as never)
  if (error || !data) throw createError({ statusCode: 500, statusMessage: error?.message || 'Could not check live access' })
  return data as unknown as LiveEligibility
}
