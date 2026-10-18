import { getOptionalUser } from '~/server/utils/auth'
import { loadStaff } from '~/server/utils/staff'

/** The caller's staff role and granted sections, or null for regular users. */
export default defineEventHandler(async (event) => {
  const user = await getOptionalUser(event)
  if (!user) return { staff: null }
  return { staff: await loadStaff(user.id) }
})
