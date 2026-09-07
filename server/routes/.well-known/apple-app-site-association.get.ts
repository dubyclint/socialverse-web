/**
 * iOS Universal Links association file. Must be served as application/json with
 * no extension. The Apple team ID is environment-provided.
 */
export default defineEventHandler((event) => {
  const teamId = process.env.APPLE_TEAM_ID
  const bundleId = process.env.IOS_BUNDLE_ID || 'com.viorp.app'

  if (!teamId) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Universal Links not configured: set APPLE_TEAM_ID'
    })
  }

  setHeader(event, 'content-type', 'application/json')

  return {
    applinks: {
      apps: [],
      details: [
        {
          appID: `${teamId}.${bundleId}`,
          paths: ['NOT /api/*', 'NOT /admin/*', '*']
        }
      ]
    },
    webcredentials: {
      apps: [`${teamId}.${bundleId}`]
    }
  }
})
