// FILE: /server/api/status/create.post.ts
// Create a new status

import { StatusModel, type CreateStatusInput } from '~/server/models/status'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody(event)
    const { content, media_type, media_url, background_color, text_color, expires_at } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Content is required and must be a non-empty string'
      })
    }

    if (content.length > 5000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Content must be less than 5000 characters'
      })
    }

    const statusInput: CreateStatusInput = {
      content: content.trim(),
      media_type: media_type || 'text',
      media_url,
      background_color: background_color || '#000000',
      text_color: text_color || '#ffffff',
      expires_at
    }

    const status = await StatusModel.createStatus(user.id, statusInput)

    return {
      success: true,
      data: status,
      message: 'Status created successfully'
    }
  } catch (error: any) {
    console.error('[Status Create] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to create status'
    })
  }
})

