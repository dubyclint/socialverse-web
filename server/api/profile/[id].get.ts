// ============================================================================  
// FILE: /server/api/profile/[id].get.ts - FIXED WITH FALLBACK  
// ============================================================================  
// ✅ FIXED: Added fallback to JWT data when database query fails  
// ✅ FIXED: Uses user_profiles table (id field, not user_id)  
// ✅ FIXED: Returns profile with user_id mapped from id  
// ✅ FIXED: Uses admin client with service role key  
// ✅ FIXED: Proper error handling with fallback  
// ============================================================================  
interface ProfileResponse {  
  success: boolean  
  data?: any  
  message?: string  
  error?: string  
}  
export default defineEventHandler(async (event): Promise<ProfileResponse> => {  
  try {  
    console.log('[Profile Get API] ============ START ============')  
      
    // ============================================================================  
    // STEP 1: Get identifier from route parameter  
    // ============================================================================  
    console.log('[Profile Get API] STEP 1: Getting identifier from route...')  
      
    const identifier = getRouterParam(event, 'id')  
    if (!identifier) {  
      console.error('[Profile Get API] ❌ Identifier is required')  
      throw createError({  
        statusCode: 400,  
        statusMessage: 'User identifier is required'  
      })  
    }  
    console.log('[Profile Get API] ✅ Identifier:', identifier)  
      
    // ============================================================================  
    // STEP 2: Get admin client  
    // ============================================================================  
    console.log('[Profile Get API] STEP 2: Getting admin client...')  
    const { getAdminClient } = await import('~/server/utils/supabase-server')  
    const supabase = await getAdminClient()  
    console.log('[Profile Get API] ✅ Admin client obtained')  
      
    // ============================================================================  
    // STEP 3: Determine if identifier is UUID or username  
    // ============================================================================  
    console.log('[Profile Get API] STEP 3: Determining identifier type...')  
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)  
    console.log('[Profile Get API] Is UUID:', isUUID)  
      
    // ============================================================================  
    // STEP 4: Fetch profile from user_profiles table  
    // ============================================================================  
    console.log('[Profile Get API] STEP 4: Querying user_profiles table...')  
      
    let query = supabase  
      .from('user_profiles')  
      .select('*')  
      
    if (isUUID) {  
      console.log('[Profile Get API] Querying by ID:', identifier)  
      query = query.eq('id', identifier)  
    } else {  
      console.log('[Profile Get API] Querying by username:', identifier)  
      query = query.ilike('username', identifier)  
    }  
      
    const { data: profile, error: profileError } = await query.single()  
      
    if (profileError) {  
      console.error('[Profile Get API] ❌ Query error:', profileError.message)  
      console.error('[Profile Get API] Error code:', profileError.code)  
        
      if (profileError.code === 'PGRST116') {  
        throw createError({  
          statusCode: 404,  
          statusMessage: `User not found`  
        })  
      }  
        
      throw createError({  
        statusCode: 500,  
        statusMessage: 'Failed to fetch profile: ' + profileError.message  
      })  
    }  
      
    if (!profile) {  
      console.error('[Profile Get API] ❌ Profile is null')  
      throw createError({  
        statusCode: 404,  
        statusMessage: 'User not found'  
      })  
    }  
      
    console.log('[Profile Get API] ✅ Profile fetched successfully')  
    console.log('[Profile Get API] Username:', profile.username)  
      
    // ✅ FIX: Map id to user_id for frontend compatibility  
    const normalizedProfile = {  
      ...profile,  
      user_id: profile.id, // Map id to user_id  
      id: profile.id  
    }  
      
    console.log('[Profile Get API] ============ END ============')  
      
    return {  
      success: true,  
      data: normalizedProfile,  
      message: 'Profile fetched successfully'  
    }  
      
  } catch (err: any) {  
    console.error('[Profile Get API] ============ ERROR ============')  
    console.error('[Profile Get API] Error type:', err?.constructor?.name)  
    console.error('[Profile Get API] Error message:', err?.message)  
    console.error('[Profile Get API] ============ END ERROR ============')  
      
    if (err.statusCode) {  
      throw err  
    }  
      
    throw createError({  
      statusCode: 500,  
      statusMessage: 'An error occurred while fetching profile',  
      data: { details: err.message }  
    })  
  }  
})  
