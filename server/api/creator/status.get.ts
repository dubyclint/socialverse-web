import { requireUser } from '~/server/utils/auth'
import { isMonetized } from '~/server/utils/monetization'
import { loadStaff } from '~/server/utils/staff'

/** Whether the signed-in user can open Creator Studio (monetized creator, or staff). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const [monetized, staff] = await Promise.all([isMonetized(user.id), loadStaff(user.id)])
  return { userId: user.id, monetized, studio: monetized || Boolean(staff) }
})
