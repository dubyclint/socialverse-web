export default defineEventHandler(async (event) => {
  const { requireRole, assignManagerRole } = useRBAC()
  
  requireRole('admin')
  
  const body = await readBody(event)
  const { userId, permissions } = body
  
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }
  
  try {
    const result = await assignManagerRole(userId, permissions)
    
    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: result.error
      })
    }
    
    return {
      success: true,
      message: 'Manager role assigned successfully'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to assign manager role'
    })
  }
})
