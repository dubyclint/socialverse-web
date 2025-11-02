// FILE: /server/api/auth/logout.post.ts
// ============================================================================

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseStatus(event, 200)

  return {
    success: true,
    message: 'Logged out successfully'
  }
})
