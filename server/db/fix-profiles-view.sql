-- ============================================================================
-- FILE: /server/db/fix-profiles-view.sql
-- FIX PROFILES VIEW WITH INSTEAD OF TRIGGERS
-- ============================================================================
-- This script fixes the profiles view to be fully functional for INSERT/UPDATE/DELETE
-- The profiles view is read-only by default, so we add INSTEAD OF triggers
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify user table structure
-- ============================================================================
-- The user table should have these columns:
-- - user_id (UUID, PRIMARY KEY, references auth.users)
-- - username (TEXT, UNIQUE)
-- - display_name (TEXT)
-- - avatar_url (TEXT)
-- - bio (TEXT)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
-- Plus other columns for social features

-- ============================================================================
-- STEP 2: Drop existing view and recreate with proper structure
-- ============================================================================
DROP VIEW IF EXISTS profiles CASCADE;

CREATE VIEW profiles AS
SELECT 
  user_id AS id,
  user_id,
  username,
  display_name AS full_name,
  avatar_url,
  bio,
  created_at,
  updated_at
FROM "user"
WHERE user_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Create INSTEAD OF INSERT trigger for profiles view
-- ============================================================================
-- This allows INSERT into profiles view to actually INSERT into user table
CREATE OR REPLACE FUNCTION profiles_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "user" (
    user_id,
    username,
    display_name,
    avatar_url,
    bio,
    created_at,
    updated_at
  )
  VALUES (
    COALESCE(NEW.id, NEW.user_id),
    NEW.username,
    COALESCE(NEW.full_name, NEW.display_name),
    NEW.avatar_url,
    NEW.bio,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    updated_at = NOW()
  RETURNING * INTO NEW;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profiles_insert_trigger ON profiles;

CREATE TRIGGER profiles_insert_trigger
  INSTEAD OF INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_insert();

-- ============================================================================
-- STEP 4: Create INSTEAD OF UPDATE trigger for profiles view
-- ============================================================================
-- This allows UPDATE on profiles view to actually UPDATE user table
CREATE OR REPLACE FUNCTION profiles_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "user"
  SET
    username = COALESCE(NEW.username, OLD.username),
    display_name = COALESCE(NEW.full_name, NEW.display_name, OLD.display_name),
    avatar_url = COALESCE(NEW.avatar_url, OLD.avatar_url),
    bio = COALESCE(NEW.bio, OLD.bio),
    updated_at = NOW()
  WHERE user_id = (COALESCE(NEW.id, NEW.user_id, OLD.id, OLD.user_id));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profiles_update_trigger ON profiles;

CREATE TRIGGER profiles_update_trigger
  INSTEAD OF UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_update();

-- ============================================================================
-- STEP 5: Create INSTEAD OF DELETE trigger for profiles view
-- ============================================================================
-- This allows DELETE on profiles view to actually DELETE from user table
CREATE OR REPLACE FUNCTION profiles_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM "user"
  WHERE user_id = (COALESCE(OLD.id, OLD.user_id));
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profiles_delete_trigger ON profiles;

CREATE TRIGGER profiles_delete_trigger
  INSTEAD OF DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_delete();

-- ============================================================================
-- STEP 6: Create function to auto-create user profile on auth signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."user" (
    user_id,
    username,
    display_name,
    avatar_url,
    bio,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.user_metadata->>'username', NEW.email),
    COALESCE(NEW.user_metadata->>'full_name', NEW.email),
    NEW.user_metadata->>'avatar_url',
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Create trigger for auto-profile creation on auth signup
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- STEP 8: Verify RLS is enabled on user table
-- ============================================================================
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: Ensure proper RLS policies exist on user table
-- ============================================================================
-- Drop conflicting policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON "user";
DROP POLICY IF EXISTS "User profiles are viewable by everyone" ON "user";
DROP POLICY IF EXISTS "Users can insert own profile" ON "user";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "user";
DROP POLICY IF EXISTS "Users can update own profile" ON "user";
DROP POLICY IF EXISTS "Users can update their own profile" ON "user";
DROP POLICY IF EXISTS "Users can delete their own profile" ON "user";

-- Create unified RLS policies
CREATE POLICY "profiles_select_public" ON "user"
  FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_own" ON "user"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON "user"
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own" ON "user"
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 10: Create indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_username ON "user"(username);
CREATE INDEX IF NOT EXISTS idx_user_user_id ON "user"(user_id);
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "user"(created_at);

-- ============================================================================
-- STEP 11: Verify schema
-- ============================================================================
-- Run these to verify:
-- SELECT * FROM profiles LIMIT 1;
-- SELECT * FROM "user" LIMIT 1;
-- SELECT * FROM information_schema.views WHERE table_name = 'profiles';
