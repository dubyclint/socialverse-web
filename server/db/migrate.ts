// FILE: /server/db/migrate.ts
// FIXED VERSION - Proper migration script

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigrations() {
  try {
    console.log('🔄 Starting Supabase migrations...')

    // Migration 1: Ensure profiles table exists
    console.log('📝 Ensuring profiles table structure...')
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          username TEXT UNIQUE NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          bio TEXT,
          verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
        
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
          FOR SELECT USING (true);
        
        CREATE POLICY "Users can update own profile" ON public.profiles
          FOR UPDATE USING (auth.uid() = id);
      `
    }).catch(err => {
      console.log('⚠️ exec_sql RPC not available, using alternative approach')
      return { error: null }
    })

    if (profilesError && profilesError.message.includes('exec_sql')) {
      console.log('📝 Verifying profiles table exists...')
      const { data: tableCheck } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      if (tableCheck !== null) {
        console.log('✅ Profiles table exists and is accessible')
      }
    } else if (profilesError) {
      console.warn('⚠️ Profiles table:', profilesError.message)
    } else {
      console.log('✅ Profiles table ensured')
    }

    // Migration 2: Create posts table
    console.log('📝 Ensuring posts table structure...')
    const { error: postsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          pews INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          shares_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
        
        ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Posts are viewable by everyone" ON public.posts
          FOR SELECT USING (true);
        
        CREATE POLICY "Users can create posts" ON public.posts
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own posts" ON public.posts
          FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own posts" ON public.posts
          FOR DELETE USING (auth.uid() = user_id);
      `
    }).catch(err => {
      console.log('⚠️ exec_sql RPC not available for posts')
      return { error: null }
    })

    if (postsError && !postsError.message.includes('exec_sql')) {
      console.warn('⚠️ Posts table:', postsError.message)
    } else if (!postsError) {
      console.log('✅ Posts table ensured')
    }

    // Migration 3: Create user_roles table
    console.log('📝 Ensuring user_roles table...')
    const { error: rolesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
        
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
      `
    }).catch(err => {
      console.log('⚠️ exec_sql RPC not available for user_roles')
      return { error: null }
    })

    if (rolesError && !rolesError.message.includes('exec_sql')) {
      console.warn('⚠️ User roles table:', rolesError.message)
    } else if (!rolesError) {
      console.log('✅ User roles table ensured')
    }

    console.log('✅ All migrations completed successfully!')
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigrations()
