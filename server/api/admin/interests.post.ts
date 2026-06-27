import { serverSupabaseClient } from '#supabase/server'

interface InterestRequest {
  action: 'create' | 'update' | 'delete' | 'toggle'
  interest?: {
    id?: string
    name: string
    description?: string
    category?: string
    icon?: string
    is_active?: boolean
  }
  interest_id?: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<InterestRequest>(event)
    
    // Check if user is admin (you'll need to implement this based on your auth system)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    // Check admin role (adjust this query based on your user roles structure)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }
    
    let result
    
    switch (body.action) {
      case 'create':
        if (!body.interest?.name) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Interest name is required'
          })
        }
        
        const { data: newInterest, error: createError } = await supabase
          .from('interests')
          .insert({
            name: body.interest.name,
            description: body.interest.description || '',
            category: body.interest.category || 'general',
            icon: body.interest.icon || '',
            is_active: body.interest.is_active ?? true,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (createError) {
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create interest',
            data: createError
          })
        }
        
        result = { interest: newInterest, message: 'Interest created successfully' }
        break
        
      case 'update':
        if (!body.interest?.id) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Interest ID is required for update'
          })
        }
        
        const updateData: any = {}
        if (body.interest.name) updateData.name = body.interest.name
        if (body.interest.description !== undefined) updateData.description = body.interest.description
        if (body.interest.category) updateData.category = body.interest.category
        if (body.interest.icon !== undefined) updateData.icon = body.interest.icon
        if (body.interest.is_active !== undefined) updateData.is_active = body.interest.is_active
        updateData.updated_at = new Date().toISOString()
        
        const { data: updatedInterest, error: updateError } = await supabase
          .from('interests')
          .update(updateData)
          .eq('id', body.interest.id)
          .select()
          .single()
        
        if (updateError) {
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update interest',
            data: updateError
          })
        }
        
        result = { interest: updatedInterest, message: 'Interest updated successfully' }
        break
        
      case 'delete':
        if (!body.interest_id) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Interest ID is required for deletion'
          })
        }
        
        // Check if interest is being used by users
        const { data: userInterests } = await supabase
          .from('user_interests')
          .select('id')
          .eq('interest_id', body.interest_id)
          .limit(1)
        
        if (userInterests && userInterests.length > 0) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Cannot delete interest that is currently being used by users'
          })
        }
        
        const { error: deleteError } = await supabase
          .from('interests')
          .delete()
          .eq('id', body.interest_id)
        
        if (deleteError) {
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete interest',
            data: deleteError
          })
        }
        
        result = { message: 'Interest deleted successfully' }
        break
        
      case 'toggle':
        if (!body.interest_id) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Interest ID is required for toggle'
          })
        }
        
        // Get current status
        const { data: currentInterest } = await supabase
          .from('interests')
          .select('is_active')
          .eq('id', body.interest_id)
          .single()
        
        if (!currentInterest) {
          throw createError({
            statusCode: 404,
            statusMessage: 'Interest not found'
          })
        }
        
        const { data: toggledInterest, error: toggleError } = await supabase
          .from('interests')
          .update({ 
            is_active: !currentInterest.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', body.interest_id)
          .select()
          .single()
        
        if (toggleError) {
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to toggle interest status',
            data: toggleError
          })
        }
        
        result = { 
          interest: toggledInterest, 
          message: `Interest ${toggledInterest.is_active ? 'activated' : 'deactivated'} successfully` 
        }
        break
        
      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid action. Use: create, update, delete, or toggle'
        })
    }
    
    return {
      success: true,
      data: result
    }
    
  } catch (error) {
    console.error('Admin interests error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: error
    })
  }
})
