import { getRouterParam, readBody } from 'h3'
import { requirePageRole } from '~/server/utils/actor'
import { pageWalletTransfer, parseAmount } from '~/server/utils/page-wallet'
import { loadPage } from '~/server/utils/pages'

/** An owner or manager moves PEW from their personal wallet into the Page wallet. */
export default defineEventHandler(async (event) => {
  const page = await loadPage(String(getRouterParam(event, 'id')))
  const { userId } = await requirePageRole(event, page.id, ['OWNER', 'MANAGER'])
  const amount = parseAmount((await readBody<{ amount?: unknown }>(event))?.amount)

  await pageWalletTransfer({
    fromType: 'USER', fromId: userId, toType: 'PAGE', toId: page.id, amount,
    debit: 'PAGE_TRANSFER_OUT', credit: 'PAGE_TRANSFER_IN', operatorId: userId,
    metadata: { page_handle: page.handle }
  })
  return { success: true }
})
