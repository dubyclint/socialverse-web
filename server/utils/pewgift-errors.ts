import { createError } from 'h3'

/** Maps the money-core functions' SQLSTATEs onto HTTP responses. */
export function mapGiftError(error: { code?: string, message: string }) {
  if (error.code === '23514') return createError({ statusCode: 402, statusMessage: 'Insufficient balance' })
  if (error.code === '55006') return createError({ statusCode: 423, statusMessage: 'Balance is locked' })
  if (error.code === '22023') return createError({ statusCode: 400, statusMessage: error.message })
  if (error.code === 'P0002') return createError({ statusCode: 404, statusMessage: error.message })
  return createError({ statusCode: 500, statusMessage: 'Failed to process gift transaction' })
}
