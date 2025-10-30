-- Fix case sensitivity issues with username and email checks
-- Migration: 006_fix_case_sensitivity
-- Created: 2024-01-21
-- Purpose: Ensure case-insensitive username and email lookups

-- Drop existing indexes
DROP INDEX IF EXISTS idx_profiles_username_lower;
DROP INDEX IF EXISTS idx_profiles_email_lower;

-- Create case-insensitive UNIQUE constraints using generated columns
-- First, add generated columns for lowercase values
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username_lower VARCHAR(100) GENERATED ALWAYS AS (LOWER(username)) STORED,
ADD COLUMN IF NOT EXISTS email_lower VARCHAR(255) GENERATED ALWAYS AS (LOWER(email)) STORED;

-- Create UNIQUE indexes on lowercase columns
CREATE UNIQUE INDEX idx_profiles_username_lower_unique ON profiles(username_lower);
CREATE UNIQUE INDEX idx_profiles_email_lower_unique ON profiles(email_lower);

-- Create regular indexes for faster lookups
CREATE INDEX idx_profiles_username_lower ON profiles(LOWER(username));
CREATE INDEX idx_profiles_email_lower ON profiles(LOWER(email));

-- Update RLS policies to allow public read access for username/email checks
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Allow unauthenticated users to check username availability
DROP POLICY IF EXISTS "Allow public username check" ON profiles;

CREATE POLICY "Allow public username check" ON profiles
    FOR SELECT 
    USING (true);

-- Ensure email and username are stored in lowercase
CREATE OR REPLACE FUNCTION normalize_profile_username_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.username := LOWER(TRIM(NEW.username));
    NEW.email := LOWER(TRIM(NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS normalize_profile_username_email_trigger ON profiles;

-- Create trigger to normalize username and email on insert/update
CREATE TRIGGER normalize_profile_username_email_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION normalize_profile_username_email();

SELECT 'Migration 006 completed: Fixed case sensitivity for username and email' as status;
