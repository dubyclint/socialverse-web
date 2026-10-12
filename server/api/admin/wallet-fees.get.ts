import { getFeeSettings, requireWalletAdmin } from '~/server/utils/wallet'

export default defineEventHandler(async (event) => {
  await requireWalletAdmin(event)
  return getFeeSettings()
})
