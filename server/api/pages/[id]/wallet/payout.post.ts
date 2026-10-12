import { getRouterParam, readBody } from 'h3'
import { requirePageRole } from '~/server/utils/actor'
import { pageWalletTransfer, parseAmount } from '~/server/utils/page-wallet'
import { loadPage } from '~/server/utils/pages'

/** The owner moves the Page's withdrawable earnings to their personal withdrawable balance. */
export default defineEventHandler(async (event) => {
  const page = await loadPage(String(getRouterParam(event, 'id')))
  const { userId } = await requirePageRole(event, page.id, ['OWNER'])
  const amount = parseAmount((await readBody<{ amount?: unknown }>(event))?.amount)

  await pageWalletTransfer({
    fromType: 'PAGE', fromId: page.id, toType: 'USER', toId: userId, amount,
    debit: 'PAGE_PAYOUT', credit: 'PAGE_PAYOUT', operatorId: userId,
    metadata: { page_handle: page.handle }
  })
  return { success: true }
})
