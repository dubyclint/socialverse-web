// server/api/pewgift/index.post.ts
import { 
  authenticateUser, 
  validateBody, 
  handleError 
} from '../../utils/auth-utils'
import { rateLimit } from '../../utils/rate-limit-utils'
import { giftOperations } from '../../utils/gift-operations-utils'

export default defineEventHandler(async (event) => {
  try {
    const user = await authenticateUser(event)
    const body = await readBody(event)
    const { action } = body

    validateBody(body, ['action'])

    let result

    if (action === 'send') {
      await rateLimit(10, 60000)(event) // 10 requests per minute
      validateBody(body, ['recipient_id', 'gift_id', 'amount'])
      result = await giftOperations.sendGift(user.id, body.recipient_id, body)
    } 
    else if (action === 'history') {
      result = await giftOperations.getGiftHistory(user.id)
    } 
    else if (action === 'stats') {
      result = await giftOperations.getGiftStats(user.id)
    } 
    else {
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown action: ${action}`
      })
    }

    return result
  } catch (error) {
    return handleError(error)
  }
})
