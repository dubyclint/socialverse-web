// FILE: /server/api/auth/logout.post.ts
// User logout
// ============================================================================

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  
  try {
    console.log('[Logout] User logged out')
    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Logged out successfully'
    }
  } catch (error: any) {
    console.error('[Logout] Error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: 'Logout failed'
    }
  }
})

