import { getServiceClient } from '~/server/utils/supabase-admin'

/**
 * Digits-only country calling codes we can complete a national number with.
 * Only used when the caller supplies a default country (the device region),
 * mirroring how WhatsApp completes numbers saved without a country code.
 */
const CALLING_CODES: Record<string, string> = {
  US: '1', CA: '1', GB: '44', IE: '353', NG: '234', GH: '233', KE: '254',
  ZA: '27', IN: '91', PK: '92', BD: '880', PH: '63', ID: '62', MY: '60',
  SG: '65', AU: '61', NZ: '64', DE: '49', FR: '33', ES: '34', IT: '39',
  NL: '31', BE: '32', PT: '351', SE: '46', NO: '47', DK: '45', FI: '358',
  PL: '48', UA: '380', TR: '90', RU: '7', BR: '55', MX: '52', AR: '54',
  CL: '56', CO: '57', PE: '51', EG: '20', MA: '212', SA: '966', AE: '971',
  QA: '974', JP: '81', KR: '82', CN: '86', TH: '66', VN: '84'
}

/**
 * Normalises a phone number to E.164 (`+` followed by digits).
 * Returns null when the number cannot be resolved without ambiguity.
 */
export const normaliseE164 = (
  raw: string,
  defaultCountry?: string
): string | null => {
  if (!raw) return null

  const trimmed = raw.trim()
  const hasPlus = trimmed.startsWith('+')
  let digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  if (!hasPlus) {
    const code = defaultCountry ? CALLING_CODES[defaultCountry.toUpperCase()] : undefined
    if (digits.startsWith('00')) {
      digits = digits.slice(2)
    } else if (code) {
      // Drop a national trunk prefix before prepending the country code.
      const national = digits.startsWith('0') ? digits.slice(1) : digits
      digits = national.startsWith(code) && national.length > code.length + 6
        ? national
        : `${code}${national}`
    } else if (digits.length < 11) {
      // No country context and too short to be international: unusable.
      return null
    }
  }

  if (digits.length < 8 || digits.length > 15) return null
  return `+${digits}`
}

/**
 * Hashes E.164 numbers with the server-side pepper held in the database, so
 * raw address-book numbers are never persisted.
 */
export const hashPhones = async (numbers: string[]): Promise<string[]> => {
  if (!numbers.length) return []

  const client = getServiceClient()
  const { data, error } = await client.rpc('hash_phones', { p_e164: numbers })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Contact hashing failed' })
  }

  return (data ?? []) as string[]
}

export const hashPhone = async (number: string): Promise<string | null> => {
  const [hash] = await hashPhones([number])
  return hash ?? null
}
