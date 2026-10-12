import { sendStream } from 'h3'
import { Readable } from 'node:stream'

/** Same-origin proxy so the waveform can decode Audius audio without CORS issues. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[A-Za-z0-9]{1,20}$/.test(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid track id' })
  const upstream = await fetch(`https://api.audius.co/v1/tracks/${id}/stream?app_name=viorp`, { redirect: 'follow' })
  if (!upstream.ok || !upstream.body) throw createError({ statusCode: 502, statusMessage: 'Track is unavailable' })
  setHeader(event, 'Content-Type', upstream.headers.get('content-type') ?? 'audio/mpeg')
  const length = upstream.headers.get('content-length')
  if (length) setHeader(event, 'Content-Length', length)
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return sendStream(event, Readable.fromWeb(upstream.body as import('node:stream/web').ReadableStream))
})
