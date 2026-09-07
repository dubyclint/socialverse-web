import { defineEventHandler, readBody, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

interface BadgeRequestBody {
  name?: string
  socialLink?: string
  docUrl?: string
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { name, socialLink, docUrl } = await readBody<BadgeRequestBody>(event)

  if (!name?.trim() || !socialLink?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: name and socialLink'
    })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: pending } = await supabase
    .from('badge_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (pending) {
    throw createError({ statusCode: 409, statusMessage: 'A verification request is already pending' })
  }

  const { data, error } = await supabase
    .from('badge_requests')
    .insert({
      user_id: user.id,
      reason: name.trim(),
      evidence: { socialLink: socialLink.trim(), docUrl: docUrl?.trim() ?? null },
      status: 'pending'
    })
    .select('id')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { status: 'pending', id: data.id }
})
