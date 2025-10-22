import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_KEY environment variables are required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigrations() {
  try {
    console.log('🔄 Starting Supabase migrations...')

    // Migration 1: Create users table
    console.log('📝 Creating users table...')
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT NOT NULL UNIQUE,
          email TEXT UNIQUE,
          avatar TEXT,
          bio TEXT,
          verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `
    })
    if (usersError) console.warn('⚠️ Users table:', usersError.message)
    else console.log('✅ Users table created')

    // Migration 2: Create posts table
    console.log('📝 Creating posts table...')
    const { error: postsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          pews INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          shares_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
      `
    })
    if (postsError) console.warn('⚠️ Posts table:', postsError.message)
    else console.log('✅ Posts table created')

    // Migration 3: Create trades table
    console.log('📝 Creating trades table...')
    const { error: tradesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS trades (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          item TEXT NOT NULL,
          amount DECIMAL(18, 8),
          currency TEXT DEFAULT 'USD',
          status TEXT DEFAULT 'pending',
          escrow BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_trades_buyer_id ON trades(buyer_id);
        CREATE INDEX IF NOT EXISTS idx_trades_seller_id ON trades(seller_id);
        CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
      `
    })
    if (tradesError) console.warn('⚠️ Trades table:', tradesError.message)
    else console.log('✅ Trades table created')

    // Migration 4: Create escrow_trades table
    console.log('📝 Creating escrow_trades table...')
    const { error: escrowError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS escrow_trades (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount DECIMAL(18, 8) NOT NULL,
          token TEXT NOT NULL,
          trade_id TEXT NOT NULL UNIQUE,
          is_released BOOLEAN DEFAULT false,
          is_refunded BOOLEAN DEFAULT false,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_escrow_buyer_id ON escrow_trades(buyer_id);
        CREATE INDEX IF NOT EXISTS idx_escrow_seller_id ON escrow_trades(seller_id);
        CREATE INDEX IF NOT EXISTS idx_escrow_trade_id ON escrow_trades(trade_id);
      `
    })
    if (escrowError) console.warn('⚠️ Escrow trades table:', escrowError.message)
    else console.log('✅ Escrow trades table created')

    // Migration 5: Create user_wallets table
    console.log('📝 Creating user_wallets table...')
    const { error: walletsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_wallets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          balances JSONB DEFAULT '{"usdt": 0, "usdc": 0, "btc": 0, "eth": 0, "sol": 0, "matic": 0, "xaut": 0}',
          extra_wallets JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON user_wallets(user_id);
      `
    })
    if (walletsError) console.warn('⚠️ User wallets table:', walletsError.message)
    else console.log('✅ User wallets table created')

    // Migration 6: Create policies table
    console.log('📝 Creating policies table...')
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS policies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          feature TEXT NOT NULL,
          priority TEXT DEFAULT 'MEDIUM',
          status TEXT DEFAULT 'DRAFT',
          rules JSONB NOT NULL,
          target_criteria JSONB,
          created_by TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_policies_feature ON policies(feature);
        CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
      `
    })
    if (policiesError) console.warn('⚠️ Policies table:', policiesError.message)
    else console.log('✅ Policies table created')

    // Migration 7: Create compliance_rules table
    console.log('📝 Creating compliance_rules table...')
    const { error: complianceError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS compliance_rules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          feature TEXT NOT NULL,
          is_allowed BOOLEAN DEFAULT true,
          restrictions TEXT[] DEFAULT '{}',
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_compliance_user_id ON compliance_rules(user_id);
        CREATE INDEX IF NOT EXISTS idx_compliance_feature ON compliance_rules(feature);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_unique ON compliance_rules(user_id, feature);
      `
    })
    if (complianceError) console.warn('⚠️ Compliance rules table:', complianceError.message)
    else console.log('✅ Compliance rules table created')

    // Migration 8: Create audit_logs table
    console.log('📝 Creating audit_logs table...')
    const { error: auditError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type TEXT NOT NULL,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          feature TEXT NOT NULL,
          result TEXT NOT NULL,
          reason TEXT,
          context JSONB,
          policies TEXT[] DEFAULT '{}',
          ip TEXT,
          user_agent TEXT,
          country TEXT,
          region TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_feature ON audit_logs(feature);
        CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
      `
    })
    if (auditError) console.warn('⚠️ Audit logs table:', auditError.message)
    else console.log('✅ Audit logs table created')

    // Migration 9: Create chat_sessions table
    console.log('📝 Creating chat_sessions table...')
    const { error: chatError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id TEXT NOT NULL UNIQUE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          agent_id TEXT,
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP,
          status TEXT DEFAULT 'open',
          messages JSONB DEFAULT '[]',
          escalated_to TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_status ON chat_sessions(status);
      `
    })
    if (chatError) console.warn('⚠️ Chat sessions table:', chatError.message)
    else console.log('✅ Chat sessions table created')

    // Migration 10: Create ab_tests table
    console.log('📝 Creating ab_tests table...')
    const { error: abtestError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS ab_tests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          feature TEXT NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          target_criteria JSONB,
          variants JSONB NOT NULL,
          status TEXT DEFAULT 'ACTIVE',
          created_by TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_abtest_feature ON ab_tests(feature);
        CREATE INDEX IF NOT EXISTS idx_abtest_status ON ab_tests(status);
      `
    })
    if (abtestError) console.warn('⚠️ A/B tests table:', abtestError.message)
    else console.log('✅ A/B tests table created')

    // Migration 11: Create agent_statuses table
    console.log('📝 Creating agent_statuses table...')
    const { error: agentError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS agent_statuses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id TEXT NOT NULL UNIQUE,
          online BOOLEAN DEFAULT false,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          current_sessions INTEGER DEFAULT 0,
          max_sessions INTEGER DEFAULT 5,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_agent_online ON agent_statuses(online);
      `
    })
    if (agentError) console.warn('⚠️ Agent statuses table:', agentError.message)
    else console.log('✅ Agent statuses table created')

    // Migration 12: Create fee_settings table
    console.log('📝 Creating fee_settings table...')
    const { error: feeError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS fee_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type TEXT NOT NULL UNIQUE,
          maker_percent DECIMAL(5, 2),
          taker_percent DECIMAL(5, 2),
          flat_fee DECIMAL(18, 8),
          user_revenue_share DECIMAL(5, 2),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_fee_type ON fee_settings(type);
      `
    })
    if (feeError) console.warn('⚠️ Fee settings table:', feeError.message)
    else console.log('✅ Fee settings table created')

    // Migration 13: Create live_chat_configs table
    console.log('📝 Creating live_chat_configs table...')
    const { error: chatConfigError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS live_chat_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          method TEXT NOT NULL,
          label TEXT NOT NULL,
          script TEXT,
          url TEXT,
          active BOOLEAN DEFAULT true,
          region TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_chat_config_active ON live_chat_configs(active);
      `
    })
    if (chatConfigError) console.warn('⚠️ Live chat configs table:', chatConfigError.message)
    else console.log('✅ Live chat configs table created')

    // Migration 14: Create premium_access_rules table
    console.log('📝 Creating premium_access_rules table...')
    const { error: premiumError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS premium_access_rules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          target TEXT NOT NULL,
          value TEXT NOT NULL,
          features JSONB DEFAULT '{}',
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_premium_target ON premium_access_rules(target);
        CREATE INDEX IF NOT EXISTS idx_premium_active ON premium_access_rules(active);
      `
    })
    if (premiumError) console.warn('⚠️ Premium access rules table:', premiumError.message)
    else console.log('✅ Premium access rules table created')

    // Migration 15: Create support_agents table
    console.log('📝 Creating support_agents table...')
    const { error: supportAgentError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS support_agents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          contact TEXT NOT NULL,
          method TEXT NOT NULL,
          assigned_features TEXT[] DEFAULT '{}',
          region TEXT,
          active BOOLEAN DEFAULT true,
          last_seen TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_support_agent_active ON support_agents(active);
      `
    })
    if (supportAgentError) console.warn('⚠️ Support agents table:', supportAgentError.message)
    else console.log('✅ Support agents table created')

    // Migration 16: Create support_contacts table
    console.log('📝 Creating support_contacts table...')
    const { error: supportContactError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS support_contacts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          label TEXT NOT NULL,
          value TEXT NOT NULL,
          type TEXT NOT NULL,
          region TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_support_contact_type ON support_contacts(type);
      `
    })
    if (supportContactError) console.warn('⚠️ Support contacts table:', supportContactError.message)
    else console.log('✅ Support contacts table created')

    // Migration 17: Create terms_and_policies table
    console.log('📝 Creating terms_and_policies table...')
    const { error: termsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS terms_and_policies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          feature TEXT NOT NULL UNIQUE,
          content TEXT NOT NULL,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by TEXT NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_terms_feature ON terms_and_policies(feature);
      `
    })
    if (termsError) console.warn('⚠️ Terms and policies table:', termsError.message)
    else console.log('✅ Terms and policies table created')

    // Migration 18: Create translations table
    console.log('📝 Creating translations table...')
    const { error: translationError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS translations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key TEXT NOT NULL,
          language TEXT NOT NULL,
          value TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by TEXT NOT NULL
        );
        
        CREATE UNIQUE INDEX IF NOT EXISTS idx_translation_unique ON translations(key, language);
      `
    })
    if (translationError) console.warn('⚠️ Translations table:', translationError.message)
    else console.log('✅ Translations table created')

    // Migration 19: Create user_settings table
    console.log('📝 Creating user_settings table...')
    const { error: userSettingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          key TEXT NOT NULL,
          value JSONB,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_unique ON user_settings(user_id, key);
      `
    })
    if (userSettingsError) console.warn('⚠️ User settings table:', userSettingsError.message)
    else console.log('✅ User settings table created')

    // Migration 20: Create global_settings table
    console.log('📝 Creating global_settings table...')
    const { error: globalSettingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS global_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key TEXT NOT NULL UNIQUE,
          value JSONB,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by TEXT NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_global_settings_key ON global_settings(key);
      `
    })
    if (globalSettingsError) console.warn('⚠️ Global settings table:', globalSettingsError.message)
    else console.log('✅ Global settings table created')

    // Migration 21: Create user_overrides table
    console.log('📝 Creating user_overrides table...')
    const { error: overridesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_overrides (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          override_type TEXT NOT NULL,
          key TEXT NOT NULL,
          value JSONB,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          admin_id TEXT NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_override_user_id ON user_overrides(user_id);
        CREATE INDEX IF NOT EXISTS idx_override_type ON user_overrides(override_type);
      `
    })
    if (overridesError) console.warn('⚠️ User overrides table:', overridesError.message)
    else console.log('✅ User overrides table created')

    console.log('\n✅ All migrations completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  }
}

runMigrations()

