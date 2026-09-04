import { getCorrelationId, logger } from '~/server/utils/logger'

/** Structured access log; the correlation id is echoed back for client traces. */
export default defineEventHandler((event) => {
  const startTime = Date.now()
  const correlationId = getCorrelationId(event)
  setResponseHeader(event, 'x-correlation-id', correlationId)

  event.node.res.on('finish', () => {
    const status = event.node.res.statusCode
    const fields = {
      correlationId,
      method: event.method,
      path: event.path,
      status,
      durationMs: Date.now() - startTime
    }

    if (status >= 500) logger.error('request failed', fields)
    else if (status >= 400) logger.warn('request rejected', fields)
    else logger.info('request completed', fields)
  })
})
