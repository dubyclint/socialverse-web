export default defineEventHandler(async (event) => {
  const { requireRole } = useRBAC()
  
  // Ensure only admins can access this endpoint
  requireRole('admin')
  
  const supabase = useSupabaseClient()
  
  try {
    const { data: managers, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        username,
        email,
        avatar_url,
        created_at,
        updated_at
      `)
      .eq('role', 'manager')
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: managers.map(manager => ({
        ...manager,
        assignedAt: manager.updated_at
      }))
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch managers'
    })
  }
})
