import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

const run = promisify(execFile)
const MAX_MEDIA_BYTES = 100 * 1024 * 1024
const MAX_AUDIO_BYTES = 25 * 1024 * 1024
const MAX_CLIP_SECONDS = 15

const fieldText = (parts: Awaited<ReturnType<typeof readMultipartFormData>>, name: string) =>
  parts?.find(p => p.name === name && !p.filename)?.data.toString('utf8').trim() ?? ''

/** Only media already stored in our own Supabase public buckets may be mixed. */
const assertOwnStorageUrl = (raw: string): URL => {
  const base = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || ''
  let url: URL
  try { url = new URL(raw) } catch { throw createError({ statusCode: 400, statusMessage: 'Invalid media URL' }) }
  if (!base || url.host !== new URL(base).host || !url.pathname.startsWith('/storage/v1/object/public/')) {
    throw createError({ statusCode: 400, statusMessage: 'Media must be uploaded to Viorp first' })
  }
  return url
}

const download = async (url: string, max: number): Promise<{ data: Buffer, type: string }> => {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw createError({ statusCode: 502, statusMessage: 'Could not fetch source media' })
  const length = Number(res.headers.get('content-length') ?? 0)
  if (length > max) throw createError({ statusCode: 413, statusMessage: 'Source file is too large' })
  const data = Buffer.from(await res.arrayBuffer())
  if (data.length > max) throw createError({ statusCode: 413, statusMessage: 'Source file is too large' })
  return { data, type: (res.headers.get('content-type') ?? '').split(';')[0]!.trim().toLowerCase() }
}

const probe = async (file: string): Promise<{ hasAudio: boolean, videoCodec: string | null }> => {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name', '-of', 'json', file])
  const streams = (JSON.parse(stdout).streams ?? []) as { codec_type: string, codec_name: string }[]
  return {
    hasAudio: streams.some(s => s.codec_type === 'audio'),
    videoCodec: streams.find(s => s.codec_type === 'video')?.codec_name ?? null
  }
}

/**
 * Mixes a trimmed audio clip (custom upload or Audius track) into an already
 * uploaded post photo/video and stores the resulting MP4 in the posts bucket.
 * Photos become a still-image video for the clip's length; videos keep their
 * picture and get the clip mixed over their own sound (0.3 / 0.8).
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const parts = await readMultipartFormData(event)
  if (!parts) throw createError({ statusCode: 400, statusMessage: 'Expected multipart form data' })

  const mediaUrl = assertOwnStorageUrl(fieldText(parts, 'media_url'))
  const start = Math.max(0, Number(fieldText(parts, 'start')) || 0)
  const duration = Math.min(MAX_CLIP_SECONDS, Number(fieldText(parts, 'duration')) || 0)
  if (duration < 1) throw createError({ statusCode: 400, statusMessage: 'Select at least 1 second of audio' })

  const audioPart = parts.find(p => p.name === 'audio' && p.filename)
  const audiusId = fieldText(parts, 'audius_id')
  if (!audioPart && !/^[A-Za-z0-9]{1,20}$/.test(audiusId)) {
    throw createError({ statusCode: 400, statusMessage: 'Choose a track or upload an audio file' })
  }
  if (audioPart) {
    if (!(audioPart.type ?? '').startsWith('audio/')) throw createError({ statusCode: 400, statusMessage: 'Audio file format is not supported' })
    if (audioPart.data.length > MAX_AUDIO_BYTES) throw createError({ statusCode: 413, statusMessage: 'Audio file must be under 25 MB' })
  }

  const dir = await mkdtemp(join(tmpdir(), 'viorp-mix-'))
  try {
    const media = await download(mediaUrl.toString(), MAX_MEDIA_BYTES)
    const isImage = media.type.startsWith('image/')
    if (!isImage && !media.type.startsWith('video/')) throw createError({ statusCode: 400, statusMessage: 'Only photos and videos can have music' })

    const mediaPath = join(dir, 'media')
    const audioPath = join(dir, 'audio')
    const outPath = join(dir, 'out.mp4')
    await writeFile(mediaPath, media.data)
    const audio = audioPart
      ? audioPart.data
      : (await download(`https://api.audius.co/v1/tracks/${audiusId}/stream?app_name=viorp`, MAX_AUDIO_BYTES)).data
    await writeFile(audioPath, audio)

    const clip = ['-ss', String(start), '-t', String(duration), '-i', audioPath]
    let args: string[]
    if (isImage) {
      args = ['-y', '-loop', '1', '-i', mediaPath, ...clip,
        '-vf', 'scale=trunc(min(1280\\,iw)/2)*2:-2,format=yuv420p',
        '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'stillimage', '-r', '30',
        '-c:a', 'aac', '-b:a', '160k', '-t', String(duration), '-shortest', '-movflags', '+faststart', outPath]
    } else {
      const { hasAudio, videoCodec } = await probe(mediaPath)
      const video = videoCodec === 'h264' || videoCodec === 'hevc'
        ? ['-c:v', 'copy']
        : ['-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p']
      args = hasAudio
        ? ['-y', '-i', mediaPath, ...clip,
            '-filter_complex', '[0:a]volume=0.3[a1];[1:a]volume=0.8[a2];[a1][a2]amix=inputs=2:duration=first[a]',
            '-map', '0:v:0', '-map', '[a]', ...video, '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', outPath]
        : ['-y', '-i', mediaPath, ...clip,
            '-map', '0:v:0', '-map', '1:a:0', ...video, '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', outPath]
    }

    try {
      await run('ffmpeg', args, { timeout: 180_000, maxBuffer: 10 * 1024 * 1024 })
    } catch (e) {
      console.error('[media/mix] ffmpeg failed', (e as { stderr?: string }).stderr?.slice(-2000))
      throw createError({ statusCode: 422, statusMessage: 'Could not add music to this file' })
    }

    const output = await readFile(outPath)
    const path = `${user.id}/mix-${Date.now()}.mp4`
    const storage = getServiceClient().storage.from('posts')
    const { error } = await storage.upload(path, output, { contentType: 'video/mp4', upsert: false })
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return { url: storage.getPublicUrl(path).data.publicUrl, type: 'video/mp4' }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
