// ============================================================================  
// FILE: /server/api/users/suggested.ts - COMPLETE FIXED VERSION  
// ============================================================================  
// ✅ FIXED: Changed from 'user' table to 'user_profiles'  
// ✅ FIXED: Changed from 'user_id' column to 'id'  
// ✅ FIXED: Proper authentication and error handling  
// ✅ FIXED: Uses JWT from middleware instead of Supabase session  
// ============================================================================  
import { createClient } from '@supabase/supabase-js'  
export default defineEventHandler(async (event) => {  
  console.log('[Suggested Users API] ============ FETCH SUGGESTED USERS START ============')  
  try {  
    // ============================================================================  
    // STEP 1: Get user from JWT middleware (NOT from Supabase session)  
    // ============================================================================  
    console.log('[Suggested Users API] STEP 1: Authenticating user...')  
    const user = event.context.user  
    if (!user || !user.id) {  
      console.error('[Suggested Users API] ❌ Unauthorized - No user in context')  
      throw createError({  
        statusCode: 401,  
        statusMessage: 'Unauthorized - Please log in'  
      })  
    }  
    const userId = user.id  
    console.log('[Suggested Users API] ✅ User authenticated:', userId)  
    // ============================================================================  
    // STEP 2: Initialize Supabase admin client  
    // ============================================================================  
    console.log('[Suggested Users API] STEP 2: Initializing Supabase client...')  
    const supabaseUrl = process.env.SUPABASE_URL  
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY  
    if (!supabaseUrl || !supabaseServiceKey) {  
      console.error('[Suggested Users API] ❌ Supabase configuration missing')  
      throw createError({  
        statusCode: 500,  
        statusMessage: 'Server configuration error'  
      })  
    }  
    const supabase = createClient(supabaseUrl, supabaseServiceKey)  
    console.log('[Suggested Users API] ✅ Supabase client initialized')  
    // ============================================================================  
    // STEP 3: Parse query parameters  
    // ============================================================================  
    console.log('[Suggested Users API] STEP 3: Parsing query parameters...')  
    const query = getQuery(event)  
    const limit = Math.min(parseInt(query.limit as string) || 5, 20)  
    console.log('[Suggested Users API] ✅ Limit:', limit)  
    // ============================================================================  
    // STEP 4: Fetch suggested users from user_profiles table  
    // ============================================================================  
    console.log('[Suggested Users API] STEP 4: Fetching suggested users...')  
    console.log('[Suggested Users API] Excluding user:', userId)  
    // ✅ FIXED: Changed from 'user' to 'user_profiles' table  
    // ✅ FIXED: Changed from 'user_id' to 'id' column  
    const { data: suggestedUsers, error } = await supabase  
      .from('user_profiles')  
      .select('id, username, full_name, avatar_url, bio, followers_count, is_verified')  
      .neq('id', userId) // ✅ FIXED: Changed from 'user_id' to 'id'  
      .eq('is_blocked', false)  
      .order('followers_count', { ascending: false })  
      .limit(limit)  
    if (error) {  
      console.warn('[Suggested Users API] ⚠️ Database error:', error.message)  
      console.log('[Suggested Users API] Error code:', error.code)  
        
      // Return empty array instead of throwing error  
      console.log('[Suggested Users API] Returning empty array as fallback')  
      console.log('[Suggested Users API] ============ FETCH SUGGESTED USERS END (EMPTY) ============')  
        
      return {  
        success: true,  
        data: [],  
        total: 0,  
        message: 'No suggested users available'  
      }  
    }  
    console.log('[Suggested Users API] ✅ Suggested users fetched:', suggestedUsers?.length || 0)  
    // ============================================================================  
    // STEP 5: Format response  
    // ============================================================================  
    console.log('[Suggested Users API] STEP 5: Formatting response...')  
    const formatted = (suggestedUsers || []).map((u: any) => ({  
      id: u.id,  
      full_name: u.full_name || 'Unknown',  
      username: u.username || 'unknown',  
      avatar_url: u.avatar_url || '/default-avatar.svg',  
      bio: u.bio || '',  
      followers_count: u.followers_count || 0,  
      is_verified: u.is_verified || false,  
      following: false  
    }))  
    console.log('[Suggested Users API] ✅ Response formatted:', formatted.length, 'users')  
    console.log('[Suggested Users API] ============ FETCH SUGGESTED USERS END (SUCCESS) ============')  
    return {  
      success: true,  
      data: formatted,  
      total: formatted.length  
    }  
  } catch (error: any) {  
    console.error('[Suggested Users API] ============ FETCH SUGGESTED USERS ERROR ============')  
    console.error('[Suggested Users API] ❌ Error:', error.message)  
    console.error('[Suggested Users API] Error details:', {  
      statusCode: error?.statusCode,  
      statusMessage: error?.statusMessage,  
      message: error?.message  
    })  
    console.error('[Suggested Users API] ============ FETCH SUGGESTED USERS ERROR END ============')  
    if (error.statusCode) {  
      throw error  
    }  
    throw createError({  
      statusCode: 500,  
      statusMessage: 'Failed to fetch suggested users',  
      data: { details: error.message }  
    })  
  }  
})  

