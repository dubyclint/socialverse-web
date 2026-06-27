export default defineEventHandler(async (event) => {
  const { requireRole, removeManagerRole } = useRBAC()
  
  requireRole('admin')
  
  const managerId = getRouterParam(event, 'id')
  
  if (!managerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Manager ID is required'
    })
  }
  
  try {
    const result = await removeManagerRole(managerId)
    
    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: result.error
      })
    }
    
    return {
      success: true,
      message: 'Manager role removed successfully'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to remove manager role'
    })
  }
})
