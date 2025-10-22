export default defineEventHandler(async (event) => {
  // Clear auth token from client side (handled by frontend)
  // Optionally invalidate token on server side if using token blacklist
  
  return {
    success: true,
    message: 'Logged out successfully'
  }
})
