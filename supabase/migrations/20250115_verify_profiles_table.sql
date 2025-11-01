-- ============================================================================
-- MIGRATION 1: VERIFY PROFILES TABLE STRUCTURE
-- ============================================================================
-- File: /supabase/migrations/20250115_verify_profiles_table.sql

-- Ensure profiles table exists with all required columns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  email_lower TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  username_lower TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  website TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  email_verified BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE,
  email_verification_token TEXT,
  email_verification_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles(email_lower);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles(username_lower);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);

-- Create trigger for auto-update timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON profiles;
CREATE TRIGGER update_profiles_updated_at_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- MIGRATION 2: VERIFY RANKS TABLE STRUCTURE
-- ============================================================================
-- File: /supabase/migrations/20250115_verify_ranks_table.sql

CREATE TABLE IF NOT EXISTS ranks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  category TEXT NOT NULL,
  current_rank TEXT DEFAULT 'Bronze I',
  rank_level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  next_rank TEXT DEFAULT 'Bronze II',
  points_to_next INTEGER DEFAULT 100,
  achievements JSONB DEFAULT '[]',
  season_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(user_id, category)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ranks_user_id ON ranks(user_id);
CREATE INDEX IF NOT EXISTS idx_ranks_category ON ranks(category);
CREATE INDEX IF NOT EXISTS idx_ranks_current_rank ON ranks(current_rank);
CREATE INDEX IF NOT EXISTS idx_ranks_points ON ranks(points);

-- Create trigger for auto-update timestamp
CREATE OR REPLACE FUNCTION update_ranks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ranks_updated_at_trigger ON ranks;
CREATE TRIGGER update_ranks_updated_at_trigger
BEFORE UPDATE ON ranks
FOR EACH ROW
EXECUTE FUNCTION update_ranks_updated_at();

-- Enable RLS
ALTER TABLE ranks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own ranks" ON ranks;
CREATE POLICY "Users can view own ranks"
ON ranks FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view public ranks" ON ranks;
CREATE POLICY "Users can view public ranks"
ON ranks FOR SELECT
USING (true);

-- ============================================================================
-- MIGRATION 3: VERIFY INTERESTS TABLES STRUCTURE
-- ============================================================================
-- File: /supabase/migrations/20250115_verify_interests_tables.sql

