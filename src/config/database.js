const { Pool } = require('pg');
const logger = require('./logger');

let pool;

const connectDatabase = async () => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connected successfully');
    
    // Run migrations if needed
    await runMigrations();
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

const runMigrations = async () => {
  try {
    const client = await pool.connect();
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        feature VARCHAR(100) NOT NULL,
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        status VARCHAR(20) DEFAULT 'ACTIVE',
        rules JSONB NOT NULL,
        target_criteria JSONB DEFAULT '{}',
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL,
        user_id VARCHAR(255),
        feature VARCHAR(100),
        result VARCHAR(20),
        reason VARCHAR(255),
        context JSONB DEFAULT '{}',
        policies JSONB DEFAULT '[]',
        ip INET,
        user_agent TEXT,
        country VARCHAR(2),
        region VARCHAR(10),
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs_archive (
        LIKE audit_logs INCLUDING ALL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ab_tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        feature VARCHAR(100) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        target_criteria JSONB DEFAULT '{}',
        variants JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        stop_reason VARCHAR(255),
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS geo_restrictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        country VARCHAR(2) NOT NULL,
        region VARCHAR(10),
        feature VARCHAR(100) NOT NULL,
        restriction_type VARCHAR(50) NOT NULL,
        restriction_data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_feature ON audit_logs(feature)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_policies_feature ON policies(feature)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status)
    `);

    client.release();
    logger.info('Database migrations completed');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database not connected');
  }
  return pool;
};

module.exports = {
  connectDatabase,
  getPool,
  runMigrations
};
