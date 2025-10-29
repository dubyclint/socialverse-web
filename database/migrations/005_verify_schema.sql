-- Verify and fix schema consistency
-- Migration: 005_verify_schema
-- Created: 2024-01-20
-- Purpose: Ensure profiles table is the single source of truth for users

-- Drop any conflicting 'users' table if it exists
DROP TABLE IF EXISTS public.users CASCADE;

-- Verify profiles table has all required columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Drop existing constraints if they exist, then recreate them
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_unique;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_unique;

ALTER TABLE profiles
ADD CONSTRAINT profiles_email_unique UNIQUE (email),
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles(LOWER(email));

-- Verify foreign key constraints
ALTER TABLE posts
ADD CONSTRAINT posts_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE trades
ADD CONSTRAINT trades_buyer_id_fk FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE trades
ADD CONSTRAINT trades_seller_id_fk FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create new policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

SELECT 'Migration 005 completed: Schema verification and consistency check' as status;
