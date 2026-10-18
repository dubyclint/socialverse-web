import { readMultipartFormData } from 'h3'
import { randomUUID } from 'node:crypto'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }

/** Store a verification document in the private bucket; only staff can view it (via signed URLs). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const file = (await readMultipartFormData(event))?.find(p => p.name === 'file')
  const type = file?.type?.split(';')[0] ?? ''
  if (!file?.data?.length || !TYPES[type]) throw createError({ statusCode: 400, statusMessage: 'Upload a JPG, PNG, WebP or PDF file' })
  if (file.data.length > 10 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: 'Document must be under 10MB' })
  const path = `${user.id}/${randomUUID()}.${TYPES[type]}`
  const { error } = await getServiceClient().storage.from('verification').upload(path, file.data, { contentType: type, upsert: false })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { path, name: String(file.filename ?? 'Document').slice(0, 120) }
})
