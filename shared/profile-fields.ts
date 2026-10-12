/** Personal info a user may show or hide one field at a time. */
export const PRIVATE_PROFILE_FIELDS = [
  'gender',
  'birth_date',
  'location',
  'website',
  'marital_status',
  'university',
  'work',
  'religion',
  'interests'
] as const

export type PrivateProfileField = typeof PRIVATE_PROFILE_FIELDS[number]

export type FieldVisibility = Partial<Record<PrivateProfileField, boolean>>

export const PROFILE_FIELD_LABELS: Record<PrivateProfileField, string> = {
  gender: 'Gender',
  birth_date: 'Date of birth',
  location: 'Location',
  website: 'Website',
  marital_status: 'Marital status',
  university: 'University / school',
  work: 'Work / business',
  religion: 'Religion / denomination',
  interests: 'Interests'
}

export const MARITAL_STATUSES = [
  'Single',
  'In a relationship',
  'Engaged',
  'Married',
  'Separated',
  'Divorced',
  'Widowed',
  "It's complicated"
] as const

/** Missing keys are public. */
export const isFieldPublic = (visibility: unknown, field: PrivateProfileField): boolean => {
  if (!visibility || typeof visibility !== 'object' || Array.isArray(visibility)) return true
  return (visibility as Record<string, unknown>)[field] !== false
}

export const sanitiseFieldVisibility = (input: unknown): FieldVisibility => {
  const out: FieldVisibility = {}
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out
  for (const field of PRIVATE_PROFILE_FIELDS) {
    const value = (input as Record<string, unknown>)[field]
    if (typeof value === 'boolean') out[field] = value
  }
  return out
}
