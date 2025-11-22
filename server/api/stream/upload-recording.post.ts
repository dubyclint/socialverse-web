// server/api/stream/upload-recording.post.ts
import { serverSupabaseClient } from '#supabase/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const formData = await readMultipartFormData(event)

    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file provided'
      })
    }

    const fileField = formData.find(f => f.name === 'file')
    const streamIdField = formData.find(f => f.name === 'streamId')

    if (!fileField || !streamIdField) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing file or streamId'
      })
    }

    const streamId = streamIdField.data?.toString()
    const fileName = `${streamId}_${Date.now()}.webm`
    const uploadDir = join(process.cwd(), 'public/recordings')

    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, fileField.data)

    const supabase = await serverSupabaseClient(event)

    // Update stream record with recording URL
    const { error } = await supabase
      .from('streams')
      .update({
        recording_url: `/recordings/${fileName}`
      })
      .eq('id', streamId)

    if (error) throw error

    return {
      success: true,
      url: `/recordings/${fileName}`
    }
  } catch (error: any) {
    throw error
  }
})
