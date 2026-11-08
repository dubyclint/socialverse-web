/** Dates of birth are typed and shown as DD/MM/YY and stored as YYYY-MM-DD. */
export const DOB_PLACEHOLDER = 'DD/MM/YY'

export const formatDob = (iso?: string | null): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${m[3]}/${m[2]}/${m[1]!.slice(2)}` : ''
}

export const parseDob = (raw: string): string | null => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(raw.trim())
  if (!m) return null
  const d = Number(m[1])
  const mo = Number(m[2])
  let y = Number(m[3])
  if (m[3]!.length === 2) y += y > new Date().getFullYear() % 100 ? 1900 : 2000
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (dt.getUTCDate() !== d || dt.getUTCMonth() !== mo - 1 || dt.getTime() > Date.now()) return null
  return dt.toISOString().slice(0, 10)
}

/** Inserts the slashes while the user types digits. */
export const maskDob = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/')
}
