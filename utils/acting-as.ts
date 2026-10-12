export interface ActingAs {
  id: string
  type: 'USER' | 'PAGE'
}

let current: ActingAs | null = null

export const setActingAs = (actor: ActingAs | null) => {
  current = actor
}

/** Identity headers for every API request; empty when acting as the person. */
export const actingAsHeaders = (): Record<string, string> =>
  current && current.type === 'PAGE'
    ? { 'X-Acting-As-Actor-ID': current.id, 'X-Acting-As-Actor-Type': 'PAGE' }
    : {}

export const applyActingAs = (options: { headers?: HeadersInit }) => {
  const extra = actingAsHeaders()
  if (!Object.keys(extra).length) return
  const headers = new Headers(options.headers)
  for (const [k, v] of Object.entries(extra)) headers.set(k, v)
  options.headers = headers
}
