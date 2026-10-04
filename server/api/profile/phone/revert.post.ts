import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireUser } from '~/server/utils/auth'
import { rpcObject, rpcString } from '~/server/utils/phone-identity'

const ERRORS: Record<string, { statusCode: number, statusMessage: string }> = {
  nothing_to_revert: { statusCode: 409, statusMessage: 'There is no phone change to revert in the last 24 hours.' },
  old_number_taken: { statusCode: 409, statusMessage: 'Your previous number is now linked to another account.' }
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { data, error } = await getServiceClient().rpc('revert_phone_change', { p_user: user.id })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const result = rpcObject(data)
  const status = rpcString(result, 'status') ?? ''
  const failure = ERRORS[status]
  if (failure) throw createError(failure)
  return { status: 'reverted', phone: rpcString(result, 'phone') }
})
