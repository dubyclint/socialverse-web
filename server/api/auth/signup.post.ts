// File: /server/api/auth/signup.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createClient } from '@supabase/supabase-js'

interface SignupRequest {
  email: string
  username: string
  password: string
}

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
  ])
}

export default defineEventHandler(async (event) => {
  console.log('[Signup API] ============ SIGNUP PIPELINE START ============')

  try {
    const body = await readBody<SignupRequest>(event)
    console.log('[Signup API] Step 1: Body parsed successfully -> User:', body.username)

    if (!body.email || !body.username || !body.password) {
      console.error('[Signup API] Missing required core fields')
      return { success: false, error: 'Email, username, and password are required.' }
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Signup API] ❌ CRITICAL: Configuration variables missing on host system.')
      return { success: false, error: 'Server configuration error.' }
    }

    // Using service role to securely verify and write data across RLS barriers
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    console.log('[Signup API] Step 2: Client built. Launching availability check...')

    // === BREAKPOINT 1: USERNAME AVAILABILITY CHECK ===
    let existingUsers: any[] | null = null
    try {
      const queryPromise = supabase.from('user').select('username').eq('username', body.username).limit(1)
      const response = await withTimeout(queryPromise, 4000, 'DATABASE_QUERY_TIMEOUT_HANG')
      existingUsers = response.data
      
      if (response.error) {
        console.error('[Signup API] ❌ Breakpoint 1 Failed: user table lookup ->', response.error)
        return { success: false, error: 'Database verification failed' }
      }
    } catch (timeoutErr: any) {
      console.error('[Signup API] Username check error:', timeoutErr)
      return { success: false, error: 'Database connection timeout.' }
    }

    if (existingUsers && existingUsers.length > 0) {
      console.error('[Signup API] ❌ Username already taken:', body.username)
      return { success: false, error: 'Username already taken' }
    }
    console.log('[Signup API] Step 3: Username is available.')

    // === BREAKPOINT 2: AUTH ACCOUNT CREATION ===
    console.log('[Signup API] Step 4: Dispatching standard auth.signUp...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          username: body.username
        }
      }
    })

    if (authError) {
      console.error('[Signup API] ❌ Breakpoint 2 Failed: Auth Engine Rejected ->', authError)
      return { success: false, error: authError.message }
    }
    
    if (!authData.user || !authData.session) {
      console.error('[Signup API] ❌ Breakpoint 2 Failed: Null user or session instance.')
      return { success: false, error: 'Account setup failed.' }
    }
    
    const userId = authData.user.id
    const freshToken = authData.session.access_token
    console.log('[Signup API] Step 5: Auth instance created safely. ID:', userId)

    // === BREAKPOINT 3: SCHEMA-PERFECT "user" TABLE ROW INSERTION ===
    console.log('[Signup API] Step 6: Injecting row into verified "user" columns...')
    const { error: insertError } = await supabase
      .from('user')
      .insert([
        {
          user_id: userId, 
          username: body.username.toLowerCase().trim(),
          display_name: body.username.trim(), 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])

    if (insertError) {
      console.error('[Signup API] ❌ Breakpoint 3 Failed: "user" table insertion error ->', insertError)
      await supabase.auth.admin.deleteUser(userId) // Rollback
      return { success: false, error: `Database initialization fault: ${insertError.message}` }
    }

    console.log('[Signup API] ✅ User table row successfully committed.')
    console.log('[Signup API] ============ SIGNUP PIPELINE END ============')

    return { 
      success: true, 
      message: 'Account created successfully',
      token: freshToken,
      user: {
        id: userId,
        email: authData.user.email!,
        username: body.username
      },
      redirectTo: '/feed'
    }

  } catch (err: any) {
    console.error('[Signup API] 💥 Fatal Exception Catch-All ->', err)
    return { success: false, error: err.message || 'Pipeline Exception' }
  }
})
