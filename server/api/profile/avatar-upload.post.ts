import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'
import type { Database } from '~/types/database.types'
import { enforceRateLimit } from '~/server/utils/rate-limit'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024
const BUCKET = 'avatars'

export default defineEventHandler(async (event: H3Event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  await enforceRateLimit(event, 'profile:avatar', { limit: 10, windowMs: 60_000 }, user.id)

  const supabase = await serverSupabaseClient<Database>(event)

  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.filename && part.data?.length)
  if (!file?.data) throw createError({ statusCode: 400, statusMessage: 'No file provided' })

  const mime = file.type || 'application/octet-stream'
  if (!ALLOWED_MIME.includes(mime)) {
    throw createError({ statusCode: 415, statusMessage: 'Only JPEG, PNG, GIF, and WebP are allowed' })
  }
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'File size must be <= 5MB' })
  }

  // Storage RLS only lets a user write under a folder named after their uid.
  const extFromName = file.filename?.split('.').pop()?.toLowerCase()
  const ext = extFromName && /^[a-z0-9]{1,5}$/.test(extFromName) ? extFromName : mime.split('/')[1] || 'jpg'
  const objectPath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file.data, { contentType: mime, upsert: false })

  if (uploadError) {
    throw createError({ statusCode: 500, statusMessage: `Failed to upload avatar: ${uploadError.message}` })
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
  const avatarUrl = publicUrlData?.publicUrl
  if (!avatarUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to resolve avatar URL' })
  }

  const { error: profileError } = await supabase
    .from('user')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (profileError) {
    throw createError({ statusCode: 500, statusMessage: `Avatar stored but profile update failed: ${profileError.message}` })
  }

  // `filename` stores the object path: that is the key deleteFile() removes by.
  await supabase.from('file_uploads').insert({
    user_id: user.id,
    bucket: BUCKET,
    filename: objectPath,
    file_size: file.data.length,
    file_type: mime,
    metadata: { originalFilename: file.filename ?? null }
  })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,user_id,username,full_name,avatar_url,bio,created_at,updated_at,location,is_verified')
    .eq('user_id', user.id)
    .maybeSingle()

  return { success: true, data: profile, message: 'Avatar uploaded successfully' }
})
