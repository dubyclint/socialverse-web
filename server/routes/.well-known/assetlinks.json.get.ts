/**
 * Android App Links verification file.
 * The signing-certificate fingerprint is environment-provided so the release
 * keystore never enters the repo; until it is set the route reports that App
 * Links are not configured rather than serving a fingerprint that would fail
 * verification.
 */
export default defineEventHandler((event) => {
  const packageName = process.env.ANDROID_PACKAGE_NAME || 'com.viorp.app'
  const fingerprints = (process.env.ANDROID_CERT_SHA256 || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  if (fingerprints.length === 0) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Android App Links not configured: set ANDROID_CERT_SHA256'
    })
  }

  setHeader(event, 'content-type', 'application/json')

  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints
      }
    }
  ]
})
