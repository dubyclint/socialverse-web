import { useState } from '#app'

const KEY = 'viorp.hideBalance'

/** Eye toggle that masks the PEW balance; remembered on this device. */
export const useBalanceVisibility = () => {
  const hideBalance = useState<boolean>('hide-balance', () => {
    if (!import.meta.client) return false
    try { return localStorage.getItem(KEY) === '1' } catch { return false }
  })
  const toggleHideBalance = () => {
    hideBalance.value = !hideBalance.value
    try { localStorage.setItem(KEY, hideBalance.value ? '1' : '0') } catch { /* storage unavailable */ }
  }
  return { hideBalance, toggleHideBalance }
}
