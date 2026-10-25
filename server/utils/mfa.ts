import { createHash, randomBytes } from 'node:crypto'

interface FactorLike { status?: string, factor_type?: string }

/** Reads the `aal` claim from a Supabase access token without verifying it (Supabase already did). */
export const tokenAal = (token: string | null | undefined): string | null => {
  const part = token?.split('.')[1]
  if (!part) return null
  try {
    return (JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as { aal?: string }).aal ?? null
  } catch {
    return null
  }
}

/** True when the account has a verified authenticator but this session hasn't passed it yet. */
export const isMfaPending = (factors: FactorLike[] | undefined, token: string | null | undefined) =>
  Boolean(factors?.some(f => f.status === 'verified')) && tokenAal(token) !== 'aal2'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const normalizeRecoveryCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '')

export const hashRecoveryCode = (code: string) =>
  createHash('sha256').update(`viorp-mfa:${normalizeRecoveryCode(code)}`).digest('hex')

/** Ten single-use codes formatted XXXXX-XXXXX. */
export const generateRecoveryCodes = (count = 10): string[] =>
  Array.from({ length: count }, () => {
    const bytes = randomBytes(10)
    const chars = Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('')
    return `${chars.slice(0, 5)}-${chars.slice(5)}`
  })
