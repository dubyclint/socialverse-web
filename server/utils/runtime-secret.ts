/**
 * Runtime config is resolved when the bundle is built; hosts that only expose
 * variables to the running container (not the image build) leave it empty, so
 * fall back to the live process environment.
 */
export const runtimeSecret = (configured: unknown, ...envNames: string[]): string => {
  if (typeof configured === 'string' && configured.trim()) return configured.trim()
  for (const name of envNames) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
  return ''
}
