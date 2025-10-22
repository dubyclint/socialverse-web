export default defineEventHandler(async (event) => {
  return {
    status: 'OK',
    service: 'Socialverse API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Compliance Management',
      'Policy Management',
      'User Restrictions',
      'Supabase Integration'
    ]
  }
})
