import { createError } from 'h3'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g

function fail(message: string): never {
  throw createError({ statusCode: 400, statusMessage: message })
}

/** Strips control characters and collapses whitespace; never renders HTML safe. */
export function sanitizeText(value: unknown, field: string, maxLength = 2000): string {
  if (typeof value !== 'string') fail(`${field} must be a string`)
  const cleaned = value.replace(CONTROL_CHARS, '').trim()
  if (!cleaned) fail(`${field} is required`)
  if (cleaned.length > maxLength) fail(`${field} must be ${maxLength} characters or fewer`)
  return cleaned
}

export function optionalText(value: unknown, field: string, maxLength = 2000): string | null {
  if (value === undefined || value === null || value === '') return null
  return sanitizeText(value, field, maxLength)
}

export function requireUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID.test(value)) fail(`${field} must be a valid id`)
  return value
}

export function requireAmount(value: unknown, field: string, options: { min?: number; max?: number } = {}): number {
  const amount = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(amount)) fail(`${field} must be a number`)
  if (amount <= 0) fail(`${field} must be positive`)
  if (options.min !== undefined && amount < options.min) fail(`${field} must be at least ${options.min}`)
  if (options.max !== undefined && amount > options.max) fail(`${field} must be at most ${options.max}`)
  return amount
}

export function requireEnum<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    fail(`${field} must be one of: ${allowed.join(', ')}`)
  }
  return value as T
}

export function requireAssetCode(value: unknown, field = 'asset'): string {
  if (typeof value !== 'string' || !/^[A-Z0-9]{2,12}$/.test(value.toUpperCase())) {
    fail(`${field} must be a valid asset code`)
  }
  return value.toUpperCase()
}