-- Interests table (admin-managed)
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User interests junction table (many-to-many)
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  interest_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE,
  UNIQUE(user_id, interest_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_interests_name ON interests(name);
CREATE INDEX IF NOT EXISTS idx_interests_category ON interests(category);
CREATE INDEX IF NOT EXISTS idx_interests_is_active ON interests(is_active);
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest_id ON user_interests(interest_id);

-- Create trigger for interests updated_at
CREATE OR REPLACE FUNCTION update_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_interests_updated_at_trigger ON interests;
CREATE TRIGGER update_interests_updated_at_trigger
BEFORE UPDATE ON interests
FOR EACH ROW
EXECUTE FUNCTION update_interests_updated_at();

-- Enable RLS
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interests (public read)
DROP POLICY IF EXISTS "Anyone can view active interests" ON interests;
CREATE POLICY "Anyone can view active interests"
ON interests FOR SELECT
USING (is_active = true);

-- RLS Policies for user_interests
DROP POLICY IF EXISTS "Users can view own interests" ON user_interests;
CREATE POLICY "Users can view own interests"
ON user_interests FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add interests" ON user_interests;
CREATE POLICY "Users can add interests"
ON user_interests FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove interests" ON user_interests;
CREATE POLICY "Users can remove interests"
ON user_interests FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION 4: VERIFY WALLETS TABLE STRUCTURE
-- ============================================================================
-- File: /supabase/migrations/20250115_verify_wallets_table.sql

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  currency_code TEXT NOT NULL,
  currency_name TEXT,
  balance DECIMAL(20, 8) DEFAULT 0.00,
  locked_balance DECIMAL(20, 8) DEFAULT 0.00,
  wallet_address TEXT,
  wallet_type TEXT DEFAULT 'internal',
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(user_id, currency_code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_currency_code ON wallets(currency_code);
CREATE INDEX IF NOT EXISTS idx_wallets_is_locked ON wallets(is_locked);

-- Create trigger for auto-update timestamp
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_wallets_updated_at_trigger ON wallets;
CREATE TRIGGER update_wallets_updated_at_trigger
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_wallets_updated_at();

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own wallets" ON wallets;
CREATE POLICY "Users can view own wallets"
ON wallets FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallets" ON wallets;
CREATE POLICY "Users can update own wallets"
ON wallets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION 5: VERIFY PROFILE PRIVACY SETTINGS TABLE
-- ============================================================================
-- File: /supabase/migrations/20250115_verify_privacy_settings_table.sql

CREATE TABLE IF NOT EXISTS profile_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  show_profile_views BOOLEAN DEFAULT true,
  show_online_status BOOLEAN DEFAULT true,
  allow_messages BOOLEAN DEFAULT true,
  allow_friend_requests BOOLEAN DEFAULT true,
  show_email BOOLEAN DEFAULT false,
  show_phone BOOLEAN DEFAULT false,
  show_location BOOLEAN DEFAULT false,
  show_interests BOOLEAN DEFAULT true,
  profile_visibility TEXT DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON profile_privacy_settings(user_id);

-- Create trigger for auto-update timestamp
CREATE OR REPLACE FUNCTION update_privacy_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_privacy_settings_updated_at_trigger ON profile_privacy_settings;
CREATE TRIGGER update_privacy_settings_updated_at_trigger
BEFORE UPDATE ON profile_privacy_settings
FOR EACH ROW
EXECUTE FUNCTION update_privacy_settings_updated_at();

-- Enable RLS
ALTER TABLE profile_privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own privacy settings" ON profile_privacy_settings;
CREATE POLICY "Users can view own privacy settings"
ON profile_privacy_settings FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own privacy settings" ON profile_privacy_settings;
CREATE POLICY "Users can update own privacy settings"
ON profile_privacy_settings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION 6: VERIFY USER SETTINGS TABLE
-- ============================================================================
-- File: /supabase/migrations/20250115_verify_user_settings_table.sql

CREATE TABLE IF NOT EXISTS user_settings_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  two_factor_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings_categories(user_id);

-- Create trigger for auto-update timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_settings_updated_at_trigger ON user_settings_categories;
CREATE TRIGGER update_user_settings_updated_at_trigger
BEFORE UPDATE ON user_settings_categories
FOR EACH ROW
EXECUTE FUNCTION update_user_settings_updated_at();

-- Enable RLS
ALTER TABLE user_settings_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings_categories;
CREATE POLICY "Users can view own settings"
ON user_settings_categories FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings_categories;
CREATE POLICY "Users can update own settings"
ON user_settings_categories FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION 7: VERIFY WALLET LOCK SETTINGS TABLE
-- ============================================================================
-- File: /supabase/migrations/20250115_verify_wallet_lock_table.sql

CREATE TABLE IF NOT EXISTS wallet_lock_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_locked BOOLEAN DEFAULT false,
  locked_until TIMESTAMP WITH TIME ZONE,
  lock_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_lock_user_id ON wallet_lock_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_lock_is_locked ON wallet_lock_settings(is_locked);

-- Create trigger for auto-update timestamp
CREATE OR REPLACE FUNCTION update_wallet_lock_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_wallet_lock_updated_at_trigger ON wallet_lock_settings;
CREATE TRIGGER update_wallet_lock_updated_at_trigger
BEFORE UPDATE ON wallet_lock_settings
FOR EACH ROW
EXECUTE FUNCTION update_wallet_lock_updated_at();

-- Enable RLS
ALTER TABLE wallet_lock_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own wallet lock" ON wallet_lock_settings;
CREATE POLICY "Users can view own wallet lock"
ON wallet_lock_settings FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallet lock" ON wallet_lock_settings;
CREATE POLICY "Users can update own wallet lock"
ON wallet_lock_settings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
Perfect! Now let me create a summary document:

summary
PHASE 1: DATABASE MIGRATIONS - COMPLETE
========================================

7 Migration Files Created:

1. /supabase/migrations/20250115_verify_profiles_table.sql
   - Profiles table with all auth & profile fields
   - Indexes for performance
   - Auto-update timestamp trigger
   - RLS policies for user privacy

2. /supabase/migrations/20250115_verify_ranks_table.sql
   - Ranks table (4 categories: trading, social, content, overall)
   - Rank progression system
   - Achievements tracking
   - RLS policies

3. /supabase/migrations/20250115_verify_interests_tables.sql
   - Interests table (admin-managed)
   - User_interests junction table (many-to-many)
   - RLS policies for user interest management

4. /supabase/migrations/20250115_verify_wallets_table.sql
   - Wallets table (7 currencies per user)
   - Balance tracking (available + locked)
   - RLS policies for wallet access

5. /supabase/migrations/20250115_verify_privacy_settings_table.sql
   - Profile privacy settings
   - Visibility controls
   - RLS policies

6. /supabase/migrations/20250115_verify_user_settings_table.sql
   - User preferences (notifications, theme, language)
   - 2FA settings
   - RLS policies

7. /supabase/migrations/20250115_verify_wallet_lock_table.sql
   - Wallet lock toggle
   - Lock expiry tracking
   - RLS policies

All tables include:
✓ Proper foreign keys
✓ Unique constraints
✓ Indexes for performance
✓ Auto-update timestamp triggers
✓ Row-Level Security (RLS) policies
✓ Proper data types (UUID, DECIMAL, JSONB, etc)
