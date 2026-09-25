import type { H3Event } from 'h3'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogFields {
  [key: string]: unknown
}

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

/** Values that must never reach the log stream, whatever a caller passes in. */
const REDACTED = /^(password|token|access_token|refresh_token|authorization|apikey|api_key|secret|service_role.*|jwt.*)$/i

function scrub(fields: LogFields): LogFields {
  const out: LogFields = {}
  for (const [key, value] of Object.entries(fields)) {
    out[key] = REDACTED.test(key) ? '[redacted]' : value
  }
  return out
}

function emit(level: LogLevel, message: string, fields: LogFields = {}): void {
  if (LEVELS[level] < LEVELS[MIN_LEVEL]) return

  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    message,
    ...scrub(fields)
  })

  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  debug: (message: string, fields?: LogFields) => emit('debug', message, fields),
  info: (message: string, fields?: LogFields) => emit('info', message, fields),
  warn: (message: string, fields?: LogFields) => emit('warn', message, fields),
  error: (message: string, fields?: LogFields) => emit('error', message, fields)
}

/**
 * Every log line raised while handling a request carries the same correlation
 * id, so a trace can be reassembled across services from the response header.
 */
export function requestLogger(event: H3Event) {
  const correlationId = getCorrelationId(event)
  const base = { correlationId, path: event.path, method: event.method }

  return {
    debug: (message: string, fields?: LogFields) => emit('debug', message, { ...base, ...fields }),
    info: (message: string, fields?: LogFields) => emit('info', message, { ...base, ...fields }),
    warn: (message: string, fields?: LogFields) => emit('warn', message, { ...base, ...fields }),
    error: (message: string, fields?: LogFields) => emit('error', message, { ...base, ...fields })
  }
}

export function getCorrelationId(event: H3Event): string {
  const existing = event.context.correlationId
  if (typeof existing === 'string') return existing

  const inbound = getRequestHeader(event, 'x-correlation-id') || getRequestHeader(event, 'x-request-id')
  const id = inbound || crypto.randomUUID()
  event.context.correlationId = id
  return id
}
