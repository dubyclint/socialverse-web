// ============================================================================    
// FILE: /server/api/auth/refresh.ts    
// ============================================================================    
// Endpoint to refresh expired access tokens using refresh token    
// ============================================================================    
import { getSupabaseAdmin } from '~/server/utils/supabase'  
export default defineEventHandler(async (event) => {    
  console.log('[Auth Refresh] ============ REFRESH TOKEN START ============')    
      
  try {    
    const body = await readBody(event)    
    const { refresh_token } = body    
        
    if (!refresh_token) {    
      console.error('[Auth Refresh] ❌ No refresh token provided')    
      throw createError({    
        statusCode: 400,    
        statusMessage: 'Refresh token is required'    
      })    
    }    
        
    console.log('[Auth Refresh] Refresh token provided (first 20 chars):',     
      refresh_token.substring(0, 20) + '...')    
        
    // ✅ FIXED: Use server-side Supabase client instead of frontend composable  
    const supabase = await getSupabaseAdmin()    
        
    const { data, error } = await supabase.auth.refreshSession({    
      refresh_token    
    })    
        
    if (error || !data.session) {    
      console.error('[Auth Refresh] ❌ Refresh failed:', error?.message)    
      throw createError({    
        statusCode: 401,    
        statusMessage: 'Failed to refresh token'    
      })    
    }    
        
    console.log('[Auth Refresh] ✅ Token refreshed successfully')    
    console.log('[Auth Refresh] ============ REFRESH TOKEN END ============')    
        
    return {    
      success: true,    
      token: data.session.access_token,    
      refreshToken: data.session.refresh_token,    
      expiresIn: data.session.expires_in    
    }    
  } catch (err: any) {    
    console.error('[Auth Refresh] ❌ Error:', err.message)    
    console.log('[Auth Refresh] ============ REFRESH TOKEN ERROR END ============')    
        
    throw createError({    
      statusCode: err.statusCode || 500,    
      statusMessage: err.message || 'Token refresh failed'    
    })    
  }    
})  
