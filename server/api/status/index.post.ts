// server/api/status/index.post.ts
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { StatusModel } from '~/server/models/status'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody(event)
    const { action } = body as any

    if (!action) {
      throw createError({ statusCode: 400, statusMessage: 'action is required' })
    }

    let result: any = null

    if (action === 'create') {
      // Handle file uploads if present
      const formData: any[] = (await readMultipartFormData(event)) || []
      const files = formData?.filter((f: any) => f?.filename) || []

      result = await StatusModel.create({
        userId: user.id,
        ...body,
        files: files.map((f: any) => ({ filename: f.filename, type: f.type }))
      })
    } else if (action === 'delete') {
      const statusId = (body as any).status_id
      if (!statusId) throw createError({ statusCode: 400, statusMessage: 'status_id is required' })
      await StatusModel.delete(statusId, user.id)
      result = { deleted: true }
    } else if (action === 'get') {
      result = await StatusModel.getUserStatuses(user.id)
    } else {
      throw createError({ statusCode: 400, statusMessage: `Unknown action: ${action}` })
    }

    return { success: true, message: `Status ${action} successful`, data: result }
  } catch (error: any) {
    console.error('[Status API] Error:', error)
    throw createError({ statusCode: error?.statusCode || 500, statusMessage: error?.statusMessage || 'Status operation failed' })
  }
})
